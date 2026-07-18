'use client'

import { createClient } from 'genlayer-js'
import { localnet, studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

type NetworkName = 'localnet' | 'studionet'
type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }

declare global {
  interface Window { ethereum?: EthereumProvider }
}

const network: NetworkName = process.env.NEXT_PUBLIC_NETWORK === 'localnet' ? 'localnet' : 'studionet'
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC
const chainMap = { localnet, studionet }
// Version the override so a stale address saved by an older release cannot
// silently redirect reviewer transactions away from the production contract.
const contractStorageKey = 'content-moderation-contract-address-v2'

type RuntimeClient = {
  connect?: (networkName: NetworkName) => Promise<unknown>
  readContract: (args: { address: unknown; functionName: string; args: unknown[] }) => Promise<unknown>
  writeContract: (args: { address: unknown; functionName: string; args: unknown[]; value: bigint }) => Promise<string>
  waitForTransactionReceipt: (args: { hash: `0x${string}`; status: string; interval?: number; retries?: number; fullTransaction?: boolean }) => Promise<ReceiptLike>
  getTransaction: (args: { hash: `0x${string}` }) => Promise<ReceiptLike>
}

type ReceiptLike = {
  statusName?: string
  txExecutionResultName?: string
  txDataDecoded?: unknown
  consensus_data?: {
    leader_receipt?: Array<{ result?: { payload?: { readable?: string } } }>
    validators?: Array<{ genvm_result?: { execution_result?: string; stderr?: string } }>
  }
}

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED_APPEALABLE' | 'NEEDS_REVIEW' | 'APPEAL_PENDING' | 'FINAL_APPROVED' | 'FINAL_REJECTED' | 'MANUAL_REVIEW'

export interface Submission {
  submission_id: bigint
  type: 'TEXT' | 'URL'
  content: string
  submitter: string
  timestamp: bigint
  status: ModerationStatus
  bond_status: 'LOCKED' | 'REFUNDED' | 'SLASHED'
  bond: bigint
  score: bigint
  category_scores: string
  reason: string
  evaluated_at: bigint
  appeal_deadline: bigint
  appeal_reason: string
  appeal_evidence: string
  appealed: bigint
}

export interface SystemState {
  submission_count: bigint
  settlement_count: bigint
  total_bonded: bigint
  total_refunded: bigint
  total_slashed: bigint
  treasury: string
}

export interface TransactionResult {
  success: boolean
  pending?: boolean
  hash?: string
  status?: string
  data?: unknown
  error?: string
}

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

function isRetryableRpcError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return ['Failed to fetch', '429', 'Too Many Requests', 'Server busy', 'fetch failed']
    .some((fragment) => message.toLowerCase().includes(fragment.toLowerCase()))
}

function receiptFailure(receipt: ReceiptLike): string | null {
  const readable = receipt.consensus_data?.leader_receipt?.[0]?.result?.payload?.readable
  if (readable) {
    try {
      const contractResult = JSON.parse(readable)
      const errorCodes = [
        'INVALID_', 'SUBMISSION_', 'NOT_', 'MODERATION_BOND_',
        'APPEAL_ALREADY_', 'APPEAL_WINDOW_', 'REJECTION_', 'BOND_',
      ]
      if (typeof contractResult === 'string' && errorCodes.some((prefix) => contractResult.startsWith(prefix))) {
        return `Contract rejected the request: ${contractResult}.`
      }
    } catch {
      // Older SDK receipts may expose a non-JSON readable value.
    }
  }

  const executions = receipt.consensus_data?.validators
    ?.map((validator) => validator.genvm_result)
    .filter((execution) => Boolean(execution?.execution_result)) || []
  if (executions.length > 0 && executions.every((execution) => execution?.execution_result === 'ERROR')) {
    const stderr = executions.find((execution) => execution?.stderr)?.stderr || ''
    const detail = stderr.trim().split('\n').filter(Boolean).at(-1) || 'GenVM execution failed.'
    return `Contract execution failed: ${detail}`
  }
  if (receipt.txExecutionResultName === 'FINISHED_WITH_ERROR') return 'The contract returned an execution error.'
  return null
}

function parseJson(value: unknown): any {
  if (typeof value !== 'string') return value
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'string' ? parseJson(parsed) : parsed
  } catch {
    return value
  }
}

function asBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.trunc(value))
  if (typeof value === 'string' && value.length > 0) return BigInt(value)
  return 0n
}

function normalizeSubmission(raw: unknown): Submission {
  const data = parseJson(raw)
  if (!data || typeof data !== 'object' || data.error) throw new Error(data?.error || 'Submission not found')
  return {
    submission_id: asBigInt(data.submission_id),
    type: data.type === 'URL' ? 'URL' : 'TEXT',
    content: String(data.content || ''),
    submitter: String(data.submitter || ''),
    timestamp: asBigInt(data.timestamp),
    status: String(data.status || 'PENDING') as ModerationStatus,
    bond_status: String(data.bond_status || 'LOCKED') as Submission['bond_status'],
    bond: asBigInt(data.bond),
    score: asBigInt(data.score),
    category_scores: typeof data.category_scores === 'string' ? data.category_scores : JSON.stringify(data.category_scores || {}),
    reason: String(data.reason || ''),
    evaluated_at: asBigInt(data.evaluated_at),
    appeal_deadline: asBigInt(data.appeal_deadline),
    appeal_reason: String(data.appeal_reason || ''),
    appeal_evidence: String(data.appeal_evidence || ''),
    appealed: asBigInt(data.appealed),
  }
}

function normalizeSystemState(raw: unknown): SystemState {
  const data = parseJson(raw) || {}
  return {
    submission_count: asBigInt(data.submission_count),
    settlement_count: asBigInt(data.settlement_count),
    total_bonded: asBigInt(data.total_bonded),
    total_refunded: asBigInt(data.total_refunded),
    total_slashed: asBigInt(data.total_slashed),
    treasury: String(data.treasury || ''),
  }
}

class GenLayerClient {
  private address: string
  private account = ''
  private readClient = createClient({ chain: chainMap[network], ...(endpoint ? { endpoint } : {}) })

  constructor(address: string) { this.address = address }

  getContractAddress() { return this.address }
  getNetworkName() { return network }
  getConnectedAccount() { return this.account || null }

  async initialize() {
    if (!window.ethereum) return
    const accounts = await window.ethereum.request({ method: 'eth_accounts', params: [] }) as string[]
    this.account = accounts?.[0] || ''
  }

  async connectWallet() {
    if (!window.ethereum) throw new Error('Wallet provider not found. Open this app in a browser with MetaMask or a GenLayer-compatible wallet installed.')
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts', params: [] }) as string[]
    this.account = accounts?.[0] || ''
    if (!this.account) return false

    // Connecting at wallet-selection time makes the required Studionet switch
    // visible to the user instead of deferring it until the first write.
    const walletClient = createClient({
      chain: chainMap[network],
      ...(endpoint ? { endpoint } : {}),
      provider: window.ethereum,
      account: this.account as `0x${string}`,
    }) as unknown as RuntimeClient
    if (walletClient.connect) await walletClient.connect(network)
    return true
  }

  private async read(functionName: string, args: unknown[] = []) {
    if (!this.address) throw new Error('ContentModeration V2 contract is not configured')
    const delays = [1_500, 3_000, 6_000, 10_000]
    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      try {
        const data = await (this.readClient as unknown as RuntimeClient).readContract({ address: this.address, functionName, args })
        return parseJson(data)
      } catch (error) {
        if (!isRetryableRpcError(error) || attempt === delays.length) {
          if (isRetryableRpcError(error)) throw new Error('Studionet RPC is temporarily rate-limited. Wait 20 seconds, then use Sync contract or Refresh without resubmitting.')
          throw error
        }
        await delay(delays[attempt])
      }
    }
  }

  private async stateEventuallyMatches(check: () => Promise<boolean>) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try { if (await check()) return true } catch { /* State may lag the accepted receipt briefly. */ }
      await delay(5_000)
    }
    return false
  }

  private async write(functionName: string, args: unknown[] = [], value = 0n, verifyState?: () => Promise<boolean>): Promise<TransactionResult> {
    let submittedHash = ''
    let submittedClient: RuntimeClient | null = null
    try {
      if (!this.address) return { success: false, error: 'ContentModeration V2 contract is not configured' }
      if (!window.ethereum) return { success: false, error: 'Wallet provider not found' }
      const connected = await this.connectWallet()
      if (!connected) return { success: false, error: 'No wallet account selected' }
      const writeClient = createClient({ chain: chainMap[network], ...(endpoint ? { endpoint } : {}), provider: window.ethereum, account: this.account as `0x${string}` })
      const runtime = writeClient as unknown as RuntimeClient
      submittedClient = runtime
      if (runtime.connect) await runtime.connect(network)
      const hash = await runtime.writeContract({ address: this.address, functionName, args, value })
      submittedHash = hash
      const receipt = await runtime.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        status: TransactionStatus.ACCEPTED,
        interval: 5_000,
        retries: 120,
        fullTransaction: false,
      })
      let observed = receipt
      if (!observed.txExecutionResultName) {
        try { observed = await runtime.getTransaction({ hash: hash as `0x${string}` }) } catch { observed = receipt }
      }
      const failure = receiptFailure(observed)
      if (failure) return { success: false, hash, status: observed.statusName || receipt.statusName, error: failure }
      if (verifyState && !(await this.stateEventuallyMatches(verifyState))) {
        const incomplete = !observed.txExecutionResultName || observed.txExecutionResultName !== 'FINISHED_WITH_RETURN'
        return {
          success: false,
          pending: incomplete,
          hash,
          status: observed.statusName || receipt.statusName,
          error: incomplete
            ? `Transaction ${hash} is accepted but state verification is still pending. Do not resubmit; sync the existing transaction.`
            : `Transaction ${hash} completed but the expected contract state did not change. Inspect the transaction trace before retrying.`,
        }
      }
      return { success: true, hash, status: observed.statusName || receipt.statusName, data: parseJson(observed.txDataDecoded ?? receipt.txDataDecoded) }
    } catch (error) {
      if (submittedHash && submittedClient) {
        try {
          const transaction = await submittedClient.getTransaction({ hash: submittedHash as `0x${string}` })
          const status = transaction.statusName || 'PROCESSING'
          if (['PENDING', 'PROPOSING', 'COMMITTING', 'REVEALING', 'ACCEPTED'].includes(status)) {
            return { success: false, pending: true, hash: submittedHash, status, error: `Transaction ${submittedHash} is still ${status}. Do not resubmit; sync state after consensus.` }
          }
        } catch { /* Preserve the original SDK error when monitoring is unavailable. */ }
      }
      return {
        success: false,
        hash: submittedHash || undefined,
        error: error instanceof Error ? error.message : 'Transaction failed',
      }
    }
  }

  async submitContent(content: string, type: 'TEXT' | 'URL', bond: bigint) {
    const before = await this.getSystemState()
    return this.write('submit', [content, type], bond, async () => (await this.getSystemState()).submission_count > before.submission_count)
  }
  async evaluateSubmission(id: bigint | string | number) {
    const submissionId = Number(id)
    return this.write('evaluate', [submissionId], 0n, async () => (await this.getSubmission(submissionId)).status !== 'PENDING')
  }
  openAppeal(id: bigint | string | number, reason: string, evidenceUrl: string) {
    const submissionId = Number(id)
    return this.write('open_appeal', [submissionId, reason, evidenceUrl], 0n, async () => (await this.getSubmission(submissionId)).status === 'APPEAL_PENDING')
  }
  resolveAppeal(id: bigint | string | number) {
    const submissionId = Number(id)
    return this.write('resolve_appeal', [submissionId], 0n, async () => (await this.getSubmission(submissionId)).status !== 'APPEAL_PENDING')
  }
  acceptRejection(id: bigint | string | number) {
    const submissionId = Number(id)
    return this.write('accept_rejection', [submissionId], 0n, async () => (await this.getSubmission(submissionId)).status === 'FINAL_REJECTED')
  }
  claimBond(id: bigint | string | number) {
    const submissionId = Number(id)
    return this.write('claim_bond', [submissionId], 0n, async () => (await this.getSubmission(submissionId)).bond_status === 'REFUNDED')
  }
  slashBond(id: bigint | string | number) {
    const submissionId = Number(id)
    return this.write('slash_bond', [submissionId], 0n, async () => (await this.getSubmission(submissionId)).bond_status === 'SLASHED')
  }

  async getSubmission(id: bigint | string | number) { return normalizeSubmission(await this.read('get_submission', [Number(id)])) }
  async getSystemState() { return normalizeSystemState(await this.read('get_system_state')) }
  async getGuidelines() { return parseJson(await this.read('get_guidelines')) }

  async getSubmissions(knownState?: SystemState) {
    const state = knownState || await this.getSystemState()
    const items: Submission[] = []
    for (let id = Number(state.submission_count) - 1; id >= 0; id -= 1) {
      try { items.push(await this.getSubmission(id)) } catch { /* A missing row must not hide the remaining queue. */ }
    }
    return items
  }
}

let instance: GenLayerClient | null = null

function configuredContractAddress() {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(contractStorageKey)
    if (saved) return saved
  }
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''
}

export function getGenLayerClient() {
  const address = configuredContractAddress()
  if (!instance || instance.getContractAddress().toLowerCase() !== address.toLowerCase()) instance = new GenLayerClient(address)
  return instance
}

export function setActiveContractAddress(address: string) {
  const normalized = address.trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) throw new Error('Enter a valid GenLayer contract address')
  if (typeof window !== 'undefined') window.localStorage.setItem(contractStorageKey, normalized)
  instance = new GenLayerClient(normalized)
  return normalized
}

export async function verifyContractAddress(address: string) {
  const normalized = address.trim()
  if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) throw new Error('Enter a valid GenLayer contract address')
  const candidate = new GenLayerClient(normalized)
  const state = await candidate.getSystemState()
  return { address: normalized, state }
}

export function restoreDefaultContractAddress() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(contractStorageKey)
  instance = new GenLayerClient(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '')
  return instance.getContractAddress()
}

export function getContractConfig() {
  return { address: configuredContractAddress(), network, rpcUrl: endpoint || 'GenLayer SDK default' }
}

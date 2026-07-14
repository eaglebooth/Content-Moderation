'use client'

import { createClient } from 'genlayer-js'
import { localnet, studionet } from 'genlayer-js/chains'
import { ExecutionResult, TransactionStatus } from 'genlayer-js/types'

type NetworkName = 'localnet' | 'studionet'
type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }

declare global {
  interface Window { ethereum?: EthereumProvider }
}

const network: NetworkName = process.env.NEXT_PUBLIC_NETWORK === 'localnet' ? 'localnet' : 'studionet'
const endpoint = process.env.NEXT_PUBLIC_GENLAYER_RPC
const chainMap = { localnet, studionet }

type RuntimeClient = {
  connect?: (networkName: NetworkName) => Promise<unknown>
  readContract: (args: { address: unknown; functionName: string; args: unknown[] }) => Promise<unknown>
  writeContract: (args: { address: unknown; functionName: string; args: unknown[]; value: bigint }) => Promise<string>
  waitForTransactionReceipt: (args: { hash: `0x${string}`; status: string }) => Promise<{ statusName?: string; txExecutionResultName?: string; txDataDecoded?: unknown }>
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
  hash?: string
  status?: string
  data?: unknown
  error?: string
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
    if (!window.ethereum) throw new Error('Wallet provider not found')
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts', params: [] }) as string[]
    this.account = accounts?.[0] || ''
    return Boolean(this.account)
  }

  private async read(functionName: string, args: unknown[] = []) {
    if (!this.address) throw new Error('ContentModeration V2 contract is not configured')
    const data = await (this.readClient as unknown as RuntimeClient).readContract({ address: this.address, functionName, args })
    return parseJson(data)
  }

  private async write(functionName: string, args: unknown[] = [], value = 0n): Promise<TransactionResult> {
    try {
      if (!this.address) return { success: false, error: 'ContentModeration V2 contract is not configured' }
      if (!window.ethereum) return { success: false, error: 'Wallet provider not found' }
      const connected = await this.connectWallet()
      if (!connected) return { success: false, error: 'No wallet account selected' }
      const writeClient = createClient({ chain: chainMap[network], ...(endpoint ? { endpoint } : {}), provider: window.ethereum, account: this.account as `0x${string}` })
      const runtime = writeClient as unknown as RuntimeClient
      if (runtime.connect) await runtime.connect(network)
      const hash = await runtime.writeContract({ address: this.address, functionName, args, value })
      const receipt = await runtime.waitForTransactionReceipt({ hash: hash as `0x${string}`, status: TransactionStatus.FINALIZED })
      if (receipt.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
        return { success: false, hash, status: receipt.statusName, error: `Contract execution failed: ${receipt.txExecutionResultName || 'UNKNOWN'}` }
      }
      return { success: true, hash, status: receipt.statusName, data: parseJson(receipt.txDataDecoded) }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Transaction failed' }
    }
  }

  submitContent(content: string, type: 'TEXT' | 'URL', bond: bigint) { return this.write('submit', [content, type], bond) }
  evaluateSubmission(id: bigint | string | number) { return this.write('evaluate', [Number(id)]) }
  openAppeal(id: bigint | string | number, reason: string, evidenceUrl: string) { return this.write('open_appeal', [Number(id), reason, evidenceUrl]) }
  resolveAppeal(id: bigint | string | number) { return this.write('resolve_appeal', [Number(id)]) }
  acceptRejection(id: bigint | string | number) { return this.write('accept_rejection', [Number(id)]) }
  claimBond(id: bigint | string | number) { return this.write('claim_bond', [Number(id)]) }
  slashBond(id: bigint | string | number) { return this.write('slash_bond', [Number(id)]) }

  async getSubmission(id: bigint | string | number) { return normalizeSubmission(await this.read('get_submission', [Number(id)])) }
  async getSystemState() { return normalizeSystemState(await this.read('get_system_state')) }
  async getGuidelines() { return parseJson(await this.read('get_guidelines')) }

  async getSubmissions() {
    const state = await this.getSystemState()
    const items: Submission[] = []
    for (let id = Number(state.submission_count) - 1; id >= 0; id -= 1) {
      try { items.push(await this.getSubmission(id)) } catch { /* A missing row must not hide the remaining queue. */ }
    }
    return items
  }
}

let instance: GenLayerClient | null = null

export function getGenLayerClient() {
  if (!instance) instance = new GenLayerClient(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '')
  return instance
}

export function getContractConfig() {
  return { address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '', network, rpcUrl: endpoint || 'GenLayer SDK default' }
}

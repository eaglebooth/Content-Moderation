'use client'

import { createClient } from 'genlayer-js'
import { toHex, toRlp, type Address } from 'viem'

const DEFAULT_RPC_URL = 'https://rpc.testnet.genlayer.com'
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK || 'studionet'

const genlayerTestnet = {
  id: 61999,
  name: NETWORK_NAME === 'studionet' ? 'GenLayer Studio' : 'GenLayer Testnet',
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || DEFAULT_RPC_URL],
    },
  },
  nativeCurrency: {
    name: 'GEN Token',
    symbol: 'GEN',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Explorer',
      url: 'https://genlayer.com/explorer',
    },
  },
  testnet: true,
} as const

export interface Submission {
  id: bigint
  type: string
  content: string
  submitter: string
  timestamp: bigint
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW'
  score: bigint
  category_scores: string
  reason: string
  evaluated_at: bigint
  appeal_count: bigint
}

export interface Stats {
  total_submissions: bigint
  approved: bigint
  rejected: bigint
  needs_review: bigint
  pending: bigint
  appealed: bigint
  approval_rate: bigint
}

function encodeContractCall(functionName: string, args: unknown[]) {
  return toRlp([functionName, JSON.stringify(args)].map((param) => toHex(param)))
}

function parseMaybeJson(value: unknown): any {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    // Some RPCs return a hex-encoded JSON/string payload.
  }

  if (value.startsWith('0x')) {
    try {
      const bytes = value.slice(2).match(/.{1,2}/g) || []
      const decoded = bytes
        .map((byte) => String.fromCharCode(Number.parseInt(byte, 16)))
        .join('')
        .replace(/\0/g, '')
        .trim()
      return decoded ? parseMaybeJson(decoded) : value
    } catch {
      return value
    }
  }

  return value
}

function toBigIntValue(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(Math.trunc(value))
  if (typeof value === 'string') {
    if (!value) return 0n
    return value.startsWith('0x') ? BigInt(value) : BigInt(Math.trunc(Number(value)))
  }
  return 0n
}

function normalizeSubmission(raw: any): Submission {
  const data = parseMaybeJson(raw)
  if (!data || data.error) {
    throw new Error(data?.error || 'Submission not found')
  }

  return {
    id: toBigIntValue(data.id),
    type: String(data.type || 'text'),
    content: String(data.content || ''),
    submitter: String(data.submitter || ''),
    timestamp: toBigIntValue(data.timestamp),
    status: (data.status || 'PENDING') as Submission['status'],
    score: toBigIntValue(data.score),
    category_scores:
      typeof data.category_scores === 'string'
        ? data.category_scores
        : JSON.stringify(data.category_scores || {}),
    reason: String(data.reason || ''),
    evaluated_at: toBigIntValue(data.evaluated_at),
    appeal_count: toBigIntValue(data.appeal_count),
  }
}

function normalizeStats(raw: any): Stats {
  const data = parseMaybeJson(raw) || {}
  return {
    total_submissions: toBigIntValue(data.total_submissions),
    approved: toBigIntValue(data.approved),
    rejected: toBigIntValue(data.rejected),
    needs_review: toBigIntValue(data.needs_review),
    pending: toBigIntValue(data.pending),
    appealed: toBigIntValue(data.appealed),
    approval_rate: toBigIntValue(data.approval_rate),
  }
}

class GenLayerClient {
  private contractAddress: Address
  private readClient = createClient({
    chain: genlayerTestnet,
    endpoint: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || DEFAULT_RPC_URL,
  })
  private provider: any = null
  private account: Address | null = null

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress as Address
  }

  getContractAddress(): string {
    return this.contractAddress
  }

  getNetworkName(): string {
    return NETWORK_NAME
  }

  async initialize() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum
      const accounts = await this.provider.request({ method: 'eth_accounts' })
      if (accounts?.length > 0) this.account = accounts[0]
    }
  }

  isWalletConnected(): boolean {
    return !!this.account && !!this.provider
  }

  getConnectedAccount(): string | null {
    return this.account
  }

  async connectWallet(): Promise<boolean> {
    if (!(window as any).ethereum) {
      throw new Error('No wallet found. Please install MetaMask or a compatible wallet.')
    }

    this.provider = (window as any).ethereum
    const accounts = await this.provider.request({ method: 'eth_requestAccounts' })
    if (accounts?.length > 0) {
      this.account = accounts[0]
      return true
    }

    return false
  }

  async disconnectWallet() {
    this.account = null
  }

  private async readContract(functionName: string, args: unknown[] = []) {
    const result = await this.readClient.readContract({
      address: this.contractAddress,
      functionName,
      args,
    } as any)
    return parseMaybeJson(result)
  }

  private async writeContract(functionName: string, args: unknown[] = []): Promise<string> {
    if (!this.provider || !this.account) {
      const connected = await this.connectWallet()
      if (!connected || !this.account) throw new Error('Wallet not connected')
    }

    return await this.provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: this.account,
          to: this.contractAddress,
          data: encodeContractCall(functionName, args),
          value: '0x0',
        },
      ],
    })
  }

  async submitContent(content: string, type: 'text' | 'image_url', submitter: string): Promise<string> {
    if (!content.trim()) throw new Error('Content cannot be empty')
    if (!submitter.trim()) throw new Error('Submitter cannot be empty')
    return await this.writeContract('submit', [content, type, submitter])
  }

  async evaluateSubmission(submissionId: bigint | number | string): Promise<string> {
    return await this.writeContract('evaluate', [Number(submissionId)])
  }

  async appealSubmission(submissionId: bigint | number | string, reason: string): Promise<string> {
    if (!reason.trim()) throw new Error('Appeal reason cannot be empty')
    return await this.writeContract('appeal', [Number(submissionId), reason])
  }

  async getSubmission(submissionId: bigint | number | string): Promise<Submission> {
    const result = await this.readContract('get_submission', [Number(submissionId)])
    return normalizeSubmission(result)
  }

  async getSubmissionsByStatus(status: string): Promise<bigint[]> {
    const result = await this.readContract('get_submissions_by_status', [status])
    const values = Array.isArray(result) ? result : []
    return values.map((value) => toBigIntValue(value))
  }

  async getSubmissions(): Promise<Submission[]> {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW']
    const allIds: bigint[] = []

    for (const status of statuses) {
      try {
        allIds.push(...(await this.getSubmissionsByStatus(status)))
      } catch (error) {
        console.warn(`Failed to get submissions for status ${status}:`, error)
      }
    }

    const uniqueIds = [...new Set(allIds)].sort((a, b) => Number(b - a))
    const submissions: Submission[] = []

    for (const id of uniqueIds) {
      try {
        submissions.push(await this.getSubmission(id))
      } catch (error) {
        console.warn(`Failed to fetch submission ${id}:`, error)
      }
    }

    return submissions
  }

  async getStats(): Promise<Stats> {
    return normalizeStats(await this.readContract('get_stats', []))
  }

  async getGuidelines(): Promise<string> {
    const result = await this.readContract('get_guidelines', [])
    return typeof result === 'string' ? result : JSON.stringify(result)
  }
}

let clientInstance: GenLayerClient | null = null

export function getGenLayerClient(): GenLayerClient {
  if (!clientInstance) {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (!contractAddress) {
      throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS environment variable is required')
    }
    clientInstance = new GenLayerClient(contractAddress)
  }
  return clientInstance
}

export function getContractConfig() {
  return {
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
    network: NETWORK_NAME,
    rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || DEFAULT_RPC_URL,
  }
}

export { GenLayerClient }

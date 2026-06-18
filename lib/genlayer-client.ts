'use client'

import { useState, useEffect } from 'react'

// Contract ABI - minimal for encoding/decoding
const CONTRACT_ABI = [
  'function submit(string content, string content_type, string submitter) returns (uint256)',
  'function evaluate(uint256 submission_id)',
  'function appeal(uint256 submission_id, string appeal_reason) returns (string)',
  'function get_submission(uint256 submission_id) returns (tuple(uint256 id, string type, string content, string submitter, uint256 timestamp, string status, uint256 score, string category_scores, string reason, uint256 evaluated_at, uint256 appeal_count))',
  'function get_submissions_by_status(string status) returns (uint256[])',
  'function get_stats() returns (tuple(uint256 total_submissions, uint256 approved, uint256 rejected, uint256 needs_review, uint256 pending, uint256 appealed, uint256 approval_rate))',
  'function get_guidelines() returns (string)',
  'function get_logs(uint256 start_index, uint256 count) returns (string[])'
] as const

// Simple keccak256 implementation for method IDs
async function keccak256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function getMethodId(functionName: string, types: string, names: string[] = []): string {
  // For simplicity, use a deterministic pseudo-hash
  // In production, use proper keccak256
  const signature = names.length > 0
    ? `${functionName}(${types})`
    : functionName
  // Simple hash: take first 8 chars of SHA-256
  const hash = (str: string) => {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i)
      h = h & h
    }
    return h >>> 0
  }
  const hashNum = hash(signature)
  return '0x' + hashNum.toString(16).padStart(8, '0')
}

// Encode a single string parameter (dynamic type)
function encodeString(value: string): string {
  // Pad to 32 bytes
  const encoded = Buffer.from(value, 'utf8').toString('hex')
  const padded = encoded.padEnd(64, '0')
  return '0x' + padded
}

// Encode uint256
function encodeUint256(value: bigint | number): string {
  const num = typeof value === 'bigint' ? value : BigInt(value)
  const hex = num.toString(16).padStart(64, '0')
  return '0x' + hex
}

// Encode parameters based on types
function encodeParameters(types: string[], values: any[]): string {
  let encoded = ''
  for (let i = 0; i < types.length; i++) {
    const type = types[i]
    const value = values[i]
    if (type === 'string') {
      // For dynamic strings, we need offset then data
      // Simplified: assume all params are at fixed positions
      encoded += encodeString(value)
    } else if (type === 'uint256') {
      encoded += encodeUint256(value)
    } else {
      throw new Error(`Unsupported type: ${type}`)
    }
  }
  return encoded
}

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

class GenLayerClient {
  private contractAddress: string
  private provider: any = null
  private account: string | null = null

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress
  }

  async initialize() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum
      try {
        await this.provider.request({ method: 'eth_requestAccounts' })
        const accounts = await this.provider.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          this.account = accounts[0]
        }
      } catch (error) {
        console.warn('Failed to connect wallet:', error)
      }
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
      throw new Error('No wallet found. Please install MetaMask.')
    }
    try {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        this.account = accounts[0]
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  async disconnectWallet() {
    this.account = null
  }

  // Helper: make RPC call
  private async rpcCall(method: string, params: any[] = []): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    return await this.provider.request({
      method: 'eth_call',
      params: [{
        to: this.contractAddress,
        data: this.encodeCall(method, params)
      }, 'latest']
    })
  }

  // Helper: send transaction
  private async sendTx(method: string, params: any[] = []): Promise<string> {
    if (!this.provider || !this.account) {
      throw new Error('Wallet not connected')
    }
    return await this.provider.request({
      method: 'eth_sendTransaction',
      params: [{
        to: this.contractAddress,
        from: this.account,
        data: this.encodeCall(method, params),
        gas: '0x100000' // 1M gas
      }]
    })
  }

  // Simple ABI encoding
  private encodeCall(functionName: string, args: any[]): string {
    // Method ID - simple hash
    const sig = functionName + '(' + this.getParamTypes(functionName) + ')'
    const methodId = this.simpleHash4(sig)
    const encodedArgs = this.encodeArgs(functionName, args)
    return methodId + encodedArgs
  }

  private getParamTypes(func: string): string {
    const map: Record<string, string> = {
      'submit': 'string,string,string',
      'evaluate': 'uint256',
      'appeal': 'uint256,string',
      'get_submission': 'uint256',
      'get_submissions_by_status': 'string',
      'get_stats': '',
      'get_guidelines': '',
      'get_logs': 'uint256,uint256'
    }
    return map[func] || ''
  }

  private simpleHash4(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i)
    }
    const hash = ((h & 0xffffffff) >>> 0).toString(16)
    return '0x' + hash.padStart(8, '0')
  }

  private encodeArgs(func: string, args: any[]): string {
    if (func === 'submit') {
      // 3 strings: content, content_type, submitter
      return this.encodeStrings(args)
    } else if (['evaluate', 'get_submission', 'get_logs'].includes(func)) {
      // uint256
      return encodeUint256(args[0])
    } else if (func === 'appeal') {
      // uint256, string
      return encodeUint256(args[0]) + encodeString(args[1]).slice(2)
    } else if (func === 'get_submissions_by_status') {
      return encodeString(args[0])
    } else if (func === 'get_stats' || func === 'get_guidelines') {
      return ''
    }
    return ''
  }

  private encodeStrings(strings: string[]): string {
    // Calculate offsets
    const stringData: string[] = []
    const offsets: bigint[] = []

    // Each param takes 32 bytes, strings stored after
    const baseOffset = BigInt(strings.length * 32)

    for (let i = 0; i < strings.length; i++) {
      offsets.push(baseOffset + BigInt(i * 32))
      const strHex = Buffer.from(strings[i], 'utf8').toString('hex')
      const padded = strHex.padEnd(64, '0')
      stringData.push(padded)
    }

    let result = ''
    for (const offset of offsets) {
      result += encodeUint256(offset).slice(2)
    }
    for (const data of stringData) {
      result += data
    }
    return '0x' + result
  }

  // Decode string from return data
  private decodeString(data: string): string {
    try {
      const hex = data.startsWith('0x') ? data.slice(2) : data
      const bytes = Buffer.from(hex, 'hex')
      // Find null terminator or take first 32 bytes
      const strBytes = bytes.slice(0, 32)
      const nullIdx = Array.from(strBytes).indexOf(0)
      const actualBytes = nullIdx >= 0 ? strBytes.slice(0, nullIdx) : strBytes
      return actualBytes.toString('utf8').replace(/\0/g, '')
    } catch {
      return ''
    }
  }

  // Decode uint256
  private decodeUint256(data: string): bigint {
    const hex = data.startsWith('0x') ? data.slice(2) : data
    return BigInt('0x' + hex)
  }

  // Decode tuple (simplified)
  private decodeTuple(data: string, layout: { type: string }[]): any[] {
    const hex = data.startsWith('0x') ? data.slice(2) : data
    const results: any[] = []
    let offset = 0

    for (const field of layout) {
      if (field.type === 'uint256') {
        const val = BigInt('0x' + hex.slice(offset, offset + 64))
        results.push(val)
        offset += 64
      } else if (field.type === 'string' || field.type === 'bytes') {
        const ptrHex = hex.slice(offset, offset + 64)
        const ptr = Number(BigInt('0x' + ptrHex))
        // Read string at pointer position
        const strData = hex.slice(ptr * 2, (ptr + 32) * 2)
        results.push(this.decodeString('0x' + strData))
        offset += 64
      }
    }
    return results
  }

  // Public API
  async submitContent(content: string, type: 'text' | 'image_url', submitter: string): Promise<string> {
    if (!content.trim()) throw new Error('Content cannot be empty')
    if (!submitter.trim()) throw new Error('Submitter cannot be empty')

    const data = this.encodeCall('submit', [content, type, submitter])
    const txHash = await this.sendTx('submit', [content, type, submitter])
    return txHash
  }

  async evaluateSubmission(submissionId: bigint | number | string): Promise<{ verdict: string; score: number; reason: string }> {
    const data = await this.rpcCall('evaluate', [BigInt(submissionId)])
    // decode(string, uint256, string)
    const result = this.decodeTuple(data, [
      { type: 'string' }, // verdict
      { type: 'uint256' }, // score
      { type: 'string' }  // reason
    ])
    return {
      verdict: result[0],
      score: Number(result[1]),
      reason: result[2]
    }
  }

  async appealSubmission(submissionId: bigint | number | string, reason: string): Promise<string> {
    const txHash = await this.sendTx('appeal', [BigInt(submissionId), reason])
    return txHash
  }

  async getSubmission(submissionId: bigint | number | string): Promise<Submission> {
    const data = await this.rpcCall('get_submission', [BigInt(submissionId)])
    const result = this.decodeTuple(data, [
      { type: 'uint256' }, // id
      { type: 'string' },  // type
      { type: 'string' },  // content
      { type: 'string' },  // submitter
      { type: 'uint256' }, // timestamp
      { type: 'string' },  // status
      { type: 'uint256' }, // score
      { type: 'string' },  // category_scores (JSON)
      { type: 'string' },  // reason
      { type: 'uint256' }, // evaluated_at
      { type: 'uint256' }  // appeal_count
    ])
    return {
      id: result[0],
      type: result[1] as 'text' | 'image_url',
      content: result[2],
      submitter: result[3],
      timestamp: result[4],
      status: result[5] as 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW',
      score: result[6],
      category_scores: result[7],
      reason: result[8],
      evaluated_at: result[9],
      appeal_count: result[10]
    }
  }

  async getSubmissionsByStatus(status: string): Promise<bigint[]> {
    const data = await this.rpcCall('get_submissions_by_status', [status])
    // Returns dynamic array of uint256
    const hex = data.startsWith('0x') ? data.slice(2) : data
    // First 32 bytes is array length
    const len = Number(BigInt('0x' + hex.slice(0, 64)))
    const ids: bigint[] = []
    for (let i = 0; i < len; i++) {
      ids.push(BigInt('0x' + hex.slice(64 + i * 64, 64 + (i + 1) * 64)))
    }
    return ids
  }

  async getStats(): Promise<Stats> {
    const data = await this.rpcCall('get_stats', [])
    const result = this.decodeTuple(data, [
      { type: 'uint256' }, // total_submissions
      { type: 'uint256' }, // approved
      { type: 'uint256' }, // rejected
      { type: 'uint256' }, // needs_review
      { type: 'uint256' }, // pending
      { type: 'uint256' }, // appealed
      { type: 'uint256' }  // approval_rate
    ])
    return {
      total_submissions: result[0],
      approved: result[1],
      rejected: result[2],
      needs_review: result[3],
      pending: result[4],
      appealed: result[5],
      approval_rate: result[6]
    }
  }

  async getGuidelines(): Promise<string> {
    const data = await this.rpcCall('get_guidelines', [])
    return this.decodeString(data)
  }

  async getLogs(startIndex: bigint | number, count: bigint | number): Promise<string[]> {
    const data = await this.rpcCall('get_logs', [BigInt(startIndex), BigInt(count)])
    const hex = data.startsWith('0x') ? data.slice(2) : data
    // Returns dynamic array of strings
    const len = Number(BigInt('0x' + hex.slice(0, 64)))
    const logs: string[] = []
    let offset = 64
    for (let i = 0; i < len; i++) {
      // Each string pointer
      const ptrHex = hex.slice(offset, offset + 64)
      const ptr = Number(BigInt('0x' + ptrHex))
      const strData = hex.slice(ptr * 2, (ptr + 32) * 2)
      logs.push(this.decodeString('0x' + strData))
      offset += 64
    }
    return logs
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

export { GenLayerClient }

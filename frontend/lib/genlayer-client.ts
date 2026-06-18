'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, http, parseEvmAbi, encodeAbiParameters, decodeAbiParameters, Hex } from 'viem'
import { genlayerTestnet } from 'viem/chains'

// Full contract ABI with proper types
const CONTRACT_ABI = parseEvmAbi([
  'function submit(string content, string content_type, string submitter) returns (uint256)',
  'function evaluate(uint256 submission_id) returns (string verdict, uint256 score, string reason)',
  'function appeal(uint256 submission_id, string appeal_reason) returns (string)',
  'function get_submission(uint256 submission_id) returns (tuple(uint256 id, string type, string content, string submitter, uint256 timestamp, string status, uint256 score, string category_scores, string reason, uint256 evaluated_at, uint256 appeal_count))',
  'function get_submissions_by_status(string status) returns (uint256[])',
  'function get_stats() returns (tuple(uint256 total_submissions, uint256 approved, uint256 rejected, uint256 needs_review, uint256 pending, uint256 appealed, uint256 approval_rate))',
  'function get_guidelines() returns (string)',
  'function get_logs(uint256 start_index, uint256 count) returns (string[])'
])

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
  private contractAddress: `0x${string}`
  private publicClient: ReturnType<typeof createPublicClient> | null = null
  private walletClient: ReturnType<typeof createWalletClient> | null = null
  private account: `0x${string}` | null = null

  constructor(contractAddress: string) {
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error('Invalid contract address')
    }
    this.contractAddress = contractAddress as `0x${string}`
  }

  async initialize() {
    const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || 'https://rpc.testnet.genlayer.com'

    // Create public client for read operations
    this.publicClient = createPublicClient({
      chain: genlayerTestnet,
      transport: http(rpcUrl)
    })

    // Check if MetaMask is available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        // Request account access
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' })

        // Create wallet client for write operations
        this.walletClient = createWalletClient({
          chain: genlayerTestnet,
          transport: (window as any).ethereum
        })

        // Get the first account
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          this.account = accounts[0] as `0x${string}`
        }
      } catch (error) {
        console.warn('Failed to connect wallet:', error)
      }
    } else {
      console.warn('MetaMask not found - read-only mode')
    }
  }

  isWalletConnected(): boolean {
    return !!this.account && !!this.walletClient
  }

  getConnectedAccount(): `0x${string}` | null {
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
        this.account = accounts[0] as `0x${string}`
        this.walletClient = createWalletClient({
          chain: genlayerTestnet,
          transport: (window as any).ethereum
        })
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
    this.walletClient = null
  }

  // Public API methods
  async submitContent(content: string, type: 'text' | 'image_url', submitter: string): Promise<string> {
    this.checkWallet()

    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected')
    }

    if (!content.trim()) {
      throw new Error('Content cannot be empty')
    }

    if (!submitter.trim()) {
      throw new Error('Submitter cannot be empty')
    }

    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'submit',
        args: [content, type, submitter]
      })

      // Wait for transaction to be mined
      await this.publicClient?.waitForTransactionReceipt({ hash: txHash })

      return txHash
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.shortMessage || error.message}`)
    }
  }

  async evaluateSubmission(submissionId: bigint | number | string): Promise<{ verdict: string; score: number; reason: string }> {
    const id = BigInt(submissionId)

    try {
      const result = await this.publicClient!.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'evaluate',
        args: [id]
      })

      return {
        verdict: result[0],
        score: Number(result[1]),
        reason: result[2]
      }
    } catch (error: any) {
      throw new Error(`Evaluation failed: ${error.shortMessage || error.message}`)
    }
  }

  async appealSubmission(submissionId: bigint | number | string, reason: string): Promise<string> {
    this.checkWallet()

    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected')
    }

    try {
      const txHash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'appeal',
        args: [BigInt(submissionId), reason]
      })

      await this.publicClient?.waitForTransactionReceipt({ hash: txHash })

      return txHash
    } catch (error: any) {
      throw new Error(`Appeal failed: ${error.shortMessage || error.message}`)
    }
  }

  async getSubmission(submissionId: bigint | number | string): Promise<Submission> {
    const id = BigInt(submissionId)

    try {
      const result = await this.publicClient!.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'get_submission',
        args: [id]
      })

      return {
        id: result[0],
        type: result[1],
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
    } catch (error: any) {
      if (error.message?.includes('reverted')) {
        throw new Error('Submission not found')
      }
      throw error
    }
  }

  async getSubmissionsByStatus(status: string): Promise<bigint[]> {
    try {
      const result = await this.publicClient!.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'get_submissions_by_status',
        args: [status]
      })
      return result as bigint[]
    } catch (error: any) {
      throw new Error(`Failed to fetch submissions: ${error.shortMessage || error.message}`)
    }
  }

  async getStats(): Promise<Stats> {
    try {
      const result = await this.publicClient!.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'get_stats',
        args: []
      })

      return {
        total_submissions: result[0],
        approved: result[1],
        rejected: result[2],
        needs_review: result[3],
        pending: result[4],
        appealed: result[5],
        approval_rate: result[6]
      }
    } catch (error: any) {
      throw new Error(`Failed to fetch stats: ${error.shortMessage || error.message}`)
    }
  }

  async getGuidelines(): Promise<string> {
    try {
      const result = await this.publicClient!.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'get_guidelines',
        args: []
      })
      return result as string
    } catch (error: any) {
      throw new Error(`Failed to fetch guidelines: ${error.shortMessage || error.message}`)
    }
  }

  async getLogs(startIndex: bigint | number, count: bigint | number): Promise<string[]> {
    try {
      const result = await this.publicClient!.readContract({
        address: this.contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'get_logs',
        args: [BigInt(startIndex), BigInt(count)]
      })
      return result as string[]
    } catch (error: any) {
      throw new Error(`Failed to fetch logs: ${error.shortMessage || error.message}`)
    }
  }

  private checkWallet() {
    if (!this.walletClient) {
      throw new Error('Wallet not connected. Please connect your wallet first.')
    }
  }
}

// Singleton instance
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

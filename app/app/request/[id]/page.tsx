'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Submission } from '@/lib/genlayer-client'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubmission()
  }, [params.id])

  const loadSubmission = async () => {
    setLoading(true)
    setError(null)
    try {
      const client = getGenLayerClient()
      await client.initialize()
      const data = await client.getSubmission(BigInt(params.id))
      setSubmission(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load submission')
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'APPROVED', bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', border: 'border-[#BBF7D0]' }
      case 'REJECTED':
        return { label: 'REJECTED', bg: 'bg-[#FEE2E2]', text: 'text-[#EF4444]', border: 'border-[#FECACA]' }
      case 'NEEDS_REVIEW':
        return { label: 'NEEDS REVIEW', bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FDE68A]' }
      default:
        return { label: 'PENDING', bg: 'bg-[#F1F5F9]', text: 'text-[#64748B]', border: 'border-[#E2E8F0]' }
    }
  }

  const parseCategoryScores = () => {
    if (!submission?.category_scores) return []
    try {
      const parsed = JSON.parse(submission.category_scores)
      return Object.entries(parsed).map(([category, score]) => ({ category, score: Number(score) }))
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <AppShell title={`Request #${params.id}`} subtitle="Loading moderation result...">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#0787D6] border-t-transparent"></div>
        </div>
      </AppShell>
    )
  }

  if (error || !submission) {
    return (
      <AppShell title={`Request #${params.id}`} subtitle="Error loading request">
        <div className="text-center py-20">
          <p className="text-[#EF4444] mb-4">{error || 'Submission not found'}</p>
          <Link href="/app/review" className="text-[#0787D6] font-medium hover:underline">
            ← Back to Review Queue
          </Link>
        </div>
      </AppShell>
    )
  }

  const statusConfig = getStatusConfig(submission.status)
  const categoryScores = parseCategoryScores()

  return (
    <AppShell title={`Request #${params.id}`} subtitle={`Submitted on ${new Date(Number(submission.timestamp) * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}>
      {/* Back button */}
      <div className="mb-6">
        <Link href="/app/review" className="inline-flex items-center gap-2 text-sm font-medium text-[#0787D6] hover:text-[#006DB4] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Review Queue
        </Link>
      </div>

      {/* Status and Score */}
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
        <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-[#64748B]">Request #{submission.id.toString()}</span>
          </div>

          <h3 className="text-sm font-semibold text-[#64748B] mb-3">Content</h3>
          <div className="rounded-2xl bg-[#F8FAFC] p-6 border border-[#E7EEF3]">
            <p className="text-[#111827] whitespace-pre-wrap leading-relaxed">{submission.content}</p>
          </div>

          {submission.reason && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#64748B] mb-3">AI Explanation</h3>
              <div className="rounded-2xl bg-[#F8FAFC] p-6 border border-[#E7EEF3]">
                <p className="text-[#111827] leading-relaxed">{submission.reason}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-8 text-center">
            <p className="text-sm text-[#64748B] mb-2">Overall Score</p>
            <p className={`text-6xl font-bold ${
              Number(submission.score) >= 60 ? 'text-[#EF4444]' :
              Number(submission.score) < 50 ? 'text-[#16A34A]' :
              'text-[#F59E0B]'
            }`}>
              {Number(submission.score)}
            </p>
            <p className="text-sm text-[#64748B] mt-2">out of 100</p>
          </div>

          <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
            <h3 className="text-sm font-semibold text-[#64748B] mb-4">Validator Consensus</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Validators</span>
                <span className="text-sm font-medium text-[#111827]">5/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Agreement</span>
                <span className="text-sm font-medium text-[#16A34A]">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">Confidence</span>
                <span className="text-sm font-medium text-[#111827]">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Risk Analysis */}
      {categoryScores.length > 0 && (
        <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-8 mb-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-6">Category Risk Analysis</h3>
          <div className="space-y-5">
            {categoryScores.map(({ category, score }) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#64748B]">{category}</span>
                  <span className={`font-semibold ${
                    score >= 60 ? 'text-[#EF4444]' :
                    score < 50 ? 'text-[#16A34A]' :
                    'text-[#F59E0B]'
                  }`}>{score}</span>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(score, 100)}%`,
                      background: score >= 60 ? '#EF4444' : score < 50 ? '#16A34A' : '#F59E0B'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* On-Chain Verification */}
      <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-8">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">On-Chain Verification</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[#E7EEF3]">
            <span className="text-sm text-[#64748B]">Contract Address</span>
            <span className="text-sm font-mono text-[#111827]">0x3CEa...D13Ae</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#E7EEF3]">
            <span className="text-sm text-[#64748B]">Network</span>
            <span className="text-sm font-medium text-[#111827]">GenLayer Testnet</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-[#64748B]">Timestamp</span>
            <span className="text-sm font-medium text-[#111827]">
              {new Date(Number(submission.timestamp) * 1000).toLocaleString('en-US')}
            </span>
          </div>
        </div>
        <div className="mt-6">
          <a
            href="https://genlayer.com/explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E7EEF3] text-[#111827] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] transition-all duration-200"
          >
            View on Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </AppShell>
  )
}

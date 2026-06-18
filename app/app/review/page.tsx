'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Submission } from '@/lib/genlayer-client'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW'

const statusLabels: Record<StatusFilter, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_REVIEW: 'Needs Review'
}

export default function ReviewPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [appealing, setAppealing] = useState(false)
  const [appealResult, setAppealResult] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredSubmissions(submissions)
    } else {
      setFilteredSubmissions(submissions.filter(s => s.status === statusFilter))
    }
  }, [statusFilter, submissions])

  const loadData = async () => {
    setLoading(true)
    try {
      const client = getGenLayerClient()
      await client.initialize()
      const data = await client.getSubmissions()
      setSubmissions(data)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission)
    setAppealResult(null)
  }

  const handleAppeal = async () => {
    if (!selectedSubmission || !appealReason.trim()) return
    setAppealing(true)
    setAppealResult(null)
    try {
      const client = getGenLayerClient()
      await client.initialize()
      const txHash = await client.appealSubmission(selectedSubmission.id, appealReason)
      setAppealResult(`Appeal submitted. Transaction hash: ${txHash}`)
      setAppealReason('')
      await loadData()
      setSelectedSubmission(null)
    } catch (error) {
      setAppealResult(`Failed to submit appeal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setAppealing(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A]'
      case 'REJECTED': return 'px-3 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#EF4444]'
      case 'NEEDS_REVIEW': return 'px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706]'
      default: return 'px-3 py-1 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#64748B]'
    }
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateContent = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const parseCategoryScores = () => {
    if (!selectedSubmission?.category_scores) return []
    try {
      const parsed = JSON.parse(selectedSubmission.category_scores)
      return Object.entries(parsed).map(([category, score]) => ({ category, score: Number(score) }))
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <AppShell title="Review Queue" subtitle="Browse and manage moderation requests.">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#0787D6] border-t-transparent"></div>
        </div>
      </AppShell>
    )
  }

  const statusCounts = {
    ALL: submissions.length,
    PENDING: submissions.filter(s => s.status === 'PENDING').length,
    APPROVED: submissions.filter(s => s.status === 'APPROVED').length,
    REJECTED: submissions.filter(s => s.status === 'REJECTED').length,
    NEEDS_REVIEW: submissions.filter(s => s.status === 'NEEDS_REVIEW').length,
  }

  return (
    <AppShell title="Review Queue" subtitle="Browse and manage moderation requests.">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              statusFilter === status
                ? 'bg-[#111827] text-white'
                : 'bg-white border border-[#E7EEF3] text-[#64748B] hover:border-[#0787D6]'
            }`}
          >
            {statusLabels[status]} ({statusCounts[status]})
          </button>
        ))}
        <button
          onClick={loadData}
          className="ml-auto px-4 py-2 bg-white border border-[#E7EEF3] text-[#64748B] rounded-xl text-sm font-medium hover:border-[#0787D6] transition-all duration-200"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[18px] border border-[#E7EEF3] overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 text-[#64748B]">
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E7EEF3]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Content</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Score</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Validators</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Submitted</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EEF3]">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <span className={getStatusBadgeClass(submission.status)}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[#111827] max-w-xs truncate">{truncateContent(submission.content)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${
                        Number(submission.score) >= 60 ? 'text-[#EF4444]' :
                        Number(submission.score) < 50 ? 'text-[#16A34A]' :
                        'text-[#F59E0B]'
                      }`}>
                        {Number(submission.score)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#64748B]">5/5</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#64748B]">{formatDate(submission.timestamp)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/request/${submission.id.toString()}`}
                        className="text-sm font-medium text-[#0787D6] hover:text-[#006DB4] transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
            onClick={() => {
              setSelectedSubmission(null)
              setAppealResult(null)
            }}
          />
          <div className="relative bg-white rounded-[22px] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#111827]">
                    Submission #{selectedSubmission.id.toString()}
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">{formatDate(selectedSubmission.timestamp)}</p>
                </div>
                <span className={getStatusBadgeClass(selectedSubmission.status)}>
                  {selectedSubmission.status}
                </span>
              </div>

              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#64748B] mb-2">Content</h3>
                    <div className="rounded-2xl bg-[#F8FAFC] p-5 border border-[#E7EEF3]">
                      <p className="text-[#111827] whitespace-pre-wrap leading-relaxed">{selectedSubmission.content}</p>
                    </div>
                  </div>

                  {selectedSubmission.status === 'PENDING' && (
                    <div className="rounded-2xl bg-[#F8FAFC] border border-[#E7EEF3] p-5 text-center text-[#64748B]">
                      This submission is still pending evaluation.
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl bg-[#F8FAFC] p-5 border border-[#E7EEF3]">
                    <h3 className="text-sm font-semibold text-[#64748B] mb-4">AI Evaluation</h3>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="rounded-xl bg-white p-4 border border-[#E7EEF3]">
                        <p className="text-xs text-[#64748B] mb-1">Score</p>
                        <p className={`text-3xl font-bold ${
                          Number(selectedSubmission.score) >= 60 ? 'text-[#EF4444]' :
                          Number(selectedSubmission.score) < 50 ? 'text-[#16A34A]' :
                          'text-[#F59E0B]'
                        }`}>
                          {Number(selectedSubmission.score)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white p-4 border border-[#E7EEF3]">
                        <p className="text-xs text-[#64748B] mb-1">Verdict</p>
                        <p className="text-lg font-bold text-[#111827]">{selectedSubmission.status}</p>
                      </div>
                    </div>

                    {selectedSubmission.reason && (
                      <div className="mb-5">
                        <p className="text-xs text-[#64748B] mb-1">Reason</p>
                        <p className="text-sm text-[#111827] leading-relaxed">{selectedSubmission.reason}</p>
                      </div>
                    )}

                    {parseCategoryScores().length > 0 && (
                      <div>
                        <p className="text-xs text-[#64748B] mb-2">Category Scores</p>
                        <div className="space-y-2">
                          {parseCategoryScores().map(({ category, score }) => (
                            <div key={category} className="flex items-center justify-between gap-3">
                              <span className="text-sm text-[#111827]">{category}</span>
                              <span className="text-sm font-semibold text-[#64748B]">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedSubmission.status !== 'PENDING' && (
                    <div className="rounded-2xl bg-[#F8FAFC] p-5 border border-[#E7EEF3]">
                      <h3 className="text-sm font-semibold text-[#64748B] mb-3">Submit Appeal</h3>
                      <textarea
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value)}
                        placeholder="Explain why this evaluation should be reconsidered..."
                        className="w-full h-28 px-4 py-3 bg-white border border-[#E7EEF3] rounded-xl text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0787D6] focus:border-transparent transition-all resize-none"
                        maxLength={1000}
                      />
                      <p className="text-xs text-[#64748B] mt-2 text-right">
                        {appealReason.length}/1000
                      </p>
                      {appealResult && (
                        <p className={`text-sm mt-3 ${appealResult.includes('Failed') ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>
                          {appealResult}
                        </p>
                      )}
                      <button
                        onClick={handleAppeal}
                        disabled={appealing || !appealReason.trim()}
                        className="w-full h-[52px] mt-4 bg-[#0787D6] hover:bg-[#006DB4] disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200"
                      >
                        {appealing ? 'Submitting...' : 'Submit Appeal'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-8 py-4 border-t border-[#E7EEF3] flex justify-end bg-white/80">
              <button
                onClick={() => {
                  setSelectedSubmission(null)
                  setAppealResult(null)
                }}
                className="px-5 py-2.5 bg-white border border-[#E7EEF3] text-[#111827] rounded-xl font-medium hover:bg-[#F8FAFC] transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

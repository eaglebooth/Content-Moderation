'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Submission } from '@/lib/genlayer-client'
import Link from 'next/link'

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
      setAppealResult(`Appeal submitted successfully. Transaction hash: ${txHash}`)
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
      case 'APPROVED': return 'badge badge-approved'
      case 'REJECTED': return 'badge badge-rejected'
      case 'NEEDS_REVIEW': return 'badge badge-review'
      default: return 'badge badge-pending'
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

  const truncateContent = (content: string, maxLength = 96) => {
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
      <div className="min-h-screen bg-gradient-to-br from-[#FF9A62] via-[#FFB38A] to-[#FFFAF3] to-[#FF8D8A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#171717] mx-auto mb-4"></div>
          <p className="text-[#777777]">Loading submissions...</p>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#FF9A62] via-[#FFB38A] to-[#FFFAF3] to-[#FF8D8A]">
      <nav className="fixed top-0 left-0 right-0 z-50 nav-sticky">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="brand-mark">GM</div>
              <span className="brand-text">GenLayer Moderation</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Submit</Link>
              <Link href="/review" className="text-[#171717] font-semibold text-sm">Review</Link>
              <Link href="/results" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Statistics</Link>
              <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Docs</a>
            </div>
            <Link href="/" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#171717] mb-3">
                Review Dashboard
              </h1>
              <p className="text-[#777777] text-lg max-w-2xl">
                Review submissions, inspect AI decisions, and submit appeals when needed.
              </p>
            </div>
            <button
              onClick={loadData}
              className="btn-secondary w-fit"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 animate-fade-in-up animate-delay-100">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-2xl p-4 text-left transition-all duration-300 border ${
                  statusFilter === status
                    ? 'bg-[#171717] text-white border-[#171717] shadow-lg shadow-[rgba(23,23,23,0.12)]'
                    : 'glass-card hover:bg-white/80'
                }`}
              >
                <p className={`text-2xl font-bold ${statusFilter === status ? 'text-white' : 'text-[#171717]'}`}>{statusCounts[status]}</p>
                <p className={`text-xs mt-1 ${statusFilter === status ? 'text-white/70' : 'text-[#777777]'}`}>{statusLabels[status]}</p>
              </button>
            ))}
          </div>

          <div className="glass-card p-0 overflow-hidden animate-fade-in-up animate-delay-200">
            <div className="p-5 border-b border-[rgba(20,20,20,0.08)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#171717]">Submissions</h2>
                <p className="text-sm text-[#777777] mt-1">
                  {statusFilter === 'ALL' ? 'Showing all submissions' : `${statusLabels[statusFilter]} submissions`}
                </p>
              </div>
              <span className="badge badge-pending">{filteredSubmissions.length} visible</span>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-14">
                <p className="text-[#777777]">No submissions found</p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(20,20,20,0.06)]">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/35 text-xs font-semibold uppercase tracking-wide text-[#777777]">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Score</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-4">Content</div>
                  <div className="col-span-1"></div>
                </div>

                {filteredSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/55 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${200 + index * 35}ms` }}
                  >
                    <div className="col-span-1">
                      <span className="text-xs font-mono text-[#777777]">#{submission.id.toString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={getStatusBadgeClass(submission.status)}>
                        {submission.status}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`text-sm font-bold ${
                        Number(submission.score) >= 60 ? 'text-[#c94a3f]' :
                        Number(submission.score) < 50 ? 'text-[#4a7c31]' :
                        'text-[#c85a38]'
                      }`}>
                        {Number(submission.score)}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm text-[#777777]">{formatDate(submission.timestamp)}</p>
                    </div>
                    <div className="col-span-4 md:col-span-4">
                      <p className="text-sm text-[#171717] line-clamp-2">{truncateContent(submission.content, 96)}</p>
                    </div>
                    <div className="col-span-1 md:col-span-1 flex md:justify-end">
                      <button
                        onClick={() => handleViewDetails(submission)}
                        className="btn-secondary text-xs px-4 py-2"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#171717]/40 backdrop-blur-sm"
            onClick={() => {
              setSelectedSubmission(null)
              setAppealResult(null)
            }}
          />
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#171717]">
                    Submission #{selectedSubmission.id.toString()}
                  </h2>
                  <p className="text-sm text-[#777777] mt-1">{formatDate(selectedSubmission.timestamp)}</p>
                </div>
                <span className={getStatusBadgeClass(selectedSubmission.status)}>
                  {selectedSubmission.status}
                </span>
              </div>

              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-[#777777] mb-2">Content</h3>
                    <div className="rounded-2xl bg-[rgba(20,20,20,0.03)] p-5 border border-[rgba(20,20,20,0.08)]">
                      <p className="text-[#171717] whitespace-pre-wrap leading-relaxed">{selectedSubmission.content}</p>
                    </div>
                  </div>

                  {selectedSubmission.status === 'PENDING' && (
                    <div className="rounded-2xl bg-white/50 border border-[rgba(20,20,20,0.08)] p-5 text-center text-[#777777]">
                      This submission is still pending evaluation.
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl bg-[rgba(20,20,20,0.03)] p-5 border border-[rgba(20,20,20,0.08)]">
                    <h3 className="text-sm font-semibold text-[#777777] mb-4">AI Evaluation</h3>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="rounded-xl bg-white/60 p-4">
                        <p className="text-xs text-[#777777] mb-1">Score</p>
                        <p className={`text-3xl font-bold ${
                          Number(selectedSubmission.score) >= 60 ? 'text-[#c94a3f]' :
                          Number(selectedSubmission.score) < 50 ? 'text-[#4a7c31]' :
                          'text-[#c85a38]'
                        }`}>
                          {Number(selectedSubmission.score)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/60 p-4">
                        <p className="text-xs text-[#777777] mb-1">Verdict</p>
                        <p className="text-lg font-bold text-[#171717] leading-tight">{selectedSubmission.status}</p>
                      </div>
                    </div>

                    {selectedSubmission.reason && (
                      <div className="mb-5">
                        <p className="text-xs text-[#777777] mb-1">Reason</p>
                        <p className="text-sm text-[#171717] leading-relaxed">{selectedSubmission.reason}</p>
                      </div>
                    )}

                    {parseCategoryScores().length > 0 && (
                      <div>
                        <p className="text-xs text-[#777777] mb-2">Category Scores</p>
                        <div className="space-y-2">
                          {parseCategoryScores().map(({ category, score }) => (
                            <div key={category} className="flex items-center justify-between gap-3">
                              <span className="text-sm text-[#171717]">{category}</span>
                              <span className="text-sm font-semibold text-[#777777]">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedSubmission.status !== 'PENDING' && (
                    <div className="rounded-2xl bg-[rgba(20,20,20,0.03)] p-5 border border-[rgba(20,20,20,0.08)]">
                      <h3 className="text-sm font-semibold text-[#777777] mb-3">Submit Appeal</h3>
                      <textarea
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value)}
                        placeholder="Explain why this evaluation should be reconsidered..."
                        className="textarea-field w-full h-28 text-sm"
                        maxLength={1000}
                      />
                      <p className="text-xs text-[#777777] mt-2 text-right">
                        {appealReason.length}/1000
                      </p>
                      {appealResult && (
                        <p className={`text-sm mt-3 ${appealResult.includes('Failed') ? 'text-[#c94a3f]' : 'text-[#4a7c31]'}`}>
                          {appealResult}
                        </p>
                      )}
                      <button
                        onClick={handleAppeal}
                        disabled={appealing || !appealReason.trim()}
                        className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {appealing ? 'Submitting...' : 'Submit Appeal'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(20,20,20,0.08)] flex justify-end bg-white/80">
              <button
                onClick={() => {
                  setSelectedSubmission(null)
                  setAppealResult(null)
                }}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

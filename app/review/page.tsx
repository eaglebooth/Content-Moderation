'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Submission } from '@/lib/genlayer-client'
import Link from 'next/link'

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW'

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
      setAppealResult(`Appeal submitted successfully! Transaction hash: ${txHash}`)
      setAppealReason('')
      // Reload data to show updated status
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

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-sticky">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7657] to-[#FF9A62] flex items-center justify-center">
                <span className="text-white font-bold text-sm">GM</span>
              </div>
              <span className="font-bold text-[#171717] text-lg">GenLayer Moderation</span>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-[#171717] mb-4">
              Review Dashboard
            </h1>
            <p className="text-[#777777] text-lg max-w-2xl mx-auto">
              Review and moderate AI-generated content evaluations
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-fade-in-up animate-delay-100">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`glass-card p-4 text-center transition-all duration-300 ${
                  statusFilter === status ? 'ring-2 ring-[#FF9A62] bg-white/90' : 'hover:bg-white/80'
                }`}
              >
                <p className="text-2xl font-bold text-[#171717]">{statusCounts[status]}</p>
                <p className="text-xs text-[#777777] mt-1 capitalize">{status.replace('_', ' ')}</p>
              </button>
            ))}
          </div>

          {/* Submissions List */}
          <div className="glass-card p-6 animate-fade-in-up animate-delay-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#171717]">
                Submissions {statusFilter !== 'ALL' && `• ${statusFilter}`}
              </h2>
              <button
                onClick={loadData}
                className="text-sm text-[#777777] hover:text-[#171717] font-medium transition"
              >
                Refresh
              </button>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#777777]">No submissions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="bg-white/50 rounded-xl p-4 border border-[rgba(20,20,20,0.06)] hover:bg-white/70 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-[#777777] font-mono">
                            #{submission.id.toString()}
                          </span>
                          <span className={getStatusBadgeClass(submission.status)}>
                            {submission.status}
                          </span>
                          {submission.score !== undefined && (
                            <span className={`text-xs font-bold ${
                              submission.score >= 60 ? 'text-[#c94a3f]' :
                              submission.score < 50 ? 'text-[#4a7c31]' :
                              'text-[#c85a38]'
                            }`}>
                              Score: {submission.score}
                            </span>
                          )}
                        </div>
                        <p className="text-[#171717] font-medium mb-1 line-clamp-2">
                          {truncateContent(submission.content, 120)}
                        </p>
                        <p className="text-xs text-[#777777]">
                          {formatDate(submission.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewDetails(submission)}
                        className="btn-secondary text-xs px-4 py-2 shrink-0"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#171717]/40 backdrop-blur-sm"
            onClick={() => {
              setSelectedSubmission(null)
              setAppealResult(null)
            }}
          />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#171717]">
                    Submission #{selectedSubmission.id.toString()}
                  </h2>
                  <p className="text-sm text-[#777777]">{formatDate(selectedSubmission.timestamp)}</p>
                </div>
                <span className={getStatusBadgeClass(selectedSubmission.status)}>
                  {selectedSubmission.status}
                </span>
              </div>

              <div className="space-y-6">
                {/* Content */}
                <div>
                  <h3 className="text-sm font-semibold text-[#777777] mb-2">Content</h3>
                  <div className="bg-[rgba(20,20,20,0.03)] rounded-xl p-4 border border-[rgba(20,20,20,0.08)]">
                    <p className="text-[#171717] whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                </div>

                {/* Evaluation Result */}
                {(selectedSubmission.score !== undefined || selectedSubmission.reason) && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#777777] mb-2">AI Evaluation</h3>
                    <div className="bg-[rgba(20,20,20,0.03)] rounded-xl p-4 border border-[rgba(20,20,20,0.08)]">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-[#777777]">Overall Score</p>
                          <p className={`text-2xl font-bold ${
                            Number(selectedSubmission.score) >= 60 ? 'text-[#c94a3f]' :
                            Number(selectedSubmission.score) < 50 ? 'text-[#4a7c31]' :
                            'text-[#c85a38]'
                          }`}>
                            {Number(selectedSubmission.score)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#777777]">Verdict</p>
                          <p className={`text-lg font-bold capitalize ${
                            selectedSubmission.status === 'APPROVED' ? 'text-[#4a7c31]' :
                            selectedSubmission.status === 'REJECTED' ? 'text-[#c94a3f]' :
                            'text-[#c85a38]'
                          }`}>
                            {selectedSubmission.status}
                          </p>
                        </div>
                      </div>
                      {selectedSubmission.category_scores && (
                        <div className="mb-4">
                          <p className="text-xs text-[#777777] mb-2">Category Scores</p>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              try {
                                const parsed = JSON.parse(selectedSubmission.category_scores)
                                return Object.entries(parsed).map(([category, score]) => (
                                  <span
                                    key={category}
                                    className="px-2 py-1 bg-white/60 rounded-lg text-xs font-medium text-[#171717]"
                                  >
                                    {category}: {score as number}
                                  </span>
                                ))
                              } catch {
                                return <span className="text-sm text-[#777777]">{selectedSubmission.category_scores}</span>
                              }
                            })()}
                          </div>
                        </div>
                      )}
                      {selectedSubmission.reason && (
                        <div>
                          <p className="text-xs text-[#777777] mb-1">Reason</p>
                          <p className="text-sm text-[#171717]">{selectedSubmission.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appeal Section */}
                {selectedSubmission.status !== 'PENDING' && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#777777] mb-2">Submit Appeal</h3>
                    <textarea
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Explain why you believe this evaluation should be reconsidered..."
                      className="textarea-field w-full h-32 text-sm"
                      maxLength={1000}
                    />
                    <p className="text-xs text-[#777777] mt-1 text-right">
                      {appealReason.length}/1000
                    </p>
                    {appealResult && (
                      <p className={`text-sm mt-2 ${appealResult.includes('Failed') ? 'text-[#c94a3f]' : 'text-[#4a7c31]'}`}>
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

                {selectedSubmission.status === 'PENDING' && (
                  <div className="text-center py-4 text-[#777777]">
                    <p>This submission is still pending evaluation.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(20,20,20,0.08)] flex justify-end">
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

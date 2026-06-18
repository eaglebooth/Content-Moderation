'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Submission } from '@/lib/genlayer-client'
import Link from 'next/link'

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW'

export default function ReviewPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [appealing, setAppealing] = useState(false)
  const [appealResult, setAppealResult] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const client = getGenLayerClient()
      await client.initialize()

      const allSubmissions: Submission[] = []

      for (const status of ['APPROVED', 'REJECTED', 'NEEDS_REVIEW', 'PENDING']) {
        try {
          const ids = await client.getSubmissionsByStatus(status)
          const stringIds = ids.map(id => id.toString())
          for (const idStr of stringIds) {
            try {
              const sub = await client.getSubmission(idStr)
              allSubmissions.push(sub)
            } catch (e) {
              console.warn(`Failed to fetch submission ${idStr}:`, e)
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch ${status} submissions:`, e)
        }
      }

      allSubmissions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      setSubmissions(allSubmissions)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = filter === 'ALL'
    ? submissions
    : submissions.filter(s => s.status === filter)

  const handleAppeal = async (submissionId: string) => {
    if (!appealReason.trim()) {
      setAppealResult('Please enter an appeal reason')
      return
    }

    setAppealing(true)
    setAppealResult(null)

    try {
      const client = getGenLayerClient()
      const result = await client.appealSubmission(submissionId, appealReason)
      setAppealResult(`Appeal submitted! New status: ${result}`)
      setAppealReason('')
      setTimeout(() => loadSubmissions(), 3000)
    } catch (error: any) {
      setAppealResult(`Failed: ${error.message}`)
    } finally {
      setAppealing(false)
    }
  }

  const viewSubmission = async (submission: Submission) => {
    try {
      const client = getGenLayerClient()
      const full = await client.getSubmission(submission.id)
      setSelectedSubmission(full)
    } catch (error) {
      console.error('Failed to fetch submission details:', error)
      setSelectedSubmission(submission)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-900/50 text-green-300 border-green-700'
      case 'REJECTED': return 'bg-red-900/50 text-red-300 border-red-700'
      case 'NEEDS_REVIEW': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
      default: return 'bg-blue-900/50 text-blue-300 border-blue-700'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              GenLayer Moderation
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Submit
              </Link>
              <Link href="/review" className="text-white font-semibold">
                Review
              </Link>
              <Link href="/results" className="text-gray-300 hover:text-white transition">
                Statistics
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Content Review Dashboard
          </h1>
          <p className="text-gray-400">
            View all moderation decisions and appeal if needed
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:w-1/4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Filter by Status</h3>
              <div className="space-y-2">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`w-full px-4 py-2 rounded-lg text-left transition ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status === 'ALL' ? 'All Submissions' : status.replace('_', ' ')}
                    {status !== 'ALL' && (
                      <span className="float-right">
                        {status === 'ALL'
                          ? submissions.length
                          : submissions.filter(s => s.status === status).length
                        }
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/"
                  className="block text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  ← Submit New Content
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700">
                <p className="text-gray-400 text-lg">No submissions found</p>
                <Link href="/" className="text-blue-400 hover:underline mt-2 inline-block">
                  Submit your first content →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                    onClick={() => viewSubmission(submission)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            ID: {submission.id.toString()} • {new Date(Number(submission.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300 line-clamp-2 mb-2">
                          {submission.content.substring(0, 150)}
                          {submission.content.length > 150 && '...'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">By: {submission.submitter}</span>
                          <span className="text-gray-500">Type: {submission.type}</span>
                          <span className={`font-semibold ${getScoreColor(Number(submission.score))}`}>
                            Score: {Number(submission.score)}
                          </span>
                          {submission.appeal_count > 0n && (
                            <span className="text-orange-400">
                              Appeals: {Number(submission.appeal_count)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal - Submission Details */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 border border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Submission Details</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedSubmission.status)}`}>
                    {selectedSubmission.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Content ({selectedSubmission.type})</h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    {selectedSubmission.type === 'image_url' ? (
                      <img
                        src={selectedSubmission.content}
                        alt="Submitted content"
                        className="max-w-full h-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                          const parent = (e.target as HTMLImageElement).parentElement
                          if (parent) parent.innerHTML = '<p class="text-gray-500">Failed to load image</p>'
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{selectedSubmission.content}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Score</h4>
                    <p className={`text-2xl font-bold ${getScoreColor(Number(selectedSubmission.score))}`}>
                      {Number(selectedSubmission.score)}/100
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Appeals</h4>
                    <p className="text-2xl font-bold text-orange-400">
                      {Number(selectedSubmission.appeal_count)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">AI Reason</h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-gray-300">{selectedSubmission.reason}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Category Scores</h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    {(() => {
                      try {
                        const scores = JSON.parse(selectedSubmission.category_scores)
                        return Object.entries(scores).map(([category, score]) => (
                          <div key={category} className="flex justify-between mb-2">
                            <span className="capitalize">{category.replace('_', ' ')}</span>
                            <span className={Number(score) > 30 ? 'text-red-400' : 'text-green-400'}>
                              {score}
                            </span>
                          </div>
                        ))
                      } catch {
                        return <p className="text-gray-500">No category scores available</p>
                      }
                    })()}
                  </div>
                </div>

                {/* Appeal Section */}
                {(selectedSubmission.status === 'REJECTED' || selectedSubmission.status === 'NEEDS_REVIEW') && (
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="text-lg font-semibold mb-4">Appeal This Decision</h4>
                    {appealResult ? (
                      <div className={`p-4 rounded-lg ${appealResult.includes('submitted') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                        {appealResult}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Explain why you believe this decision should be reconsidered..."
                        />
                        <button
                          onClick={() => handleAppeal(selectedSubmission.id.toString())}
                          disabled={appealing || selectedSubmission.appeal_count >= 2n}
                          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition"
                        >
                          {appealing ? 'Submitting Appeal...' : 'Submit Appeal'}
                        </button>
                        {selectedSubmission.appeal_count >= 2n && (
                          <p className="text-sm text-gray-400">Maximum appeals reached for this submission</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>AI Content Moderation on GenLayer Network</p>
          <p className="mt-1">
            Built with GenLayer Intelligent Contracts
          </p>
        </div>
      </footer>
    </div>
  )
}

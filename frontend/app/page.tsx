'use client'

import { useState } from 'react'
import { getGenLayerClient } from '@/lib/genlayer-client'
import Link from 'next/link'

export default function HomePage() {
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<'text' | 'image_url'>('text')
  const [submitter, setSubmitter] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ submissionId: string; txHash: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!content.trim()) {
      setError('Please enter content to moderate')
      return
    }

    if (!submitter.trim()) {
      setError('Please enter your identifier')
      return
    }

    setLoading(true)

    try {
      const client = getGenLayerClient()
      await client.initialize()

      const txHash = await client.submitContent(content, contentType, submitter)

      setResult({
        submissionId: 'pending',
        txHash
      })
    } catch (err: any) {
      setError(err.message || 'Failed to submit content')
    } finally {
      setLoading(false)
    }
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
              <Link href="/review" className="text-gray-300 hover:text-white transition">
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
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI Content Moderation
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Submit your content for AI-powered moderation based on community guidelines.
            Get transparent decisions with detailed explanations on the GenLayer network.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6">Submit Content</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {result && (
              <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
                <p className="font-semibold">Content submitted successfully!</p>
                <p className="text-sm mt-1">Transaction: {result.txHash.slice(0, 14)}...{result.txHash.slice(-8)}</p>
                <p className="text-sm mt-1">Submission ID: {result.submissionId}</p>
                <p className="text-xs mt-2 text-gray-400">
                  <Link href="/review" className="underline hover:text-green-300">
                    Go to Review page →
                  </Link>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setContentType('text')}
                    className={`px-4 py-2 rounded-lg transition ${
                      contentType === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('image_url')}
                    className={`px-4 py-2 rounded-lg transition ${
                      contentType === 'image_url'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {contentType === 'text' ? 'Text Content' : 'Image URL'}
                </label>
                {contentType === 'text' ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter your text content here..."
                  />
                ) : (
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Identifier</label>
                <input
                  type="text"
                  value={submitter}
                  onChange={(e) => setSubmitter(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name or ID"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit for Moderation'
                )}
              </button>
            </form>
          </div>

          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>
              Content is evaluated by AI validators on the GenLayer network using
              strict consensus protocol.
            </p>
            <p className="mt-2">
              <Link href="/review" className="text-blue-400 hover:text-blue-300 underline">
                View all submissions →
              </Link>
            </p>
          </div>
        </div>
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

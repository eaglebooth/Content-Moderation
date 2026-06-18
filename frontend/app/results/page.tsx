'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Stats } from '@/lib/genlayer-client'
import Link from 'next/link'

export default function ResultsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [guidelines, setGuidelines] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const client = getGenLayerClient()
      await client.initialize()

      const [statsData, guidelinesData] = await Promise.all([
        client.getStats(),
        client.getGuidelines()
      ])

      setStats(statsData)
      setGuidelines(guidelinesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
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
              <Link href="/results" className="text-white font-semibold">
                Statistics
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Moderation Statistics
          </h1>
          <p className="text-gray-400">
            Real-time overview of AI-powered content moderation
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Total Submissions</h3>
              <p className="text-4xl font-bold text-white">{stats ? Number(stats.total_submissions) : 0}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Approved</h3>
              <p className="text-4xl font-bold text-green-400">{stats ? Number(stats.approved) : 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats && stats.total_submissions > 0n
                  ? `${((Number(stats.approved) / Number(stats.total_submissions)) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Rejected</h3>
              <p className="text-4xl font-bold text-red-400">{stats ? Number(stats.rejected) : 0}</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Needs Review</h3>
              <p className="text-4xl font-bold text-yellow-400">{stats ? Number(stats.needs_review) : 0}</p>
            </div>
          </div>

          {/* Approval Rate */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 mb-12">
            <h3 className="text-xl font-semibold mb-4">Approval Rate</h3>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-400">
                  {stats ? (Number(stats.approval_rate) / 100).toFixed(1) + '%' : '0%'}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  {stats ? `${Number(stats.approved)} / ${Number(stats.total_submissions)}` : '0 / 0'} submissions
                </span>
              </div>
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-700">
                <div
                  style={{ width: `${stats ? Number(stats.approval_rate) / 100 : 0}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Approval rate is calculated as (Approved submissions) / (Total evaluated submissions)
            </p>
          </div>

          {/* Community Guidelines */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 mb-12">
            <h3 className="text-xl font-semibold mb-6">Community Guidelines</h3>
            <div className="prose prose-invert max-w-none">
              {(() => {
                try {
                  const parsed = JSON.parse(guidelines)
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-400 mb-2">Hate Speech</h4>
                          <p className="text-sm text-gray-400">{parsed.hate_speech}</p>
                          <p className="text-sm text-gray-500 mt-1">Weight: 30%</p>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-400 mb-2">Misinformation</h4>
                          <p className="text-sm text-gray-400">{parsed.misinformation}</p>
                          <p className="text-sm text-gray-500 mt-1">Weight: 25%</p>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-400 mb-2">Explicit Content</h4>
                          <p className="text-sm text-gray-400">{parsed.explicit_content}</p>
                          <p className="text-sm text-gray-500 mt-1">Weight: 20%</p>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-400 mb-2">Harassment</h4>
                          <p className="text-sm text-gray-400">{parsed.harassment}</p>
                          <p className="text-sm text-gray-500 mt-1">Weight: 15%</p>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-400 mb-2">Spam</h4>
                          <p className="text-sm text-gray-400">{parsed.spam}</p>
                          <p className="text-sm text-gray-500 mt-1">Weight: 10%</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold mb-2">Decision Thresholds</h4>
                        <ul className="space-y-1 text-sm text-gray-400">
                          <li>• <strong>APPROVED:</strong> Total score &lt; 50 AND no category &gt; 40</li>
                          <li>• <strong>REJECTED:</strong> Total score ≥ 60 OR any category ≥ 50</li>
                          <li>• <strong>NEEDS_REVIEW:</strong> Total score 50-59 AND all categories &lt; 40</li>
                        </ul>
                      </div>
                    </div>
                  )
                } catch {
                  return <pre className="text-sm text-gray-300 overflow-x-auto">{guidelines}</pre>
                }
              })()}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition group"
            >
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition">
                Submit Content
              </h3>
              <p className="text-gray-400 text-sm">
                Submit text or image URLs for AI moderation
              </p>
            </Link>
            <Link
              href="/review"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition group"
            >
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition">
                Review Submissions
              </h3>
              <p className="text-gray-400 text-sm">
                View all moderation decisions and appeals
              </p>
            </Link>
            <a
              href="https://genlayer.com/explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition group"
            >
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition">
                View on Explorer
              </h3>
              <p className="text-gray-400 text-sm">
                See contract on GenLayer Explorer
              </p>
            </a>
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

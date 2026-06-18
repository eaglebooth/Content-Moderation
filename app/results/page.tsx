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
      <div className="min-h-screen bg-gradient-to-br from-[#FF9A62] via-[#FFB38A] to-[#FFFAF3] to-[#FF8D8A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#171717] mx-auto mb-4"></div>
          <p className="text-[#777777]">Loading statistics...</p>
        </div>
      </div>
    )
  }

  const total = Number(stats?.total_submissions || 0n)
  const approved = Number(stats?.approved || 0n)
  const rejected = Number(stats?.rejected || 0n)
  const pending = Number(stats?.pending || 0n)
  const needsReview = Number(stats?.needs_review || 0n)
  const approvalRate = total > 0 ? (approved / total) * 100 : 0

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
              <Link href="/review" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Review</Link>
              <Link href="/results" className="text-[#171717] font-semibold text-sm">Statistics</Link>
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
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-[#171717] mb-4">
              Moderation Statistics
            </h1>
            <p className="text-[#777777] text-lg max-w-2xl mx-auto">
              Real-time overview of AI-powered content moderation
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="glass-card p-6 animate-fade-in-up animate-delay-100">
              <h3 className="text-[#777777] text-sm font-medium mb-2">Total Submissions</h3>
              <p className="text-4xl font-bold text-[#171717]">{total}</p>
            </div>
            <div className="glass-card p-6 animate-fade-in-up animate-delay-200">
              <h3 className="text-[#777777] text-sm font-medium mb-2">Approved</h3>
              <p className="text-4xl font-bold text-[#4a7c31]">{approved}</p>
              <p className="text-sm text-[#777777] mt-2">
                {total > 0 ? `${approvalRate.toFixed(1)}%` : '0%'} of total
              </p>
            </div>
            <div className="glass-card p-6 animate-fade-in-up animate-delay-300">
              <h3 className="text-[#777777] text-sm font-medium mb-2">Rejected</h3>
              <p className="text-4xl font-bold text-[#c94a3f]">{rejected}</p>
            </div>
            <div className="glass-card p-6 animate-fade-in-up animate-delay-400">
              <h3 className="text-[#777777] text-sm font-medium mb-2">Needs Review</h3>
              <p className="text-4xl font-bold text-[#c85a38]">{needsReview}</p>
            </div>
          </div>

          {/* Approval Rate */}
          <div className="glass-card p-8 mb-12 animate-fade-in-up animate-delay-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-[#171717]">Approval Rate</h3>
                <p className="text-sm text-[#777777] mt-1">Based on evaluated submissions</p>
              </div>
              <div className="text-3xl font-bold text-[#171717]">
                {approvalRate.toFixed(1)}%
              </div>
            </div>
            <div className="relative h-4 bg-[rgba(20,20,20,0.06)] rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#9ADF72] to-[#4a7c31] rounded-full transition-all duration-1000"
                style={{ width: `${approvalRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-[#777777] mt-4">
              {approved} approved out of {total} total submissions
            </p>
          </div>

          {/* Community Guidelines */}
          <div className="glass-card p-8 mb-12 animate-fade-in-up animate-delay-300">
            <h3 className="text-xl font-semibold text-[#171717] mb-6">Community Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {(() => {
                try {
                  const parsed = JSON.parse(guidelines)
                  return (
                    <>
                      <div className="bg-white/50 rounded-xl p-5 border border-[rgba(20,20,20,0.06)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(255,125,115,0.2)] flex items-center justify-center">
                            <span className="text-lg">🔥</span>
                          </div>
                          <h4 className="font-semibold text-[#171717]">Hate Speech</h4>
                        </div>
                        <p className="text-sm text-[#777777] leading-relaxed">{parsed.hate_speech}</p>
                        <p className="text-xs text-[#777777] mt-2 opacity-60">Weight: 30%</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-5 border border-[rgba(20,20,20,0.06)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(255,154,98,0.2)] flex items-center justify-center">
                            <span className="text-lg">⚠️</span>
                          </div>
                          <h4 className="font-semibold text-[#171717]">Misinformation</h4>
                        </div>
                        <p className="text-sm text-[#777777] leading-relaxed">{parsed.misinformation}</p>
                        <p className="text-xs text-[#777777] mt-2 opacity-60">Weight: 25%</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-5 border border-[rgba(20,20,20,0.06)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(255,141,138,0.2)] flex items-center justify-center">
                            <span className="text-lg">🔞</span>
                          </div>
                          <h4 className="font-semibold text-[#171717]">Explicit Content</h4>
                        </div>
                        <p className="text-sm text-[#777777] leading-relaxed">{parsed.explicit_content}</p>
                        <p className="text-xs text-[#777777] mt-2 opacity-60">Weight: 20%</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-5 border border-[rgba(20,20,20,0.06)]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(255,154,98,0.2)] flex items-center justify-center">
                            <span className="text-lg">💬</span>
                          </div>
                          <h4 className="font-semibold text-[#171717]">Harassment</h4>
                        </div>
                        <p className="text-sm text-[#777777] leading-relaxed">{parsed.harassment}</p>
                        <p className="text-xs text-[#777777] mt-2 opacity-60">Weight: 15%</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-5 border border-[rgba(20,20,20,0.06)] md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(154,223,114,0.2)] flex items-center justify-center">
                            <span className="text-lg">📢</span>
                          </div>
                          <h4 className="font-semibold text-[#171717]">Spam</h4>
                        </div>
                        <p className="text-sm text-[#777777] leading-relaxed">{parsed.spam}</p>
                        <p className="text-xs text-[#777777] mt-2 opacity-60">Weight: 10%</p>
                      </div>
                    </>
                  )
                } catch {
                  return <pre className="text-sm text-[#171717] overflow-x-auto whitespace-pre-wrap">{guidelines}</pre>
                }
              })()}
            </div>

            <div className="mt-8 pt-6 border-t border-[rgba(20,20,20,0.08)]">
              <h4 className="font-semibold text-[#171717] mb-3">Decision Thresholds</h4>
              <ul className="space-y-2 text-sm text-[#777777]">
                <li className="flex items-start gap-2">
                  <span className="text-[#9ADF72] font-bold">●</span>
                  <span><strong>APPROVED:</strong> Total score &lt; 50 AND no category &gt; 40</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c94a3f] font-bold">●</span>
                  <span><strong>REJECTED:</strong> Total score ≥ 60 OR any category ≥ 50</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#c85a38] font-bold">●</span>
                  <span><strong>NEEDS REVIEW:</strong> Total score 50-59 AND all categories &lt; 40</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/"
              className="glass-card p-6 hover:bg-white/80 transition-all duration-300 animate-fade-in-up animate-delay-400 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,154,98,0.2)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#FF7657]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#171717] mb-2">Submit Content</h3>
              <p className="text-[#777777] text-sm">Submit text or image URLs for AI moderation</p>
            </Link>
            <Link
              href="/review"
              className="glass-card p-6 hover:bg-white/80 transition-all duration-300 animate-fade-in-up animate-delay-400 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(154,223,114,0.2)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#4a7c31]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#171717] mb-2">Review Submissions</h3>
              <p className="text-[#777777] text-sm">View all moderation decisions and appeals</p>
            </Link>
            <a
              href="https://genlayer.com/explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-6 hover:bg-white/80 transition-all duration-300 animate-fade-in-up animate-delay-400 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,141,138,0.2)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#c94a3f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#171717] mb-2">View on Explorer</h3>
              <p className="text-[#777787] text-sm">See contract on GenLayer Explorer</p>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white/60 border-t border-[rgba(20,20,20,0.06)]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF7657] to-[#FF9A62] flex items-center justify-center">
              <span className="text-white font-bold text-xs">GM</span>
            </div>
            <span className="font-semibold text-[#171717]">GenLayer Moderation</span>
          </div>
          <p className="text-sm text-[#777777]">
            Built with GenLayer Intelligent Contracts
          </p>
          <p className="text-xs text-[#777777] mt-2 opacity-60">
            © 2025 AI Content Moderation Project
          </p>
        </div>
      </footer>
    </div>
  )
}
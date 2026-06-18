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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background watermark */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="watermark absolute" style={{ top: '-5%', left: '-5%' }}>MODERATION</div>
        <div className="watermark absolute" style={{ top: '40%', right: '-8%' }}>AI</div>
        <div className="watermark absolute" style={{ bottom: '-10%', left: '-2%' }}>GENLAYER</div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-sticky transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7657] to-[#FF9A62] flex items-center justify-center">
                <span className="text-white font-bold text-sm">GM</span>
              </div>
              <span className="font-bold text-[#171717] text-lg">GenLayer Moderation</span>
            </Link>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Submit</Link>
              <Link href="/review" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Review</Link>
              <Link href="/results" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Statistics</Link>
              <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="text-[#777777] hover:text-[#171717] font-medium transition text-sm">Docs</a>
            </div>

            {/* CTA Button */}
            <Link href="/" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="animate-fade-in-up">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-[rgba(20,20,20,0.08)] mb-8">
                <span className="w-2 h-2 rounded-full bg-[#9ADF72]"></span>
                <span className="text-sm text-[#777777] font-medium">Powered by GenLayer AI</span>
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl font-bold text-[#171717] leading-tight mb-6">
                Content Moderation{' '}
                <span className="gradient-text">for Everyone</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-[#777777] leading-relaxed max-w-xl mb-10">
                Submit your content for AI-powered moderation. Our decentralized network of validators
                ensures fair, transparent decisions with detailed explanations. Built on GenLayer.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/" className="btn-primary inline-flex items-center gap-2">
                  <span>Start Submitting</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/review" className="btn-secondary">
                  View Dashboard
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex gap-12">
                <div>
                  <div className="text-3xl font-bold text-[#171717]">Multi-Validator</div>
                  <div className="text-[#777777] text-sm mt-1">Consensus Protocol</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#171717]">Transparent</div>
                  <div className="text-[#777777] text-sm mt-1">AI Decisions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#171717]">Decentralized</div>
                  <div className="text-[#777777] text-sm mt-1">On-Chain</div>
                </div>
              </div>
            </div>

            {/* Right - Dashboard mockup */}
            <div className="relative animate-fade-in-up animate-delay-300">
              {/* Radial glow */}
              <div className="absolute -inset-20 radial-glow rounded-full blur-3xl"></div>

              {/* Dashboard mockup */}
              <div className="relative glass-card p-8 animate-float">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-[#777777] mb-1">Total Score</div>
                    <div className="text-3xl font-bold text-[#171717]">87<span className="text-lg text-[#777777] font-normal">/100</span></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-approved">APPROVED</span>
                  </div>
                </div>

                {/* Category scores */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#777777]">Hate Speech</span>
                      <span className="font-medium text-[#171717]">12%</span>
                    </div>
                    <div className="h-2 bg-[rgba(20,20,20,0.06)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#9ADF72] rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#777777]">Misinformation</span>
                      <span className="font-medium text-[#171717]">8%</span>
                    </div>
                    <div className="h-2 bg-[rgba(20,20,20,0.06)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#9ADF72] rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#777777]">Harassment</span>
                      <span className="font-medium text-[#171717]">23%</span>
                    </div>
                    <div className="h-2 bg-[rgba(20,20,20,0.06)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF9A62] rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                </div>

                {/* AI Reason */}
                <div className="bg-white/40 rounded-xl p-4 border border-[rgba(20,20,20,0.06)]">
                  <div className="text-xs text-[#777777] mb-2 uppercase tracking-wider">AI Analysis</div>
                  <p className="text-sm text-[#171717] leading-relaxed">
                    This content was evaluated across 5 community guideline categories.
                    The overall score indicates APPROVED status with low risk factors.
                  </p>
                </div>
              </div>

              {/* Floating tokens */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center animate-float">
                <div className="text-2xl">🎯</div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center animate-float animate-float-delay-1">
                <div className="text-xl">🔐</div>
              </div>
              <div className="absolute top-1/2 -right-6 w-12 h-12 rounded-xl bg-white shadow-lg flex items-center justify-center animate-float animate-float-delay-2">
                <div className="text-lg">⚡</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Section */}
      <section className="py-24 px-6 bg-white/40">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-10 animate-fade-in-up animate-delay-200">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#171717] mb-3">Submit Content</h2>
              <p className="text-[#777777]">Enter your content below for AI moderation evaluation</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[rgba(255,125,115,0.15)] border border-[rgba(255,125,115,0.3)] rounded-xl text-[#c94a3f]">
                {error}
              </div>
            )}

            {result && (
              <div className="mb-6 p-4 bg-[rgba(154,223,114,0.15)] border border-[rgba(154,223,114,0.3)] rounded-xl text-[#4a7c31]">
                <p className="font-semibold">Content submitted successfully!</p>
                <p className="text-sm mt-1">Transaction: {result.txHash.slice(0, 14)}...{result.txHash.slice(-8)}</p>
                <p className="text-sm mt-1">Submission ID: {result.submissionId}</p>
                <p className="text-xs mt-2 text-[#777777]">
                  <Link href="/review" className="underline hover:text-[#171717]">
                    Go to Review page →
                  </Link>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#171717]">Content Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setContentType('text')}
                    className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                      contentType === 'text'
                        ? 'bg-[#171717] text-white'
                        : 'bg-white border border-[rgba(20,20,20,0.12)] text-[#777777] hover:border-[rgba(20,20,20,0.2)]'
                    }`}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('image_url')}
                    className={`px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                      contentType === 'image_url'
                        ? 'bg-[#171717] text-white'
                        : 'bg-white border border-[rgba(20,20,20,0.12)] text-[#777777] hover:border-[rgba(20,20,20,0.2)]'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#171717]">
                  {contentType === 'text' ? 'Text Content' : 'Image URL'}
                </label>
                {contentType === 'text' ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="textarea-field w-full"
                    placeholder="Enter your text content here..."
                  />
                ) : (
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="input-field w-full"
                    placeholder="https://example.com/image.jpg"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#171717]">Your Identifier</label>
                <input
                  type="text"
                  value={submitter}
                  onChange={(e) => setSubmitter(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your name or ID"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit for Moderation'
                )}
              </button>
            </form>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,154,98,0.2)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#FF7657]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#171717] mb-2">AI-Powered</h3>
              <p className="text-sm text-[#777777]">Advanced AI evaluates content against community guidelines</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(154,223,114,0.2)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#4a7c31]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#171717] mb-2">Fair & Transparent</h3>
              <p className="text-sm text-[#777777]">Multi-validator consensus ensures unbiased decisions</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,141,138,0.2)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#c94a3f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#171717] mb-2">On-Chain Verifiable</h3>
              <p className="text-sm text-[#777777]">All decisions recorded on GenLayer blockchain</p>
            </div>
          </div>
        </div>
      </section>

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
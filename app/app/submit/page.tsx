'use client'

import { useState } from 'react'
import { getGenLayerClient } from '@/lib/genlayer-client'
import { AppShell } from '@/components/AppShell'
import Link from 'next/link'

export default function SubmitPage() {
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<'text' | 'image_url'>('text')
  const [submitter, setSubmitter] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ submissionId: string; txHash: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
      setContent('')
    } catch (err: any) {
      setError(err.message || 'Failed to submit content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Submit Content" subtitle="AI evaluation with decentralized validator consensus.">
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-[#EF4444]">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-[#16A34A]">
              <p className="font-semibold">Content submitted successfully!</p>
              <p className="text-sm mt-1">Transaction: {result.txHash.slice(0, 14)}...{result.txHash.slice(-8)}</p>
              <p className="text-sm mt-1">Submission ID: {result.submissionId}</p>
              <p className="text-xs mt-2 text-[#64748B]">
                <Link href="/app/review" className="underline hover:text-[#111827]">
                  Go to Review page →
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-[#111827]">Content Type</label>
              <div className="flex gap-3">
                {(['text', 'image_url'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`flex-1 px-5 py-3 rounded-xl transition-all duration-200 font-medium ${
                      contentType === type
                        ? 'bg-[#111827] text-white'
                        : 'bg-white border border-[#E7EEF3] text-[#64748B] hover:border-[#0787D6]'
                    }`}
                  >
                    {type === 'text' ? 'Text' : 'Image URL'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#111827]">
                {contentType === 'text' ? 'Text Content' : 'Image URL'}
              </label>
              {contentType === 'text' ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-white border border-[#E7EEF3] rounded-xl text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0787D6] focus:border-transparent transition-all resize-none"
                  placeholder="Enter your text content here..."
                />
              ) : (
                <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E7EEF3] rounded-xl text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0787D6] focus:border-transparent transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#111827]">Your Identifier</label>
              <input
                type="text"
                value={submitter}
                onChange={(e) => setSubmitter(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E7EEF3] rounded-xl text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0787D6] focus:border-transparent transition-all"
                placeholder="Enter your name or ID"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced Options
              </button>
              {showAdvanced && (
                <div className="mt-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E7EEF3]">
                  <p className="text-sm text-[#64748B]">Additional options will be available here.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-[#0787D6] hover:bg-[#006DB4] disabled:opacity-70 text-white rounded-xl font-medium transition-all duration-200"
            >
              {loading ? 'Analyzing with validators...' : 'Submit for Moderation'}
            </button>
          </form>
        </div>

        {/* Right: Help Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-6">How moderation works</h3>
            <div className="space-y-5">
              {[
                { step: '1', title: 'Submit', desc: 'Upload your content for evaluation.' },
                { step: '2', title: 'AI Analysis', desc: 'AI evaluates across risk categories.' },
                { step: '3', title: 'Consensus', desc: 'Validators review and vote.' },
                { step: '4', title: 'Result', desc: 'Decision recorded on-chain.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F4FC] flex items-center justify-center text-sm font-semibold text-[#0787D6] shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111827] mb-1">{item.title}</h4>
                    <p className="text-sm text-[#64748B]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Info</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#0787D6] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Estimated Response</p>
                  <p className="text-sm text-[#64748B]">~2-3 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#0787D6] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Supported Categories</p>
                  <p className="text-sm text-[#64748B]">Hate Speech, Misinformation, Harassment, Explicit Content, Spam</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

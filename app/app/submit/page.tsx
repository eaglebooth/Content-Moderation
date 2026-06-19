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
  const [result, setResult] = useState<{ submissionId: string; txHash: string; evaluationTxHash?: string } | null>(null)
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

      const statsBefore = await client.getStats().catch(() => null)
      const submissionId = statsBefore ? Number(statsBefore.total_submissions).toString() : 'latest'
      const txHash = await client.submitContent(content, contentType, submitter)

      let evaluationTxHash: string | undefined
      if (submissionId !== 'latest') {
        try {
          evaluationTxHash = await client.evaluateSubmission(submissionId)
        } catch (evaluationError) {
          console.warn('Evaluation must be retried from the review queue:', evaluationError)
        }
      }

      setResult({
        submissionId,
        txHash,
        evaluationTxHash,
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
      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* Left: Form */}
        <div className="assist-card rounded-[26px] p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-[#EF4444]">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl text-[#16A34A]">
              <p className="font-semibold">Content submitted successfully!</p>
              <p className="text-sm mt-1">Submit tx: {result.txHash.slice(0, 14)}...{result.txHash.slice(-8)}</p>
              {result.evaluationTxHash && (
                <p className="text-sm mt-1">Evaluation tx: {result.evaluationTxHash.slice(0, 14)}...{result.evaluationTxHash.slice(-8)}</p>
              )}
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
                <div className="flex rounded-full bg-[#f1f3f5] p-1">
                {(['text', 'image_url'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`flex-1 rounded-full px-5 py-3 font-semibold transition-all duration-200 ${
                      contentType === type
                        ? 'bg-[#101114] text-white shadow-sm'
                        : 'text-[#667085] hover:bg-white hover:text-[#101114]'
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
                  className="assist-input w-full resize-none rounded-[20px] px-4 py-3 placeholder-[#98A2B3]"
                  placeholder="Enter your text content here..."
                />
              ) : (
                <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="assist-input w-full rounded-full px-4 py-3 placeholder-[#98A2B3]"
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
                className="assist-input w-full rounded-full px-4 py-3 placeholder-[#98A2B3]"
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
                <div className="assist-card-muted mt-4 rounded-[20px] p-4">
                  <p className="text-sm text-[#64748B]">Additional options will be available here.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="assist-btn-primary h-[52px] w-full rounded-full font-bold transition-all duration-200 disabled:opacity-70"
            >
              {loading ? 'Analyzing with validators...' : 'Submit for Moderation'}
            </button>
          </form>
        </div>

        {/* Right: Help Panel */}
        <div className="space-y-6">
          <div className="assist-card rounded-[24px] p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-6">How moderation works</h3>
            <div className="space-y-5">
              {[
                { step: '1', title: 'Submit', desc: 'Upload your content for evaluation.' },
                { step: '2', title: 'AI Analysis', desc: 'AI evaluates across risk categories.' },
                { step: '3', title: 'Consensus', desc: 'Validators review and vote.' },
                { step: '4', title: 'Result', desc: 'Decision recorded on-chain.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff5b12] text-sm font-bold text-white">
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

          <div className="assist-card rounded-[24px] p-6">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Info</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ff5b12] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#111827]">Estimated Response</p>
                  <p className="text-sm text-[#64748B]">~2-3 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#ff5b12] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

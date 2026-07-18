'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient } from '@/lib/genlayer-client'

function parseGen(value: string) {
  if (!/^\d+(\.\d{0,18})?$/.test(value)) throw new Error('Enter a valid GEN bond amount')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18))
}

export default function SubmitPage() {
  const [type, setType] = useState<'TEXT' | 'URL'>('TEXT')
  const [content, setContent] = useState('')
  const [bond, setBond] = useState('0.000000000000000001')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [submissionId, setSubmissionId] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('Confirm the moderation bond in your wallet.')
    try {
      const normalizedContent = content.trim()
      if (!normalizedContent) throw new Error('Enter content before submitting.')
      const bondWei = parseGen(bond)
      if (bondWei <= 0n) throw new Error('The moderation bond must be greater than zero.')
      const result = await getGenLayerClient().submitContent(normalizedContent, type, bondWei)
      if (!result.success) throw new Error(result.error || 'Submission failed')
      const id = typeof result.data === 'string' ? result.data.replace(/"/g, '') : ''
      setSubmissionId(id)
      setMessage(`Submission accepted and verified on-chain${result.hash ? `: ${result.hash.slice(0, 12)}...` : ''}`)
      setContent('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Submission failed')
    } finally { setBusy(false) }
  }

  return (
    <AppShell title="Submit Content" subtitle="Lock a refundable GEN bond and create an authenticated moderation request.">
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <form onSubmit={submit} className="assist-card rounded-[26px] p-6 md:p-8">
          <div className="mb-7 flex rounded-full bg-[#f6f7f8] p-1">
            {(['TEXT', 'URL'] as const).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`flex-1 rounded-full px-4 py-3 text-sm font-bold transition ${type === value ? 'bg-[#101114] text-white' : 'text-[#667085]'}`}>{value === 'TEXT' ? 'Paste text' : 'Public URL'}</button>)}
          </div>
          <label className="text-sm font-bold text-[#101114]">{type === 'TEXT' ? 'Content under review' : 'Evidence URL'}</label>
          {type === 'TEXT' ? (
            <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={4000} required className="assist-input mt-3 h-56 w-full resize-none rounded-[22px] p-5" placeholder="Paste the exact text the validator jury should assess..." />
          ) : (
            <input value={content} onChange={(event) => setContent(event.target.value)} required type="url" className="assist-input mt-3 h-14 w-full rounded-full px-5" placeholder="https://example.com/public-content" />
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div><label className="text-sm font-bold text-[#101114]">Moderation bond</label><div className="relative mt-3"><input value={bond} onChange={(event) => setBond(event.target.value)} inputMode="decimal" className="assist-input h-14 w-full rounded-full px-5 pr-16" /><span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#667085]">GEN</span></div></div>
            <button disabled={busy || !content.trim()} className="assist-btn-primary h-14 rounded-full px-8 font-bold disabled:opacity-50">{busy ? 'Submitting...' : 'Lock bond & submit'}</button>
          </div>
          {message && <div className="mt-5 rounded-[18px] bg-[#eef8fd] p-4 text-sm font-semibold text-[#34566a]">{message}{submissionId && <Link href={`/app/request/${submissionId}`} className="ml-2 font-black text-[#ff5b12]">Open request</Link>}</div>}
        </form>
        <aside className="space-y-4">
          {[['01', 'Authenticated owner', 'The contract records the transaction sender. No submitter field can be spoofed.'], ['02', 'Bond custody', 'GEN remains locked until the final moderation outcome is settled.'], ['03', 'Separate evaluation', 'After finalization, open the request and trigger the validator jury.']].map(([number, title, copy]) => <div key={number} className="assist-card rounded-[24px] p-6"><span className="text-xs font-black text-[#ff5b12]">{number}</span><h2 className="mt-3 text-lg font-bold text-[#101114]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#667085]">{copy}</p></div>)}
        </aside>
      </div>
    </AppShell>
  )
}

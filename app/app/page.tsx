'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient, type Submission, type SystemState } from '@/lib/genlayer-client'

export default function Dashboard() {
  const [state, setState] = useState<SystemState | null>(null)
  const [recent, setRecent] = useState<Submission[]>([])
  const [queueLoaded, setQueueLoaded] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { (async () => { try { const client = getGenLayerClient(); const liveState = await client.getSystemState(); setState(liveState); setRecent((await client.getSubmissions(liveState)).slice(0, 3)); setQueueLoaded(true) } catch (e) { setError(e instanceof Error ? e.message : 'Contract read failed') } })() }, [])
  return <AppShell title="Moderation Bond Desk" subtitle="Live contract state, authenticated submissions, and fund-backed outcomes.">
    {error && <div className="mb-5 rounded-[20px] bg-[#fff1eb] p-5 font-semibold text-[#b43d08]">{error}</div>}
    <div className="mb-5 grid gap-4 md:grid-cols-4">{[['Requests', state?.submission_count], ['Open bond', state?.total_bonded], ['Refunded', state?.total_refunded], ['Slashed', state?.total_slashed]].map(([label, value], index) => <div key={label as string} className="assist-card rounded-[24px] p-5"><p className="text-sm font-semibold text-[#667085]">{label as string}</p><p className="mt-2 text-3xl font-extrabold text-[#101114]">{value === undefined ? '...' : index === 0 ? value.toString() : `${value.toString()} wei`}</p></div>)}</div>
    <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <section className="assist-card rounded-[26px] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Recent requests</h2><Link href="/app/review" className="text-sm font-black text-[#ff5b12]">View queue</Link></div>{!queueLoaded ? <p className="rounded-[20px] bg-[#f6f7f8] p-10 text-center text-sm text-[#667085]">Reading the on-chain queue...</p> : recent.length === 0 ? <p className="rounded-[20px] bg-[#f6f7f8] p-10 text-center text-sm text-[#667085]">The on-chain queue is empty.</p> : recent.map((item) => <Link href={`/app/request/${item.submission_id}`} key={item.submission_id.toString()} className="flex items-center justify-between gap-4 border-t border-[#eceff3] py-4"><div><p className="font-bold">Request #{item.submission_id.toString()}</p><p className="mt-1 line-clamp-1 text-sm text-[#667085]">{item.content}</p></div><span className="rounded-full bg-[#eef8fd] px-3 py-2 text-xs font-black text-[#0478ba]">{item.status.replaceAll('_', ' ')}</span></Link>)}</section>
      <aside className="assist-card rounded-[26px] p-6"><h2 className="text-lg font-bold">Next action</h2><p className="mt-2 text-sm leading-6 text-[#667085]">Create one bonded request, wait for finalization, then evaluate it from its request page.</p><Link href="/app/submit" className="assist-btn-primary mt-6 block rounded-full px-5 py-4 text-center font-bold">Submit content</Link><div className="mt-6 rounded-[20px] bg-[#f6f7f8] p-4"><p className="text-xs font-black uppercase text-[#667085]">Treasury</p><p className="mt-2 break-all font-mono text-xs text-[#101114]">{state?.treasury || 'Reading...'}</p></div></aside>
    </div>
  </AppShell>
}

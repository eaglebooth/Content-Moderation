'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient, type Submission } from '@/lib/genlayer-client'

export default function ReviewPage() {
  const [items, setItems] = useState<Submission[]>([])
  const [filter, setFilter] = useState('ALL')
  const [message, setMessage] = useState('Loading on-chain queue...')

  async function load() {
    try { const data = await getGenLayerClient().getSubmissions(); setItems(data); setMessage(data.length ? '' : 'No on-chain submissions yet.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Queue read failed') }
  }
  useEffect(() => { load() }, [])
  const visible = filter === 'ALL' ? items : items.filter((item) => item.status === filter)
  const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED_APPEALABLE', 'NEEDS_REVIEW', 'APPEAL_PENDING', 'FINAL_REJECTED']

  return <AppShell title="Review Queue" subtitle="Read live requests, then open one request for its next valid action.">
    <div className="mb-5 flex gap-2 overflow-x-auto rounded-[24px] bg-white p-2 shadow-sm">{filters.map((value) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${filter === value ? 'bg-[#101114] text-white' : 'text-[#667085] hover:bg-[#f6f7f8]'}`}>{value.replaceAll('_', ' ')}</button>)}<button onClick={load} className="ml-auto rounded-full border border-[#e7eaee] px-4 py-2 text-xs font-bold">Refresh</button></div>
    <div className="assist-card overflow-hidden rounded-[26px]">
      {message && <p className="p-10 text-center text-sm font-semibold text-[#667085]">{message}</p>}
      {visible.map((item) => <Link href={`/app/request/${item.submission_id}`} key={item.submission_id.toString()} className="grid gap-3 border-b border-[#eceff3] p-5 transition hover:bg-[#f8fafb] md:grid-cols-[100px_1fr_190px_100px] md:items-center"><span className="text-sm font-black text-[#101114]">#{item.submission_id.toString()}</span><div><p className="line-clamp-2 text-sm font-semibold text-[#101114]">{item.content}</p><p className="mt-1 text-xs text-[#667085]">{item.type} · bond {item.bond_status.toLowerCase()}</p></div><span className="w-fit rounded-full bg-[#eef8fd] px-3 py-2 text-xs font-black text-[#0478ba]">{item.status.replaceAll('_', ' ')}</span><span className="text-right text-sm font-black text-[#ff5b12]">Risk {item.score.toString()}</span></Link>)}
    </div>
  </AppShell>
}

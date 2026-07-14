'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getContractConfig, getGenLayerClient, type Submission } from '@/lib/genlayer-client'

export default function RequestPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Submission | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { getGenLayerClient().getSubmission(params.id).then(setItem).catch((e) => setError(e instanceof Error ? e.message : 'Read failed')) }, [params.id])
  const scores = (() => { try { return Object.entries(JSON.parse(item?.category_scores || '{}')) } catch { return [] } })()
  const config = getContractConfig()
  return <AppShell title={`Request #${params.id}`} subtitle="One on-chain record, with each transaction isolated on its own page.">
    {!item ? <div className="assist-card rounded-[26px] p-12 text-center text-[#667085]">{error || 'Reading contract state...'}</div> : <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="assist-card rounded-[26px] p-6 md:p-8"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#101114] px-4 py-2 text-xs font-black text-white">{item.status.replaceAll('_', ' ')}</span><span className="rounded-full bg-[#eef8fd] px-4 py-2 text-xs font-black text-[#0478ba]">BOND {item.bond_status}</span></div><p className="mt-7 text-xs font-black uppercase text-[#667085]">{item.type} evidence</p><p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-[#101114]">{item.content}</p>{item.reason && <div className="mt-7 rounded-[22px] bg-[#f6f7f8] p-5"><p className="text-xs font-black uppercase text-[#ff5b12]">Jury reason</p><p className="mt-3 text-sm leading-6 text-[#334155]">{item.reason}</p></div>}</section>
        <aside className="space-y-4"><div className="assist-card rounded-[26px] p-6"><p className="text-sm font-bold text-[#667085]">Risk score</p><p className="mt-2 text-6xl font-black text-[#101114]">{item.score.toString()}</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eef1f4]"><div className="h-full bg-[#ff5b12]" style={{ width: `${Math.min(100, Number(item.score))}%` }} /></div></div><div className="assist-card rounded-[26px] p-6"><p className="text-xs font-black uppercase text-[#667085]">Bond</p><p className="mt-2 text-2xl font-black">{item.bond.toString()} wei</p><p className="mt-2 text-sm text-[#667085]">Owner {item.submitter.slice(0, 8)}...{item.submitter.slice(-6)}</p></div></aside>
      </div>
      {scores.length > 0 && <section className="assist-card rounded-[26px] p-6 md:p-8"><h2 className="text-lg font-bold">Category evidence</h2><div className="mt-5 grid gap-3 md:grid-cols-5">{scores.map(([name, value]) => <div key={name} className="rounded-[18px] bg-[#f6f7f8] p-4"><p className="text-xs font-bold text-[#667085]">{name.replaceAll('_', ' ')}</p><p className="mt-2 text-2xl font-black">{String(value)}</p></div>)}</div></section>}
      <section className="grid gap-4 md:grid-cols-3"><Action href={`/app/evaluate/${params.id}`} title="Evaluate" copy="Run GenLayer jury consensus for a pending request." enabled={item.status === 'PENDING'} /><Action href={`/app/appeal/${params.id}`} title="Appeal" copy="Add a reason and new public evidence." enabled={item.status === 'REJECTED_APPEALABLE' || item.status === 'NEEDS_REVIEW' || item.status === 'APPEAL_PENDING'} /><Action href={`/app/settle/${params.id}`} title="Settle bond" copy="Refund or slash GEN after a final outcome." enabled={item.bond_status === 'LOCKED' && item.status !== 'PENDING'} /></section>
      <section className="assist-card rounded-[26px] p-6"><p className="text-xs font-black uppercase text-[#667085]">Connected contract</p><p className="mt-2 break-all font-mono text-sm">{config.address || 'Not configured'}</p><p className="mt-2 text-sm font-bold text-[#0478ba]">{config.network}</p></section>
    </div>}
  </AppShell>
}

function Action({ href, title, copy, enabled }: { href: string; title: string; copy: string; enabled: boolean }) {
  return enabled ? <Link href={href} className="assist-card rounded-[24px] p-6 transition hover:-translate-y-1"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#667085]">{copy}</p><p className="mt-5 text-sm font-black text-[#ff5b12]">Open step →</p></Link> : <div className="rounded-[24px] border border-[#eceff3] bg-white/50 p-6 opacity-55"><h2 className="text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[#667085]">Not available in the current state.</p></div>
}

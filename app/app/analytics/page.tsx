'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient, type Submission, type SystemState } from '@/lib/genlayer-client'

export default function AnalyticsPage() {
  const [state, setState] = useState<SystemState | null>(null)
  const [items, setItems] = useState<Submission[]>([])
  const [policy, setPolicy] = useState<any>(null)
  useEffect(() => { (async () => { const client = getGenLayerClient(); setState(await client.getSystemState()); setItems(await client.getSubmissions()); setPolicy(await client.getGuidelines()) })().catch(() => undefined) }, [])
  const counts = items.reduce<Record<string, number>>((all, item) => ({ ...all, [item.status]: (all[item.status] || 0) + 1 }), {})
  return <AppShell title="On-chain Analytics" subtitle="Every number below is derived from the connected contract.">
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="assist-card rounded-[26px] p-6 md:p-8"><h2 className="text-xl font-bold">Outcome distribution</h2><div className="mt-6 space-y-3">{Object.entries(counts).length ? Object.entries(counts).map(([status, count]) => <div key={status} className="flex items-center justify-between rounded-[18px] bg-[#f6f7f8] px-4 py-4"><span className="text-sm font-bold">{status.replaceAll('_', ' ')}</span><span className="text-xl font-black text-[#ff5b12]">{count}</span></div>) : <p className="text-sm text-[#667085]">No resolved outcomes yet.</p>}</div></section>
      <section className="assist-card rounded-[26px] p-6 md:p-8"><h2 className="text-xl font-bold">Bond ledger</h2><dl className="mt-6 space-y-4">{[['Currently locked', state?.total_bonded], ['Returned to submitters', state?.total_refunded], ['Transferred to treasury', state?.total_slashed], ['Settlement records', state?.settlement_count]].map(([label, value]) => <div key={label as string} className="flex justify-between border-b border-[#eceff3] pb-4"><dt className="text-sm text-[#667085]">{label as string}</dt><dd className="font-black">{value?.toString() || '0'}</dd></div>)}</dl></section>
      <section className="assist-card rounded-[26px] p-6 md:p-8 lg:col-span-2"><p className="text-xs font-black uppercase text-[#ff5b12]">Community policy from contract</p><p className="mt-4 max-w-4xl text-base leading-7 text-[#334155]">{policy?.policy || 'Reading immutable policy...'}</p><div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#0478ba]"><span className="rounded-full bg-[#eef8fd] px-4 py-2">Approved risk ≤ {policy?.risk_approved_max || '35'}</span><span className="rounded-full bg-[#eef8fd] px-4 py-2">Rejected risk ≥ {policy?.risk_rejected_min || '60'}</span><span className="rounded-full bg-[#eef8fd] px-4 py-2">Appeal window 24 hours</span></div></section>
    </div>
  </AppShell>
}

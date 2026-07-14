'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient, type Submission } from '@/lib/genlayer-client'
export default function SettlePage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Submission | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { try { setItem(await getGenLayerClient().getSubmission(params.id)) } catch (e) { setMessage(e instanceof Error ? e.message : 'Read failed') } }
  useEffect(() => { load() }, [params.id])
  async function act(kind: 'claim' | 'slash' | 'accept') { setBusy(true); const client = getGenLayerClient(); const result = kind === 'claim' ? await client.claimBond(params.id) : kind === 'slash' ? await client.slashBond(params.id) : await client.acceptRejection(params.id); setMessage(result.success ? 'Transaction finalized.' : result.error || 'Transaction failed'); await load(); setBusy(false) }
  const refundable = item && ['APPROVED', 'FINAL_APPROVED', 'MANUAL_REVIEW'].includes(item.status)
  return <AppShell title={`Settle Bond #${params.id}`} subtitle="Funds move only after the moderation lifecycle permits settlement."><div className="mx-auto max-w-3xl assist-card rounded-[28px] p-7 md:p-10"><div className="grid gap-4 sm:grid-cols-3"><Box label="Verdict" value={item?.status || 'Reading'} /><Box label="Bond state" value={item?.bond_status || 'Reading'} /><Box label="Amount" value={`${item?.bond.toString() || '0'} wei`} /></div>{refundable && <button onClick={() => act('claim')} disabled={busy || item?.bond_status !== 'LOCKED'} className="assist-btn-primary mt-6 h-14 w-full rounded-full font-black disabled:opacity-50">Claim refundable bond</button>}{item?.status === 'REJECTED_APPEALABLE' && <button onClick={() => act('accept')} disabled={busy} className="mt-6 h-14 w-full rounded-full bg-[#fff1eb] font-black text-[#b43d08]">Accept rejection</button>}{item?.status === 'FINAL_REJECTED' && <button onClick={() => act('slash')} disabled={busy || item?.bond_status !== 'LOCKED'} className="mt-6 h-14 w-full rounded-full bg-[#101114] font-black text-white disabled:opacity-50">Transfer bond to treasury</button>}{message && <p className="mt-4 rounded-[18px] bg-[#eef8fd] p-4 text-sm font-bold">{message}</p>}<Link href={`/app/request/${params.id}`} className="mt-5 block text-center text-sm font-black text-[#ff5b12]">Return to request</Link></div></AppShell>
}
function Box({ label, value }: { label: string; value: string }) { return <div className="rounded-[20px] bg-[#f6f7f8] p-4"><p className="text-xs font-bold text-[#667085]">{label}</p><p className="mt-2 break-words font-black">{value.replaceAll('_', ' ')}</p></div> }

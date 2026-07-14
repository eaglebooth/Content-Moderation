'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient, type Submission } from '@/lib/genlayer-client'
export default function EvaluatePage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Submission | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { getGenLayerClient().getSubmission(params.id).then(setItem).catch((e) => setMessage(e.message)) }, [params.id])
  async function evaluate() { setBusy(true); setMessage('Waiting for validator consensus...'); const result = await getGenLayerClient().evaluateSubmission(params.id); setMessage(result.success ? 'Evaluation finalized on-chain.' : result.error || 'Evaluation failed'); setBusy(false) }
  return <AppShell title={`Evaluate #${params.id}`} subtitle="This transaction asks GenLayer validators to reach semantic consensus."><div className="mx-auto max-w-3xl assist-card rounded-[28px] p-7 md:p-10"><p className="text-xs font-black uppercase text-[#ff5b12]">Evidence snapshot</p><p className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-[20px] bg-[#f6f7f8] p-5 text-sm leading-6">{item?.content || 'Reading...'}</p><div className="mt-6 rounded-[20px] bg-[#eef8fd] p-5 text-sm leading-6 text-[#34566a]">The jury checks policy meaning and context. It does not require byte-identical free-form reasoning.</div><button onClick={evaluate} disabled={busy || item?.status !== 'PENDING'} className="assist-btn-primary mt-6 h-14 w-full rounded-full font-black disabled:opacity-50">{busy ? 'Consensus in progress...' : 'Run validator evaluation'}</button>{message && <p className="mt-4 text-center text-sm font-bold text-[#667085]">{message}</p>}<Link href={`/app/request/${params.id}`} className="mt-5 block text-center text-sm font-black text-[#ff5b12]">Return to request</Link></div></AppShell>
}

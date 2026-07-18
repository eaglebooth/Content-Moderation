'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { getGenLayerClient, type Submission } from '@/lib/genlayer-client'

export default function EvaluatePage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Submission | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const current = await getGenLayerClient().getSubmission(params.id)
      setItem(current)
      return current
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to read the submission')
      return null
    }
  }

  useEffect(() => { load() }, [params.id])

  async function evaluate() {
    if (item?.status !== 'PENDING') {
      setMessage(`Evaluation already completed with status ${item?.status || 'UNKNOWN'}.`)
      return
    }
    setBusy(true)
    setMessage('Waiting for validator consensus...')
    const result = await getGenLayerClient().evaluateSubmission(params.id)
    const current = await load()
    if (current && current.status !== 'PENDING') {
      setMessage(`Evaluation completed on-chain: ${current.status.replaceAll('_', ' ')}.`)
    } else {
      setMessage(result.pending ? result.error || 'Consensus is still processing. Sync before retrying.' : result.error || 'Evaluation failed')
    }
    setBusy(false)
  }

  const evaluated = item && item.status !== 'PENDING'
  const refundable = item && ['APPROVED', 'FINAL_APPROVED', 'MANUAL_REVIEW'].includes(item.status) && item.bond_status === 'LOCKED'

  return <AppShell title={`Evaluate #${params.id}`} subtitle="This transaction asks GenLayer validators to reach semantic consensus.">
    <div className="mx-auto max-w-3xl assist-card rounded-[28px] p-7 md:p-10">
      <p className="text-xs font-black uppercase text-[#ff5b12]">Evidence snapshot</p>
      <p className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-[20px] bg-[#f6f7f8] p-5 text-sm leading-6">{item?.content || 'Reading...'}</p>
      <div className="mt-6 rounded-[20px] bg-[#eef8fd] p-5 text-sm leading-6 text-[#34566a]">The jury checks policy meaning and context. It does not require byte-identical free-form reasoning.</div>
      {evaluated ? <div className="mt-6 rounded-[20px] border border-[#b8e6cf] bg-[#effbf5] p-5">
        <p className="font-black text-[#087443]">Evaluation complete: {item.status.replaceAll('_', ' ')}</p>
        <p className="mt-2 text-sm text-[#34566a]">Risk score {item.score.toString()}. This submission cannot be evaluated twice.</p>
        <Link href={refundable ? `/app/settle/${params.id}` : `/app/request/${params.id}`} className="assist-btn-primary mt-5 block rounded-full px-5 py-4 text-center font-black">
          {refundable ? 'Continue to settlement' : 'Continue to request'}
        </Link>
      </div> : <button onClick={evaluate} disabled={busy || !item} className="assist-btn-primary mt-6 h-14 w-full rounded-full font-black disabled:opacity-50">{busy ? 'Consensus in progress...' : 'Run validator evaluation'}</button>}
      {message && <p role="status" aria-live="polite" className="mt-4 text-center text-sm font-bold text-[#667085]">{message}</p>}
      <Link href={`/app/request/${params.id}`} className="mt-5 block text-center text-sm font-black text-[#ff5b12]">Return to request</Link>
    </div>
  </AppShell>
}

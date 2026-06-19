'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Stats } from '@/lib/genlayer-client'
import { AppShell } from '@/components/AppShell'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const client = getGenLayerClient()
      await client.initialize()
      const data = await client.getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const total = Number(stats?.total_submissions || 0n)
  const approved = Number(stats?.approved || 0n)
  const rejected = Number(stats?.rejected || 0n)
  const needsReview = Number(stats?.needs_review || 0n)
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  if (loading) {
    return (
      <AppShell title="Analytics" subtitle="Moderation statistics and insights.">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#ff5b12] border-t-transparent"></div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Analytics" subtitle="Moderation statistics and insights.">
      <div className="space-y-5">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Submissions" value={total.toString()} />
          <StatCard label="Approved" value={approved.toString()} />
          <StatCard label="Rejected" value={rejected.toString()} />
          <StatCard label="Needs Review" value={needsReview.toString()} />
        </div>

        {/* Approval Rate */}
        <div className="assist-card rounded-[26px] p-6 md:p-8">
          <h3 className="text-lg font-semibold text-[#111827] mb-6">Approval Rate</h3>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-4xl font-bold text-[#111827]">{approvalRate}%</p>
              <p className="text-sm text-[#64748B] mt-1">{approved} approved out of {total} total</p>
            </div>
          </div>
          <div className="relative h-4 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#ff5b12] transition-all duration-1000"
              style={{ width: `${approvalRate}%` }}
            ></div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="assist-card rounded-[26px] p-6 md:p-8">
          <h3 className="text-lg font-semibold text-[#111827] mb-6">Community Guidelines</h3>
          <div className="text-center py-12 text-[#64748B]">
            <p>Guidelines information will be displayed here.</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="assist-card rounded-[24px] p-5 transition duration-200 hover:-translate-y-0.5">
      <p className="mb-2 text-sm font-semibold text-[#667085]">{label}</p>
      <p className="text-3xl font-extrabold tracking-normal text-[#101114]">{value}</p>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { getGenLayerClient, Stats } from '@/lib/genlayer-client'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'

export default function AppDashboard() {
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
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

  return (
    <AppShell title="Overview" subtitle="Your moderation network is operating normally.">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#ff5b12] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Requests" value={total.toString()} />
            <StatCard label="Approved Rate" value={`${approvalRate}%`} />
            <StatCard label="Average Consensus" value="94%" />
            <StatCard label="Pending Review" value={Number(stats?.needs_review || 0n).toString()} />
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
            {/* Left: Activity */}
            <div className="assist-card rounded-[24px] p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-6">Recent Moderation Requests</h3>
              <div className="assist-card-muted rounded-[22px] py-14 text-center text-[#667085]">
                <p>No recent requests to display</p>
                <Link href="/app/submit" className="mt-3 inline-flex items-center rounded-full bg-[#101114] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#ff5b12]">
                  Submit your first request →
                </Link>
              </div>
            </div>

            {/* Right: Network Status */}
            <div className="space-y-6">
              <div className="assist-card rounded-[24px] p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Network Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Status</span>
                    <span className="flex items-center gap-2 text-sm font-medium text-[#16A34A]">
                      <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                      Operational
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Validators</span>
                    <span className="text-sm font-medium text-[#111827]">5/5 Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">Avg Response</span>
                    <span className="text-sm font-medium text-[#111827]">~2.3s</span>
                  </div>
                </div>
              </div>

              <div className="assist-card rounded-[24px] p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/app/submit" className="assist-btn-primary block w-full rounded-full px-4 py-3 text-center font-bold transition-all duration-200">
                    Submit Content
                  </Link>
                  <Link href="/app/review" className="assist-btn-secondary block w-full rounded-full px-4 py-3 text-center font-semibold transition-all duration-200">
                    Review Queue
                  </Link>
                  <Link href="/app/analytics" className="assist-btn-secondary block w-full rounded-full px-4 py-3 text-center font-semibold transition-all duration-200">
                    View Analytics
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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

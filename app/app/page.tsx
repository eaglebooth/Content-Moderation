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
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#0787D6] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Requests" value={total.toString()} />
            <StatCard label="Approved Rate" value={`${approvalRate}%`} />
            <StatCard label="Average Consensus" value="94%" />
            <StatCard label="Pending Review" value={Number(stats?.needs_review || 0n).toString()} />
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
            {/* Left: Activity */}
            <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-6">Recent Moderation Requests</h3>
              <div className="text-center py-12 text-[#64748B]">
                <p>No recent requests to display</p>
                <Link href="/app/submit" className="text-[#0787D6] font-medium hover:underline mt-2 inline-block">
                  Submit your first request →
                </Link>
              </div>
            </div>

            {/* Right: Network Status */}
            <div className="space-y-6">
              <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
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

              <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/app/submit" className="block w-full text-center px-4 py-3 bg-[#0787D6] hover:bg-[#006DB4] text-white rounded-xl font-medium transition-all duration-200">
                    Submit Content
                  </Link>
                  <Link href="/app/review" className="block w-full text-center px-4 py-3 bg-white hover:bg-[#F8FAFC] text-[#111827] border border-[#E7EEF3] rounded-xl font-medium transition-all duration-200">
                    Review Queue
                  </Link>
                  <Link href="/app/analytics" className="block w-full text-center px-4 py-3 bg-white hover:bg-[#F8FAFC] text-[#111827] border border-[#E7EEF3] rounded-xl font-medium transition-all duration-200">
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
    <div className="bg-white rounded-[18px] border border-[#E7EEF3] p-6">
      <p className="text-sm text-[#64748B] mb-2">{label}</p>
      <p className="text-3xl font-bold text-[#111827]">{value}</p>
    </div>
  )
}

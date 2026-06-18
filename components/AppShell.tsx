'use client'

import React from 'react'
import { AppSidebar } from './AppSidebar'

interface AppShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F5FAFC]">
      <AppSidebar />
      <div className="md:pl-64">
        <header className="sticky top-0 z-40 bg-[#F5FAFC]/90 backdrop-blur-xl border-b border-[#E7EEF3]">
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-[#64748B] mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E7EEF3]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                <span className="text-sm text-[#64748B]">Network active</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#E8F4FC] flex items-center justify-center text-[#0787D6] font-semibold">
                E
              </div>
            </div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}

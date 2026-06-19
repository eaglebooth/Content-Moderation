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
    <div className="assist-bg relative min-h-screen overflow-hidden">
      <div className="assist-noise" />
      <AppSidebar />
      <div className="relative z-10 mx-auto max-w-[1180px] px-4 pb-10 pt-12 md:px-8 md:pt-20">
        <section className="mb-10 text-center text-white">
          <p className="mb-4 text-sm font-semibold text-white/85">AI-powered content moderation</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">{title}</h1>
          {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-white/86">{subtitle}</p>}
        </section>

        <div className="assist-shell rounded-[32px] p-3 md:rounded-[40px] md:p-4">
          <header className="mb-4 rounded-[24px] bg-white px-4 py-4 md:px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff5b12] text-xs font-black text-white">AI</span>
                <h2 className="text-xl font-bold tracking-normal text-[#101114]">{title}</h2>
              </div>
              {subtitle && <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 items-center gap-2 rounded-full bg-[#f6f7f8] px-4">
                <span className="h-2 w-2 rounded-full bg-[#16A34A]"></span>
                <span className="text-sm font-semibold text-[#596273]">Network active</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101114] font-bold text-white">
                E
              </div>
            </div>
          </div>
        </header>
          <main className="px-1 pb-1 md:px-2">{children}</main>
        </div>
      </div>
    </div>
  )
}

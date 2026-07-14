'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/app',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Submit Content',
    href: '/app/submit',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: 'Review Queue',
    href: '/app/review',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/app/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        className={`flex h-10 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-[#101114] text-white shadow-sm'
            : 'text-[#596273] hover:bg-white hover:text-[#101114]'
        }`}
      >
        <span className="hidden sm:block">{item.icon}</span>
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="relative z-30 mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 pt-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex h-10 items-center gap-2 rounded-full bg-white px-2.5 pr-5 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff5b12] text-[11px] font-black text-white">
            AI
          </span>
          <span className="whitespace-nowrap text-sm font-semibold text-[#101114]">AI-powered Content Moderation</span>
        </Link>

        <Link
          href="/app/submit"
          className="assist-btn-primary flex h-10 items-center rounded-full px-6 text-sm font-bold transition-all duration-200"
        >
          <span>New Moderation</span>
        </Link>
      </div>

      <div className="rounded-[28px] bg-white/88 p-2 shadow-sm backdrop-blur-xl">
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  )
}

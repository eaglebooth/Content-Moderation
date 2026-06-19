import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | AI-powered Content Moderation',
  description: 'AI-powered content moderation dashboard',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

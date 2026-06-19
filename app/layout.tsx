import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Content Moderation | GenLayer',
  description: 'AI-powered content moderation system built on GenLayer. Transparent decisions with multi-validator consensus.',
  keywords: ['GenLayer', 'AI', 'Content Moderation', 'Blockchain', 'Smart Contracts'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  )
}

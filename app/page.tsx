'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F5FAFC]/80 backdrop-blur-xl border-b border-[#E7EEF3]">
        <div className="max-w-[1180px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0787D6] to-[#006DB4] flex items-center justify-center">
              <span className="text-white font-bold text-xs">GM</span>
            </div>
            <span className="font-semibold text-[#111827] text-lg">GenLayer Moderation</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors">How it Works</a>
            <a href="#features" className="text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors">Features</a>
            <a href="#trust" className="text-sm font-medium text-[#64748B] hover:text-[#111827] transition-colors">Trust</a>
          </nav>

          <Link
            href="/app"
            className="px-5 py-2.5 bg-[#0787D6] hover:bg-[#006DB4] text-white rounded-xl text-sm font-medium transition-all duration-200"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 px-8">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E7EEF3] mb-8">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                <span className="text-sm font-medium text-[#64748B]">Built on GenLayer</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-[#111827] leading-tight mb-6 tracking-tight">
                Transparent AI Moderation, Verified On-Chain
              </h1>

              <p className="text-lg text-[#64748B] leading-relaxed max-w-xl mb-10">
                Submit content for AI-powered moderation. A decentralized validator network reviews each decision and keeps the reasoning visible on-chain.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/app/submit"
                  className="px-7 py-3.5 bg-[#0787D6] hover:bg-[#006DB4] text-white rounded-xl font-medium transition-all duration-200 inline-flex items-center gap-2"
                >
                  Open Moderation App
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="px-7 py-3.5 bg-white hover:bg-[#F8FAFC] text-[#111827] border border-[#E7EEF3] rounded-xl font-medium transition-all duration-200"
                >
                  See How it Works
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-[#E8F4FC] to-[#F5FAFC] rounded-[32px]"></div>
              <div className="relative bg-white rounded-[22px] border border-[#E7EEF3] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-sm text-[#64748B] mb-1">Moderation Score</div>
                    <div className="text-4xl font-bold text-[#111827]">87<span className="text-xl text-[#64748B] font-normal">/100</span></div>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-[#DCFCE7] text-[#16A34A] text-sm font-semibold">APPROVED</span>
                </div>

                <div className="space-y-5 mb-8">
                  {[
                    { label: 'Hate Speech', value: 12, color: '#16A34A' },
                    { label: 'Misinformation', value: 8, color: '#16A34A' },
                    { label: 'Harassment', value: 23, color: '#FF6A18' },
                    { label: 'Unsafe Content', value: 5, color: '#16A34A' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#64748B]">{item.label}</span>
                        <span className="font-medium text-[#111827]">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E7EEF3]">
                  <div className="text-xs text-[#64748B] mb-2 uppercase tracking-wider font-medium">Validator Consensus</div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#F8FAFC] flex items-center justify-center text-xs font-medium text-[#0787D6]">
                          V{i}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#111827]">5/5 Agreement</div>
                      <div className="text-xs text-[#64748B]">Confidence: 94%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section id="trust" className="py-16 px-8 bg-white border-y border-[#E7EEF3]">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'AI-Powered Evaluation', desc: 'Advanced AI evaluates content against community guidelines with detailed reasoning.' },
              { title: 'Multi-Validator Consensus', desc: 'Decentralized network of validators ensures unbiased, fair decisions.' },
              { title: 'On-Chain Verification', desc: 'All decisions recorded on GenLayer blockchain for full transparency.' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-8">
        <div className="max-w-[1180px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#111827] mb-4 tracking-tight">How it Works</h2>
            <p className="text-lg text-[#64748B] max-w-2xl mx-auto">Four steps to transparent, verifiable content moderation.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Submit Content', desc: 'Upload text or image URLs for moderation evaluation.' },
              { step: '02', title: 'AI Analyzes Risk', desc: 'AI evaluates content across multiple risk categories.' },
              { step: '03', title: 'Validators Reach Consensus', desc: 'Decentralized validators review and vote on the decision.' },
              { step: '04', title: 'Result Recorded On-Chain', desc: 'Final decision and reasoning are permanently recorded.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-[#E8F4FC] mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8 bg-white border-y border-[#E7EEF3]">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#111827] mb-6 tracking-tight">Built for transparency and trust</h2>
              <p className="text-lg text-[#64748B] leading-relaxed mb-10">
                Every moderation decision is backed by AI analysis and validator consensus, with full reasoning recorded on-chain.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Detailed AI Reasoning', desc: 'Every decision includes a clear explanation of why content was flagged or approved.' },
                  { title: 'Category Risk Scores', desc: 'See risk breakdown across hate speech, misinformation, harassment, and more.' },
                  { title: 'Validator Transparency', desc: 'View individual validator votes and consensus confidence scores.' },
                  { title: 'Appeal Process', desc: 'Submit appeals for reconsideration with full audit trail.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#E8F4FC] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-[#0787D6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#111827] mb-1">{item.title}</h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-[#F8FAFC] rounded-[22px] border border-[#E7EEF3] p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm font-medium text-[#64748B]">Recent Moderation</div>
                  <span className="text-xs text-[#64748B]">Last 24 hours</span>
                </div>
                <div className="space-y-4">
                  {[
                    { id: '1024', status: 'APPROVED', score: 12, time: '2 min ago' },
                    { id: '1023', status: 'FLAGGED', score: 45, time: '8 min ago' },
                    { id: '1022', status: 'REJECTED', score: 78, time: '15 min ago' },
                    { id: '1021', status: 'APPROVED', score: 23, time: '22 min ago' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E7EEF3]">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-[#64748B]">#{item.id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.status === 'APPROVED' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                          item.status === 'FLAGGED' ? 'bg-[#FEF3C7] text-[#D97706]' :
                          'bg-[#FEE2E2] text-[#EF4444]'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-[#111827]">Score: {item.score}</span>
                        <span className="text-xs text-[#64748B]">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
        <div className="max-w-[1180px] mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#111827] mb-4 tracking-tight">Make moderation transparent and verifiable.</h2>
          <p className="text-lg text-[#64748B] mb-10 max-w-2xl mx-auto">
            Join the future of content moderation with AI and blockchain technology.
          </p>
          <Link
            href="/app/submit"
            className="px-8 py-4 bg-[#0787D6] hover:bg-[#006DB4] text-white rounded-xl font-medium transition-all duration-200 inline-flex items-center gap-2"
          >
            Launch Moderation App
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-white border-t border-[#E7EEF3]">
        <div className="max-w-[1180px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0787D6] to-[#006DB4] flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">GM</span>
            </div>
            <span className="font-semibold text-[#111827]">GenLayer Moderation</span>
          </div>
          <p className="text-sm text-[#64748B]">
            Built with GenLayer Intelligent Contracts
          </p>
          <p className="text-xs text-[#64748B] mt-2 opacity-60">
            © 2025 AI Content Moderation Project
          </p>
        </div>
      </footer>
    </div>
  )
}

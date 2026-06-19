'use client'

import Link from 'next/link'

const metrics = [
  { label: 'Requests', value: '1.2k' },
  { label: 'Consensus', value: '94%' },
  { label: 'Validators', value: '5/5' },
]

const categories = [
  { label: 'Hate Speech', value: 12, color: '#16A34A' },
  { label: 'Misinformation', value: 8, color: '#16A34A' },
  { label: 'Harassment', value: 23, color: '#ff5b12' },
  { label: 'Unsafe Content', value: 5, color: '#16A34A' },
]

const steps = [
  { title: 'Submit', desc: 'Send text or image URLs into the moderation flow.' },
  { title: 'Analyze', desc: 'AI scores risk categories and writes a clear reason.' },
  { title: 'Validate', desc: 'A GenLayer validator group reaches transparent consensus.' },
  { title: 'Record', desc: 'The final decision is available for review and appeals.' },
]

export default function LandingPage() {
  return (
    <main className="assist-bg relative min-h-screen overflow-hidden">
      <div className="assist-noise" />

      <header className="relative z-20 mx-auto flex max-w-[1180px] items-center justify-between px-4 py-6 md:px-8">
        <Link href="/" className="flex h-10 items-center gap-2 rounded-full bg-white px-2.5 pr-5 shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff5b12] text-[11px] font-black text-white">
            AI
          </span>
          <span className="whitespace-nowrap text-sm font-semibold text-[#101114]">AI-powered Content Moderation</span>
        </Link>

        <nav className="hidden rounded-full bg-white/90 p-1 shadow-sm backdrop-blur-xl md:flex">
          {[
            ['How it Works', '#how-it-works'],
            ['Features', '#features'],
            ['Trust', '#trust'],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-full px-5 py-2 text-sm font-semibold text-[#596273] transition hover:bg-[#f6f7f8] hover:text-[#101114]">
              {label}
            </a>
          ))}
        </nav>

        <Link href="/app" className="assist-btn-primary flex h-10 items-center gap-2 rounded-full px-2.5 pl-5 text-sm font-bold transition-all duration-200">
          <span>Open App</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#101114]">+</span>
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-[1180px] px-4 pb-10 pt-16 text-center md:px-8 md:pt-24">
        <p className="mb-5 text-sm font-bold text-white/85">Built on GenLayer intelligent contracts</p>
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-normal text-white md:text-7xl">
          Transparent AI Moderation Verified On-Chain
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-7 text-white/88 md:text-lg">
          Submit content, review AI reasoning, track validator consensus, and appeal decisions from a cleaner moderation workspace.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/app/submit" className="assist-btn-primary flex h-12 items-center gap-2 rounded-full px-2.5 pl-6 text-sm font-bold transition-all duration-200">
            <span>Start Moderation</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#101114]">+</span>
          </Link>
          <a href="#how-it-works" className="flex h-12 items-center rounded-full bg-white px-6 text-sm font-bold text-[#101114] transition hover:-translate-y-0.5">
            Explore Flow
          </a>
        </div>

        <div className="assist-shell mx-auto mt-16 max-w-5xl rounded-[34px] p-3 text-left md:rounded-[44px] md:p-4">
          <div className="rounded-[28px] bg-white p-4 md:p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5b12] text-xs font-black text-white">AI</span>
                <span className="text-lg font-bold text-[#101114]">Moderation Console</span>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {['Dashboard', 'Review', 'Analytics'].map((item, index) => (
                  <span key={item} className={`rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? 'bg-[#101114] text-white' : 'bg-[#f6f7f8] text-[#667085]'}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
              <div className="assist-card-muted rounded-[24px] p-5">
                <div className="mb-5 grid grid-cols-3 gap-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-[20px] bg-white p-4">
                      <p className="text-xs font-semibold text-[#667085]">{metric.label}</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#101114]">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[22px] bg-white p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#667085]">Moderation Score</p>
                      <p className="mt-1 text-4xl font-extrabold text-[#101114]">87<span className="text-lg font-semibold text-[#667085]">/100</span></p>
                    </div>
                    <span className="rounded-full bg-[#DCFCE7] px-4 py-2 text-xs font-bold text-[#16A34A]">APPROVED</span>
                  </div>

                  <div className="space-y-4">
                    {categories.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-semibold text-[#667085]">{item.label}</span>
                          <span className="font-bold text-[#101114]">{item.value}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#eef1f4]">
                          <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="assist-card-muted rounded-[24px] p-5">
                <h2 className="text-lg font-bold text-[#101114]">Validator Consensus</h2>
                <p className="mt-2 text-sm leading-6 text-[#667085]">Five validators agree on the decision, with reasoning preserved for review and appeals.</p>
                <div className="mt-6 flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#f6f7f8] bg-white text-xs font-black text-[#101114]">
                      V{i}
                    </div>
                  ))}
                </div>
                <Link href="/app/review" className="mt-8 inline-flex rounded-full bg-[#101114] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff5b12]">
                  Open Review Queue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="relative z-10 bg-white px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-4 md:grid-cols-3">
          {[
            ['AI Reasoning', 'Every decision includes a clear explanation and category scores.'],
            ['Validator Review', 'Consensus keeps moderation decisions visible and auditable.'],
            ['Appeals Ready', 'Users can challenge resolved submissions from the same workflow.'],
          ].map(([title, desc]) => (
            <div key={title} className="assist-card rounded-[24px] p-6">
              <h3 className="text-lg font-bold text-[#101114]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#667085]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-extrabold tracking-normal text-white">How it Works</h2>
            <p className="mt-3 font-semibold text-white/82">The same product flow, presented with a calmer visual hierarchy.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-[24px] bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5b12] text-sm font-black text-white">{index + 1}</span>
                <h3 className="mt-5 text-lg font-bold text-[#101114]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 bg-white px-4 py-16 text-center md:px-8">
        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-normal text-[#101114]">A sharper interface for moderation work.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#667085]">
          The dashboard, submit form, review queue, analytics, and request detail pages now share the same card system, pill navigation, and CTA language.
        </p>
        <Link href="/app" className="assist-btn-primary mt-8 inline-flex rounded-full px-8 py-4 text-sm font-bold transition-all duration-200">
          Launch Dashboard
        </Link>
      </section>
    </main>
  )
}

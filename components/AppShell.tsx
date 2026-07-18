'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppSidebar } from './AppSidebar'
import { getContractConfig, getGenLayerClient, restoreDefaultContractAddress, setActiveContractAddress } from '@/lib/genlayer-client'

interface AppShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname()
  const [config, setConfig] = useState(() => getContractConfig())
  const [addressInput, setAddressInput] = useState(config.address)
  const [wallet, setWallet] = useState('')
  const [walletStatus, setWalletStatus] = useState(config.address ? 'Contract configured' : 'Missing contract address')

  useEffect(() => {
    try {
      const current = getContractConfig()
      setConfig(current)
      setAddressInput(current.address)
      const client = getGenLayerClient()
      client.initialize().then(() => {
        const account = client.getConnectedAccount()
        if (account) {
          setWallet(account)
          setWalletStatus('Wallet connected')
        }
      }).catch(() => {
        setWalletStatus(config.address ? 'Connect wallet to write' : 'Missing contract address')
      })
    } catch (error) {
      setWalletStatus(error instanceof Error ? error.message : 'Contract not configured')
    }
  }, [])

  async function handleConnectWallet() {
    try {
      const client = getGenLayerClient()
      await client.initialize()
      const connected = await client.connectWallet()
      if (!connected) {
        setWalletStatus('Wallet connection cancelled')
        return
      }
      setWallet(client.getConnectedAccount() || '')
      setWalletStatus('Wallet connected')
    } catch (error) {
      setWalletStatus(error instanceof Error ? error.message : 'Wallet connection failed')
    }
  }

  async function handleSyncContract() {
    try {
      setWalletStatus('Reading contract state...')
      const state = await getGenLayerClient().getSystemState()
      setWalletStatus(`Synced: ${state.submission_count.toString()} submissions`)
    } catch (error) {
      setWalletStatus(error instanceof Error ? error.message : 'Contract sync failed')
    }
  }

  async function handleUseContract() {
    try {
      const address = setActiveContractAddress(addressInput)
      setConfig(getContractConfig())
      setWalletStatus('Reading selected contract...')
      const state = await getGenLayerClient().getSystemState()
      setWalletStatus(`Verified ${address.slice(0, 6)}...${address.slice(-4)}: ${state.submission_count.toString()} submissions`)
    } catch (error) {
      setWalletStatus(error instanceof Error ? error.message : 'Contract verification failed')
    }
  }

  function handleRestoreContract() {
    const address = restoreDefaultContractAddress()
    setAddressInput(address)
    setConfig(getContractConfig())
    setWalletStatus('Production contract restored. Sync to verify it.')
  }

  const shortAddress = (value: string) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : 'Not set'

  return (
    <div className="assist-bg relative min-h-screen overflow-hidden">
      <div className="assist-noise" />
      <AppSidebar />
      <div className="relative z-10 mx-auto max-w-[1180px] px-4 pb-10 pt-6 md:px-8 md:pt-8">
        <section className="mb-7 text-center text-white">
          {pathname !== '/app' && (
            <Link href="/app" aria-label="Back to overview" className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#101114] shadow-sm transition hover:-translate-y-0.5 hover:text-[#ff5b12]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
          )}
          <p className="mb-3 text-sm font-semibold text-white/85">AI-powered content moderation</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">{title}</h1>
          {subtitle && <p className="mx-auto mt-3 max-w-2xl text-base font-semibold text-white/86">{subtitle}</p>}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="rounded-[18px] bg-[#f6f7f8] px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${config.address ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'}`}></span>
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-[#667085]">{config.network}</span>
                </div>
                <p className="mt-0.5 text-sm font-bold text-[#101114]">Contract {shortAddress(config.address)}</p>
              </div>
              <button
                type="button"
                onClick={handleSyncContract}
                className="flex h-12 items-center justify-center rounded-full border border-[#e7eaee] bg-white px-5 text-sm font-bold text-[#101114] transition hover:border-[#20a7ee]"
              >
                Sync contract
              </button>
              <button
                type="button"
                onClick={handleConnectWallet}
                className="flex h-12 items-center justify-center rounded-full bg-[#101114] px-5 text-sm font-bold text-white transition hover:bg-[#ff5b12]"
              >
                {wallet ? shortAddress(wallet) : 'Connect wallet'}
              </button>
              <div className="hidden max-w-[180px] text-xs font-semibold text-[#667085] lg:block">
                {walletStatus}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 border-t border-[#eceff3] pt-4 md:grid-cols-[1fr_auto_auto]">
            <label className="sr-only" htmlFor="contract-address">Contract address</label>
            <input
              id="contract-address"
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              spellCheck={false}
              className="h-11 min-w-0 rounded-full border border-[#e7eaee] bg-[#f6f7f8] px-4 font-mono text-xs text-[#101114] outline-none transition focus:border-[#20a7ee]"
              placeholder="0x... GenLayer contract address"
            />
            <button type="button" onClick={handleUseContract} className="h-11 rounded-full bg-[#0478ba] px-5 text-sm font-bold text-white transition hover:bg-[#101114]">Use &amp; verify</button>
            <button type="button" onClick={handleRestoreContract} className="h-11 rounded-full border border-[#e7eaee] bg-white px-5 text-sm font-bold text-[#101114] transition hover:border-[#ff5b12]">Restore default</button>
          </div>
        </header>
          <main className="px-1 pb-1 md:px-2">{children}</main>
        </div>
      </div>
    </div>
  )
}

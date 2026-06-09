'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { Search, Loader2, Car, FileText, Sun, Moon, MessageCircle, ArrowLeft } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function InvoiceLookupPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    // Auto-fill from URL param ?job=JC-xxxx
    const jobParam = new URLSearchParams(window.location.search).get('job')
    if (jobParam) setQuery(jobParam)
  }, [])

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError('')

    try {
      const sb = createClient()
      const isJobNumber = q.toUpperCase().startsWith('JC-')

      if (isJobNumber) {
        const { data, error: err } = await sb
          .from('job_cards')
          .select('id')
          .ilike('job_number', q)
          .limit(1)
          .single()

        if (err || !data) {
          setError('No invoice found for that job number. Please check and try again.')
          return
        }
        router.push(`/invoice/${data.id}`)
      } else {
        // Search by phone number
        const { data: customers } = await sb
          .from('customers')
          .select('id')
          .ilike('phone', `%${q.replace(/\s+/g, '')}%`)
          .limit(5)

        if (!customers || customers.length === 0) {
          setError('No records found for that phone number.')
          return
        }

        const ids = customers.map((c: { id: string }) => c.id)
        const { data: job, error: jobErr } = await sb
          .from('job_cards')
          .select('id')
          .in('customer_id', ids)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (jobErr || !job) {
          setError('No invoice found for that phone number.')
          return
        }
        router.push(`/invoice/${job.id}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-white/[0.06] dark:bg-surface-900/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7F0A] shadow-[0_0_16px_rgba(255,127,10,0.35)] group-hover:shadow-[0_0_24px_rgba(255,127,10,0.5)] transition-all duration-300">
              <Car className="h-[18px] w-[18px] text-black" />
            </div>
            <div className="leading-none">
              <p className="font-display text-lg tracking-[0.2em] text-gray-900 leading-none dark:text-white">BAKKAH</p>
              <p className="text-[9px] tracking-[0.15em] text-gray-400 dark:text-white/30">AUTO DETAILING</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="website" />
            <button
              onClick={toggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.06]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a
              href="https://wa.me/971589397610"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366]/15 border border-[#25D366]/25 px-3 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
            <Link href="/auth/login" className="hidden text-xs text-gray-400 hover:text-gray-600 transition dark:text-white/30 dark:hover:text-white/60 sm:block">
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">

        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-200 dark:border-brand/20 bg-gradient-to-br from-orange-100 dark:from-brand/15 to-orange-50 dark:to-brand/5 shadow-[0_0_30px_rgba(255,127,10,0.1)]">
            <FileText className="h-8 w-8 text-[#FF7F0A]" />
          </div>
          <h1 className="font-display text-3xl tracking-wide text-gray-900 dark:text-white">View Your Invoice</h1>
          <p className="mt-2 text-gray-500 dark:text-white/50">Enter your job number or phone number to access your invoice</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="card mb-6">
          <label className="label mb-1 text-gray-700 dark:text-white/70 text-sm font-medium">Job Number or Phone Number</label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. JC-2026-0001 or +971 50 000 0000"
                className="input-base w-full pl-9"
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary px-5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-white/30">
            Enter your <span className="font-mono font-bold text-[#FF7F0A]">JC-</span> job number or the phone number used when booking.
          </p>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
          <div className="card space-y-2">
            <div className="flex items-center gap-2 text-[#FF7F0A]">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">What&apos;s in your invoice?</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-500 dark:text-white/50">
              <li>✓ Full list of services performed</li>
              <li>✓ Parts used with pricing</li>
              <li>✓ Before &amp; after photos</li>
              <li>✓ VAT breakdown (5% UAE)</li>
              <li>✓ Payment status</li>
            </ul>
          </div>
          <div className="card space-y-2">
            <div className="flex items-center gap-2 text-[#FF7F0A]">
              <Car className="h-4 w-4" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Want to track your vehicle?</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Use the Job Tracker to see real-time updates on your vehicle&apos;s service progress.
            </p>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7F0A] hover:text-orange-600 transition-colors"
            >
              Track your vehicle →
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>

        {/* Footer note */}
        <div className="mt-10 text-center text-xs text-gray-400 dark:text-white/20 space-y-1">
          <p>Al Qusais Industrial Area, Dubai, UAE</p>
          <a
            href="https://wa.me/971589397610"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#25D366] hover:text-emerald-600 transition font-medium"
          >
            <MessageCircle className="h-3 w-3" /> +971 58 939 7610
          </a>
        </div>
      </main>
    </div>
  )
}

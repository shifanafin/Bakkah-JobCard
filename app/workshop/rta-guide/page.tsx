'use client'

import Link from 'next/link'
import Header from '@/components/layout/Header'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2, ExternalLink, Copy, Check, Info } from 'lucide-react'
import { useState } from 'react'

function CopyBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.03] px-3 py-2 font-mono text-sm text-gray-700 dark:text-white/70">
      <span className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none">{value}</span>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="shrink-0 text-gray-400 hover:text-brand dark:text-white/30 dark:hover:text-brand transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-black font-black text-sm mt-0.5">{n}</div>
      <div className="flex-1">
        <p className="font-bold text-gray-900 dark:text-white mb-2">{title}</p>
        <div className="text-sm text-gray-600 dark:text-white/60 space-y-2">{children}</div>
      </div>
    </div>
  )
}

export default function RTAGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="UAE RTA API Guide" subtitle="How to connect to government vehicle data APIs" />

      <div className="mx-auto max-w-3xl p-4 space-y-6 lg:p-6">

        {/* Overview */}
        <div className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <Shield className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Overview</h2>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Three official UAE government data sources</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed mb-4">
            Bakkah can connect to three UAE government APIs to automatically check vehicle fines, Salik toll balance,
            registration (Mulkiya) status, insurance validity, and RTA inspection results — all from within a job card.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'MOI Smart Services', scope: 'Federal traffic fines (all emirates)', color: 'bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20', dot: 'bg-red-400' },
              { name: 'Dubai Police API', scope: 'Dubai traffic fines + violations', color: 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20', dot: 'bg-blue-400' },
              { name: 'RTA Smart Integration', scope: 'Mulkiya · Insurance · Inspection · Salik', color: 'bg-brand-50 border-brand-100 dark:bg-brand/10 dark:border-brand/20', dot: 'bg-brand' },
            ].map(s => (
              <div key={s.name} className={`rounded-xl border p-3 ${s.color}`}>
                <div className={`h-2 w-2 rounded-full ${s.dot} mb-2`} />
                <p className="text-xs font-bold text-gray-900 dark:text-white">{s.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5 leading-snug">{s.scope}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 p-3">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              All three APIs are optional. You can configure none, one, or all three. Without API access the system falls back
              to manual data entry on each job card.
            </p>
          </div>
        </div>

        {/* MOI */}
        <div className="card">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/[0.06] pb-4 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">1. MOI Smart Services — Federal Traffic Fines</h2>
              <p className="text-[11px] text-gray-400 dark:text-white/40">Ministry of Interior · covers all emirates</p>
            </div>
            <a href="https://smartservices.moi.gov.ae/developer" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand hover:underline">
              Developer Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="space-y-5">
            <Step n={1} title="Create a developer account">
              <p>Visit <a href="https://smartservices.moi.gov.ae/developer" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">smartservices.moi.gov.ae/developer</a> and register with your UAE Pass or Emirates ID.</p>
            </Step>
            <Step n={2} title="Apply for the Traffic Violations API">
              <p>Navigate to <strong>API Catalogue → Traffic Services → Traffic Violations Enquiry</strong> and click <strong>Subscribe</strong>.</p>
              <p>Fill in your organisation name, TRN, and intended use case (vehicle service workshop — pre-inspection checks).</p>
            </Step>
            <Step n={3} title="Receive your API key">
              <p>After approval (typically 5–10 business days), you will receive an <code className="bg-gray-100 dark:bg-white/10 px-1 rounded font-mono text-xs">x-api-key</code> and base URL by email.</p>
            </Step>
            <Step n={4} title="Add to your environment">
              <CopyBox value="RTA_MOI_API_KEY=your-moi-api-key-here" />
              <CopyBox value="RTA_MOI_BASE_URL=https://api.smartservices.moi.gov.ae" />
            </Step>
          </div>
        </div>

        {/* Dubai Police */}
        <div className="card">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/[0.06] pb-4 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">2. Dubai Police API — Dubai Traffic Fines</h2>
              <p className="text-[11px] text-gray-400 dark:text-white/40">Dubai Police Smart Services · OAuth2 client credentials</p>
            </div>
            <a href="https://smart.dubaipolice.gov.ae/developer" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand hover:underline">
              Developer Portal <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="space-y-5">
            <Step n={1} title="Register on Dubai Police Smart Hub">
              <p>Visit <a href="https://smart.dubaipolice.gov.ae/developer" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">smart.dubaipolice.gov.ae/developer</a> and sign in with your UAE Pass.</p>
            </Step>
            <Step n={2} title="Create an application">
              <p>Go to <strong>My Apps → New Application</strong>. Enter your workshop name, website, and description. Select <strong>Traffic Fines Enquiry</strong> as the required API scope.</p>
            </Step>
            <Step n={3} title="Get OAuth2 credentials">
              <p>Once approved you receive a <strong>Client ID</strong> and <strong>Client Secret</strong>. The system automatically refreshes the access token every hour — you only need to provide these credentials once.</p>
            </Step>
            <Step n={4} title="Add to your environment">
              <CopyBox value="RTA_DP_CLIENT_ID=your-dubai-police-client-id" />
              <CopyBox value="RTA_DP_CLIENT_SECRET=your-dubai-police-client-secret" />
              <CopyBox value="RTA_DP_BASE_URL=https://api.dubaipolice.gov.ae" />
            </Step>
          </div>
        </div>

        {/* RTA */}
        <div className="card">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/[0.06] pb-4 mb-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <CheckCircle2 className="h-4 w-4 text-brand" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">3. RTA Smart Integration Platform — Registration, Insurance, Inspection & Salik</h2>
              <p className="text-[11px] text-gray-400 dark:text-white/40">Roads & Transport Authority · vehicle enquiry API</p>
            </div>
            <a href="https://gateway.rta.ae/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand hover:underline">
              RTA Gateway <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="space-y-5">
            <Step n={1} title="Contact the RTA Integration team">
              <p>Send an email to <a href="mailto:integration@rta.ae" className="text-brand hover:underline">integration@rta.ae</a> with the following details:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-white/50">
                <li>Company name and TRN</li>
                <li>Contact person name and number</li>
                <li>Use case: <em>pre-service vehicle inspection check for UAE auto workshop</em></li>
                <li>APIs needed: Vehicle Registration Enquiry, Insurance Status, Inspection Result, Salik Balance</li>
              </ul>
            </Step>
            <Step n={2} title="Complete the RTA API Agreement">
              <p>RTA will send you a <strong>Smart Integration API Agreement</strong> to sign. This covers data usage, privacy, and rate limits.</p>
              <p>Approval typically takes 10–15 business days after signing the agreement.</p>
            </Step>
            <Step n={3} title="Receive your credentials">
              <p>You will receive an API key and the sandbox/production base URL for the RTA Smart Integration Gateway.</p>
            </Step>
            <Step n={4} title="Add to your environment">
              <CopyBox value="RTA_API_KEY=your-rta-api-key-here" />
              <CopyBox value="RTA_BASE_URL=https://gateway.rta.ae" />
            </Step>
          </div>
        </div>

        {/* env.local summary */}
        <div className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <CheckCircle2 className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Complete .env.local template</h2>
              <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Add all credentials to your local environment file</p>
            </div>
          </div>
          <div className="space-y-2">
            <CopyBox value="# MOI Smart Services (federal fines)" />
            <CopyBox value="RTA_MOI_API_KEY=your-moi-api-key-here" />
            <CopyBox value="RTA_MOI_BASE_URL=https://api.smartservices.moi.gov.ae" />
            <CopyBox value="" />
            <CopyBox value="# Dubai Police API (Dubai fines, OAuth2)" />
            <CopyBox value="RTA_DP_CLIENT_ID=your-dubai-police-client-id" />
            <CopyBox value="RTA_DP_CLIENT_SECRET=your-dubai-police-client-secret" />
            <CopyBox value="RTA_DP_BASE_URL=https://api.dubaipolice.gov.ae" />
            <CopyBox value="" />
            <CopyBox value="# RTA Smart Integration (registration, insurance, inspection, Salik)" />
            <CopyBox value="RTA_API_KEY=your-rta-api-key-here" />
            <CopyBox value="RTA_BASE_URL=https://gateway.rta.ae" />
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-white/30">Restart the dev server after editing .env.local for changes to take effect.</p>
        </div>

        {/* Tips */}
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Tips & rate limits</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-white/60">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-2" />
              <p>Start with <strong>one API at a time</strong> to verify it works before adding the others.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-2" />
              <p>All three APIs have <strong>sandbox environments</strong> — use the sandbox base URLs during development and switch to production URLs when live.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-2" />
              <p>Typical rate limits: MOI ~100 req/min, Dubai Police ~50 req/min, RTA ~30 req/min. The system only calls APIs when you click <strong>Run Auto-Check</strong> on a job card.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-2" />
              <p>Even without API access, staff can enter fines, Salik balance, and registration details <strong>manually</strong> from within each job card.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand shrink-0 mt-2" />
              <p>The <strong>Include in Invoice</strong> toggle on each job card controls whether the vehicle status section appears on the customer&apos;s invoice.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href="/workshop/settings" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Link>
          <p className="text-xs text-gray-300 dark:text-white/20">Bakkah · UAE RTA Integration Guide</p>
        </div>

      </div>
    </div>
  )
}

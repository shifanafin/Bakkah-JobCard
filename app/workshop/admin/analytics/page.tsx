'use client'

import { ExternalLink, BarChart2, MousePointer2, Video, Zap, Globe, Bug } from 'lucide-react'

const POSTHOG_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace('us.i.posthog.com', 'us.posthog.com') ?? 'https://us.posthog.com'

const FEATURES = [
  { icon: BarChart2,    title: 'Pageviews & Funnels',   desc: 'Track every page visit, conversion funnels, and drop-offs across the whole app.' },
  { icon: MousePointer2,title: 'Autocapture Events',    desc: 'Every click, form submission, and input change is captured automatically.' },
  { icon: Video,        title: 'Session Recordings',    desc: 'Watch real user sessions to see exactly how people use the app.' },
  { icon: Zap,          title: 'Web Vitals',            desc: 'LCP, CLS, FID, FCP and TTFB — Core Web Vitals tracked automatically.' },
  { icon: Globe,        title: 'User Identification',   desc: 'Logged-in staff are identified by name, email and role in every event.' },
  { icon: Bug,          title: 'Error Tracking',        desc: 'Unhandled JS exceptions and promise rejections are captured automatically.' },
]

const EVENTS = [
  { name: 'job_searched',       desc: 'Customer searched for a job on the Track page' },
  { name: 'job_found',          desc: 'Search returned a matching job card' },
  { name: 'job_not_found',      desc: 'Search found no matching job card' },
  { name: 'feedback_submitted', desc: 'Customer submitted a star rating + comment' },
  { name: 'invoice_viewed',     desc: 'Customer opened their invoice link' },
  { name: 'invoice_printed',    desc: 'Staff clicked Invoice button on a job card' },
  { name: 'job_card_viewed',    desc: 'Staff opened a job card detail page' },
  { name: 'job_status_changed', desc: 'Job card status was updated by staff' },
  { name: 'technician_assigned',desc: 'A technician was assigned to a job card' },
  { name: 'job_card_created',   desc: 'A new job card was created' },
  { name: 'whatsapp_sent',      desc: 'Staff clicked WhatsApp button on a job card' },
  { name: 'login_success',      desc: 'A staff member logged in successfully' },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-brand" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
            Powered by PostHog — open the dashboard to view live data
          </p>
        </div>
        <a
          href={POSTHOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black shadow-[0_2px_12px_rgba(255,127,10,0.3)] hover:bg-brand/90 transition-all hover:shadow-[0_4px_20px_rgba(255,127,10,0.4)]"
        >
          <ExternalLink className="h-4 w-4" />
          Open PostHog Dashboard
        </a>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
          Active Features
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 border border-brand/20">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="text-xs text-gray-400 dark:text-white/35 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom events */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
          Custom Events Being Tracked
        </h2>
        <div className="card divide-y divide-gray-50 dark:divide-white/[0.04]">
          {EVENTS.map(({ name, desc }) => (
            <div key={name} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-0.5 rounded-md bg-brand/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand shrink-0">
                {name}
              </span>
              <span className="text-sm text-gray-500 dark:text-white/40">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

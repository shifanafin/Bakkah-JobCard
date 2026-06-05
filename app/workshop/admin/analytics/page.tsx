'use client'

import { useState, useEffect } from 'react'
import {
  BarChart2, Eye, Search, CheckCircle, XCircle, MessageSquare,
  Smartphone, Monitor, Tablet, Globe, RefreshCw, Calendar,
  Users, TrendingUp, ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type AnalyticsSummary = {
  total_events: number
  page_views: number
  searches: number
  found: number
  not_found: number
  feedbacks: number
  unique_sessions: number
  devices: { mobile: number; desktop: number; tablet: number }
  top_countries: [string, number][]
  searched_jobs: string[]
}

type AnalyticsEvent = {
  id: string
  event_type: string
  session_id: string | null
  job_number: string | null
  query_type: string | null
  device_type: string | null
  ip_partial: string | null
  country: string | null
  city: string | null
  created_at: string
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  page_view:      { label: 'Page View',      color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  track_search:   { label: 'Search',         color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  track_found:    { label: 'Found',          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  track_not_found:{ label: 'Not Found',      color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  feedback_submit:{ label: 'Feedback',       color: 'bg-brand/15 text-brand border-brand/25' },
}

const COUNTRY_FLAG: Record<string, string> = {
  AE: '🇦🇪', US: '🇺🇸', GB: '🇬🇧', IN: '🇮🇳', PK: '🇵🇰',
  SA: '🇸🇦', KW: '🇰🇼', QA: '🇶🇦', BH: '🇧🇭', OM: '🇴🇲',
  EG: '🇪🇬', PH: '🇵🇭', BD: '🇧🇩', LK: '🇱🇰', NP: '🇳🇵',
}

function StatCard({
  icon: Icon, label, value, sub, color = 'text-brand',
}: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color?: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10">
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-white/50">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function DeviceBar({ label, count, total, icon: Icon }: { label: string; count: number; total: number; icon: React.ElementType }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
          <span className="text-xs text-gray-400 dark:text-white/30">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-brand transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(d: number) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics?days=${d}`)
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Failed to load')
      }
      const json = await res.json()
      setSummary(json.summary)
      setEvents(json.events ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(days) }, [days])

  const findRate = summary && summary.searches > 0
    ? Math.round((summary.found / summary.searches) * 100)
    : 0

  const totalDevices = summary
    ? summary.devices.mobile + summary.devices.desktop + summary.devices.tablet
    : 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-brand" />
            Website Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">
            Visitor interactions on the public track page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-white/[0.08] overflow-hidden text-sm">
            {[7, 14, 30, 60].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  days === d
                    ? 'bg-brand text-black'
                    : 'text-gray-500 hover:bg-gray-50 dark:text-white/40 dark:hover:bg-white/[0.04]'
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition dark:border-white/[0.08] dark:text-white/40 dark:hover:bg-white/[0.04]"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && !summary && (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-brand" />
        </div>
      )}

      {summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Eye}          label="Page Views"      value={summary.page_views}     sub={`Last ${days} days`} />
            <StatCard icon={Users}        label="Unique Sessions" value={summary.unique_sessions} sub="Anonymous visitors" color="text-blue-400" />
            <StatCard icon={Search}       label="Searches"        value={summary.searches}       sub={`${findRate}% success rate`} color="text-amber-400" />
            <StatCard icon={MessageSquare}label="Feedbacks"       value={summary.feedbacks}      sub="Submitted via track page" color="text-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={CheckCircle} label="Jobs Found"     value={summary.found}     color="text-emerald-400" />
            <StatCard icon={XCircle}     label="Not Found"      value={summary.not_found} color="text-red-400" />
            <StatCard icon={TrendingUp}  label="Success Rate"   value={`${findRate}%`}    color="text-brand" />
            <StatCard icon={ClipboardList} label="Total Events" value={summary.total_events} color="text-purple-400" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Device breakdown */}
            <div className="card space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                Device Breakdown
              </h2>
              <DeviceBar label="Mobile"  count={summary.devices.mobile}  total={totalDevices} icon={Smartphone} />
              <DeviceBar label="Desktop" count={summary.devices.desktop} total={totalDevices} icon={Monitor} />
              <DeviceBar label="Tablet"  count={summary.devices.tablet}  total={totalDevices} icon={Tablet} />
            </div>

            {/* Top countries */}
            <div className="card space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" />
                Top Countries
              </h2>
              {summary.top_countries.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-white/30">No country data yet</p>
              )}
              <div className="space-y-2">
                {summary.top_countries.map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-white/70">
                      <span>{COUNTRY_FLAG[country] ?? '🌐'}</span>
                      <span>{country}</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracked job numbers */}
            <div className="card space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                Recently Tracked Jobs
              </h2>
              {summary.searched_jobs.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-white/30">No tracked jobs yet</p>
              )}
              <div className="space-y-1.5">
                {summary.searched_jobs.slice(0, 10).map(jn => (
                  <div key={jn} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                    <span className="font-mono text-sm text-gray-700 dark:text-white/60">{jn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent events table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand" />
                Recent Events
              </h2>
              <span className="text-xs text-gray-400 dark:text-white/30">Latest {events.length} of {summary.total_events}</span>
            </div>

            {events.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-white/30">
                No events recorded yet. Events appear when visitors use the track page.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                      {['Event', 'Job Number', 'Device', 'Country / City', 'Time'].map(h => (
                        <th key={h} className="pb-3 pr-4 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/25 first:pl-4 sm:first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {events.map(ev => {
                      const evStyle = EVENT_LABELS[ev.event_type] ?? { label: ev.event_type, color: 'bg-gray-100 text-gray-500 border-gray-200' }
                      return (
                        <tr key={ev.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 pr-4 pl-4 sm:pl-0">
                            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold', evStyle.color)}>
                              {evStyle.label}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-gray-700 dark:text-white/60">
                              {ev.job_number ?? <span className="text-gray-300 dark:text-white/20">—</span>}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-white/40">
                              {ev.device_type === 'mobile' && <Smartphone className="h-3.5 w-3.5 shrink-0" />}
                              {ev.device_type === 'desktop' && <Monitor className="h-3.5 w-3.5 shrink-0" />}
                              {ev.device_type === 'tablet' && <Tablet className="h-3.5 w-3.5 shrink-0" />}
                              <span className="text-xs capitalize">{ev.device_type ?? '—'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs text-gray-500 dark:text-white/40">
                              {ev.country ? `${COUNTRY_FLAG[ev.country] ?? '🌐'} ${ev.country}` : '—'}
                              {ev.city ? ` · ${ev.city}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 sm:pr-0">
                            <span className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">
                              {new Date(ev.created_at).toLocaleString('en-AE', {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

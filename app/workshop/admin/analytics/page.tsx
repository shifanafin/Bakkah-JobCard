'use client'

import { ExternalLink, BarChart2, MousePointer2, Video, Zap, Globe, Bug, MapPin } from 'lucide-react'

const POSTHOG_URL = 'https://us.posthog.com'

const FEATURES = [
  { icon: Globe,        title: 'Location & GeoIP',      desc: 'Country, city, region on every event — automatic via PostHog GeoIP enrichment. Timezone registered client-side for accuracy.' },
  { icon: BarChart2,    title: 'Pageviews & Funnels',   desc: 'Every page visit captured. Break down by country or city in any insight.' },
  { icon: MousePointer2,title: 'Autocapture',           desc: 'Every click, form submit, and input change recorded automatically.' },
  { icon: Video,        title: 'Session Recordings',    desc: 'Watch full user sessions. Filter recordings by country or city.' },
  { icon: Zap,          title: 'Web Vitals',            desc: 'LCP, CLS, FID, FCP, TTFB — Core Web Vitals per page.' },
  { icon: Bug,          title: 'Error Tracking',        desc: 'Unhandled JS exceptions and promise rejections captured automatically.' },
]

const GEO_PROPS = [
  { prop: '$geoip_country_name',   example: 'United Arab Emirates' },
  { prop: '$geoip_country_code',   example: 'AE' },
  { prop: '$geoip_city_name',      example: 'Dubai' },
  { prop: '$geoip_region_name',    example: 'Dubai' },
  { prop: '$geoip_continent_code', example: 'AS' },
  { prop: '$geoip_latitude',       example: '25.2048' },
  { prop: '$geoip_longitude',      example: '55.2708' },
  { prop: '$geoip_time_zone',      example: 'Asia/Dubai' },
  { prop: '$timezone',             example: 'Asia/Dubai  (client-side)' },
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
            Powered by PostHog — all location data is automatic
          </p>
        </div>
        <a
          href={POSTHOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black shadow-[0_2px_12px_rgba(255,127,10,0.3)] hover:bg-brand/90 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Open PostHog Dashboard
        </a>
      </div>

      {/* How to see location data */}
      <div className="rounded-2xl border border-brand/20 bg-brand/5 dark:bg-brand/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand shrink-0" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">How to view location-wise data in PostHog</h2>
        </div>
        <ol className="space-y-2 text-sm text-gray-600 dark:text-white/60 list-decimal list-inside">
          <li>Open PostHog → <strong className="text-gray-800 dark:text-white/80">Insights</strong> → create a new Trends chart</li>
          <li>Click <strong className="text-gray-800 dark:text-white/80">Breakdown by</strong> → choose <code className="rounded bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-mono text-brand">$geoip_country_name</code> or <code className="rounded bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-mono text-brand">$geoip_city_name</code></li>
          <li>For a map view: open <strong className="text-gray-800 dark:text-white/80">Insights</strong> → select chart type <strong className="text-gray-800 dark:text-white/80">World Map</strong></li>
          <li>In <strong className="text-gray-800 dark:text-white/80">Session Recordings</strong> → filter by country or city to watch sessions from specific locations</li>
          <li>In <strong className="text-gray-800 dark:text-white/80">Persons</strong> → filter by <code className="rounded bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-mono text-brand">$geoip_country_code = AE</code> to see UAE visitors</li>
        </ol>
      </div>

      {/* GeoIP properties */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-4">
          Location Properties on Every Event
        </h2>
        <div className="card divide-y divide-gray-50 dark:divide-white/[0.04]">
          {GEO_PROPS.map(({ prop, example }) => (
            <div key={prop} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
              <code className="rounded-md bg-brand/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand shrink-0">
                {prop}
              </code>
              <span className="text-sm text-gray-400 dark:text-white/35 text-right">{example}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active features */}
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
    </div>
  )
}

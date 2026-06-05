import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/app/auth'

export const runtime = 'nodejs'

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function getIpPartial(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? '')
  const parts = ip.split('.')
  return parts.length >= 3 ? parts.slice(0, 3).join('.') : ip.substring(0, 8)
}

function detectDevice(ua: string): string {
  if (/mobile/i.test(ua) && !/tablet|ipad/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

// POST — log a visitor event (public, fire-and-forget)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, session_id, job_number, query_type } = body
    if (!event_type) return NextResponse.json({ ok: false }, { status: 400 })

    const ua = req.headers.get('user-agent') ?? ''
    const country = req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country') ?? null
    const city = req.headers.get('x-vercel-ip-city') ?? null

    const sb = getSb()
    await sb.from('visitor_analytics').insert({
      event_type,
      session_id: session_id ?? null,
      job_number: job_number ?? null,
      query_type: query_type ?? null,
      user_agent: ua.substring(0, 300),
      device_type: detectDevice(ua),
      ip_partial: getIpPartial(req),
      country,
      city,
      referrer: req.headers.get('referer')?.substring(0, 200) ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }) // never block the user
  }
}

// GET — analytics summary + recent events (admin/manager only)
export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!['admin', 'manager'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const days = Math.min(parseInt(url.searchParams.get('days') ?? '30'), 90)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const sb = getSb()
  const { data, error } = await sb
    .from('visitor_analytics')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const events = data ?? []

  const countryMap: Record<string, number> = {}
  events.forEach(e => { if (e.country) countryMap[e.country] = (countryMap[e.country] ?? 0) + 1 })

  const summary = {
    total_events: events.length,
    page_views: events.filter(e => e.event_type === 'page_view').length,
    searches: events.filter(e => e.event_type === 'track_search').length,
    found: events.filter(e => e.event_type === 'track_found').length,
    not_found: events.filter(e => e.event_type === 'track_not_found').length,
    feedbacks: events.filter(e => e.event_type === 'feedback_submit').length,
    unique_sessions: new Set(events.map(e => e.session_id).filter(Boolean)).size,
    devices: {
      mobile: events.filter(e => e.device_type === 'mobile').length,
      desktop: events.filter(e => e.device_type === 'desktop').length,
      tablet: events.filter(e => e.device_type === 'tablet').length,
    },
    top_countries: Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8),
    searched_jobs: events
      .filter(e => e.event_type === 'track_found' && e.job_number)
      .map(e => e.job_number)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 20),
  }

  return NextResponse.json({ events: events.slice(0, 100), summary })
}

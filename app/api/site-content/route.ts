import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from '@/lib/server-session'

export const revalidate = 60 // ISR: re-fetch at most every 60s

export async function GET() {
  try {
    const sb = await createClient()
    const { data, error } = await sb.from('site_content').select('section, content, updated_at')
    if (error) throw error
    const map: Record<string, unknown> = {}
    for (const row of data ?? []) map[row.section] = row.content
    return NextResponse.json(map, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({}, { status: 200 }) // fail gracefully — homepage falls back to defaults
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  const role = (session?.user as { role?: string })?.role
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { section, content } = await req.json()
    if (!section || content === undefined) {
      return NextResponse.json({ error: 'section and content required' }, { status: 400 })
    }

    const sb = await createClient()
    const { error } = await sb.from('site_content').upsert(
      { section, content, updated_at: new Date().toISOString(), updated_by: session.user.name ?? 'admin' },
      { onConflict: 'section' }
    )
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

async function requireAdmin() {
  const session = await getServerSession()
  const role = session?.user?.role
  if (!session || role !== 'admin') return null
  return session
}

export async function GET() {
  const sb = createServiceClient()
  const { data, error } = await sb.from('announcements').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcements: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const sb = createServiceClient()
  const payload = {
    title: (body.title ?? '').trim(),
    content: (body.content ?? '').trim(),
    type: body.type,
    show_on_track: !!body.show_on_track,
    expires_at: body.expires_at || null,
    created_by: session.user.name ?? 'admin',
    active: true,
  }
  if (!payload.title || !payload.content) {
    return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
  }

  const { data, error } = await sb.from('announcements').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcement: data }, { status: 201 })
}

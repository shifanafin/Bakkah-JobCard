import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type Params = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const session = await getServerSession()
  const role = session?.user?.role
  if (!session || role !== 'admin') return null
  return session
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const sb = createServiceClient()

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content.trim()
  if (body.type !== undefined) updates.type = body.type
  if (body.show_on_track !== undefined) updates.show_on_track = body.show_on_track
  if (body.expires_at !== undefined) updates.expires_at = body.expires_at || null
  if (body.active !== undefined) updates.active = body.active

  const { data, error } = await sb.from('announcements').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcement: data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  const sb = createServiceClient()
  const { error } = await sb.from('announcements').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

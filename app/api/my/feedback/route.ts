import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from '@/lib/server-session'

export const runtime = 'nodejs'

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — list own feedback (type: suggestion | complaint)
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type') // 'suggestion' | 'complaint' | null (all)
  const sb = getSb()

  try {
    let query = sb
      .from('employee_feedback')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

// POST — submit suggestion or complaint
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, subject, message } = body

  if (!type || !subject || !message) {
    return NextResponse.json({ error: 'type, subject, and message are required' }, { status: 400 })
  }
  if (!['suggestion', 'complaint'].includes(type)) {
    return NextResponse.json({ error: 'type must be suggestion or complaint' }, { status: 400 })
  }

  const sb = getSb()
  try {
    const { data, error } = await sb
      .from('employee_feedback')
      .insert({
        user_id: session.user.id,
        user_name: session.user.name,
        type,
        subject,
        body: message,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to submit'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH — edit own suggestion/complaint while still open
export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, subject, message } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { data: existing } = await sb.from('employee_feedback').select('user_id, status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (existing.status !== 'open') return NextResponse.json({ error: 'Only open items can be edited' }, { status: 409 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (subject !== undefined) updates.subject = subject
  if (message !== undefined) updates.body = message

  const { data, error } = await sb.from('employee_feedback').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// DELETE — remove own suggestion/complaint while still open
export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { data: existing } = await sb.from('employee_feedback').select('user_id, status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.user_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (existing.status !== 'open') return NextResponse.json({ error: 'Only open items can be deleted' }, { status: 409 })

  const { error } = await sb.from('employee_feedback').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

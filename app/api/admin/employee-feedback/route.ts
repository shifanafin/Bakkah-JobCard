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

async function requireAdmin() {
  const session = await getServerSession()
  if (!session?.user?.id) return null
  const role = (session.user as { role?: string }).role
  if (role !== 'admin' && role !== 'supervisor') return null
  return session
}

// GET — list all feedback, optionally filtered by type or status
export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status')

  const sb = getSb()
  let query = sb
    .from('employee_feedback')
    .select('id, user_id, user_name, type, subject, body, status, admin_note, reviewed_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feedback: data ?? [] })
}

// PATCH — update status (reviewed / resolved) and add admin note
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, status, admin_note } = body

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
  if (!['open', 'reviewed', 'resolved'].includes(status)) {
    return NextResponse.json({ error: 'status must be open, reviewed, or resolved' }, { status: 400 })
  }

  const sb = getSb()
  const { data, error } = await sb
    .from('employee_feedback')
    .update({
      status,
      admin_note: admin_note ?? null,
      reviewed_by: session.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ feedback: data })
}

// DELETE — remove a suggestion/complaint while still open (audit trail preserved once actioned)
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { data: existing } = await sb.from('employee_feedback').select('status').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'open') {
    return NextResponse.json({ error: 'Only open items can be deleted' }, { status: 409 })
  }

  const { error } = await sb.from('employee_feedback').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — list all technicians with user details and active job count
export async function GET() {
  try {
    const sb = getServiceClient()

    const { data: techs, error } = await sb
      .from('technicians')
      .select('*')
      .order('name')
    if (error) throw error

    if (!techs || techs.length === 0) return NextResponse.json({ technicians: [] })

    const ids = techs.map(t => t.id)

    const [{ data: users }, { data: jobRows }] = await Promise.all([
      sb.from('users').select('id, email, username').in('id', ids),
      sb.from('job_cards')
        .select('technician_id')
        .in('technician_id', ids)
        .not('status', 'in', '(delivered,cancelled)'),
    ])

    const userMap: Record<string, { email: string; username: string }> = {}
    for (const u of users ?? []) userMap[u.id] = { email: u.email, username: u.username }

    const countMap: Record<string, number> = {}
    for (const j of jobRows ?? []) countMap[j.technician_id] = (countMap[j.technician_id] || 0) + 1

    const result = techs.map(t => ({
      ...t,
      email: userMap[t.id]?.email ?? null,
      username: userMap[t.id]?.username ?? null,
      active_jobs: countMap[t.id] ?? 0,
    }))

    return NextResponse.json({ technicians: result })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch technicians' },
      { status: 500 }
    )
  }
}

// PATCH — update technician phone and/or specialty role
export async function PATCH(req: NextRequest) {
  try {
    const { id, phone, specialty } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const sb = getServiceClient()
    const updates: Record<string, unknown> = {}
    if (phone !== undefined) updates.phone = phone || null
    if (specialty !== undefined) updates.role = specialty

    const { error } = await sb.from('technicians').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update technician' },
      { status: 500 }
    )
  }
}

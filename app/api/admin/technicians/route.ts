import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { getServerSession } from '@/lib/server-session'

export const runtime = 'nodejs'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — list all technicians with user details, active job count, and today's attendance
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
    const today = new Date().toISOString().split('T')[0]

    const [{ data: users }, { data: jobRows }, { data: attendance }] = await Promise.all([
      sb.from('users').select('id, email, username').in('id', ids),
      sb.from('job_cards')
        .select('technician_id')
        .in('technician_id', ids)
        .not('status', 'in', '(delivered,cancelled)'),
      sb.from('attendance')
        .select('id, user_id, checkin_at, checkout_at')
        .in('user_id', ids)
        .eq('date', today),
    ])

    const userMap: Record<string, { email: string; username: string }> = {}
    for (const u of users ?? []) userMap[u.id] = { email: u.email, username: u.username }

    const countMap: Record<string, number> = {}
    for (const j of jobRows ?? []) countMap[j.technician_id] = (countMap[j.technician_id] || 0) + 1

    const attMap: Record<string, { id: string; checkin_at: string; checkout_at: string | null }> = {}
    for (const a of attendance ?? []) attMap[a.user_id] = a

    const result = techs.map(t => ({
      ...t,
      email: userMap[t.id]?.email ?? null,
      username: userMap[t.id]?.username ?? null,
      active_jobs: countMap[t.id] ?? 0,
      today_attendance: attMap[t.id] ?? null,
    }))

    return NextResponse.json({ technicians: result })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch technicians' },
      { status: 500 }
    )
  }
}

// POST — create a new technician (user account + technicians table mirror)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const callerRole = session?.user?.role
    if (!session || (callerRole !== 'admin' && callerRole !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, email, username, phone, specialty, password } = await req.json()
    if (!name?.trim() || !email?.trim() || !username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'name, email, username and password are required' }, { status: 400 })
    }

    const sb = getServiceClient()

    const { data: existing } = await sb
      .from('users')
      .select('id')
      .or(`email.eq.${email.trim()},username.eq.${username.trim().toLowerCase()}`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data: user, error: userErr } = await sb
      .from('users')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        role: 'technician',
        password_hash,
        active: true,
      })
      .select('id, name, email, username, role, active, created_at')
      .single()

    if (userErr) throw userErr

    // Create ba_account row so the technician can log in
    const now = new Date().toISOString()
    await sb.from('ba_account').insert({
      id:          randomUUID(),
      account_id:  user.id,
      provider_id: 'credential',
      user_id:     user.id,
      password:    password_hash,
      created_at:  now,
      updated_at:  now,
    })

    await sb.from('technicians').upsert({
      id: user.id,
      name: user.name,
      phone: phone?.trim() || null,
      role: specialty || 'Technician',
      active: true,
    }, { onConflict: 'id' })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create technician' },
      { status: 500 }
    )
  }
}

// PATCH — update technician phone and/or specialty role
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession()
    const callerRole = session?.user?.role
    if (!session || (callerRole !== 'admin' && callerRole !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

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

// DELETE — remove technician (unassigns job cards, deletes from both tables)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession()
    const callerRole = session?.user?.role
    if (!session || (callerRole !== 'admin' && callerRole !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const sb = getServiceClient()

    // Unassign from any open job cards
    await sb.from('job_cards').update({ technician_id: null }).eq('technician_id', id)

    // Remove from both tables
    await sb.from('technicians').delete().eq('id', id)
    await sb.from('users').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete technician' },
      { status: 500 }
    )
  }
}

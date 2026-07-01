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

// POST — check-in
//   Normal: uses session user (admin cannot self-check-in)
//   Admin/supervisor override: body { forUserId } checks in a specific user
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role

  let forUserId: string | undefined
  try {
    const body = await req.json()
    forUserId = body?.forUserId
  } catch { /* no body */ }

  const isAdminOverride = !!forUserId && (role === 'admin' || role === 'supervisor')

  // Block admin from self check-in (they can only override for others)
  if (!isAdminOverride && role === 'admin') {
    return NextResponse.json({ error: 'Admins do not have attendance records' }, { status: 403 })
  }

  const userId = isAdminOverride ? forUserId! : session.user.id
  const today = new Date().toISOString().split('T')[0]
  const sb = getSb()

  const { data: existing } = await sb
    .from('attendance')
    .select('id, checkin_at, checkout_at')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ id: existing.id, alreadyIn: true, checkin_at: existing.checkin_at })
  }

  const { data, error } = await sb
    .from('attendance')
    .insert({ user_id: userId, date: today })
    .select('id, checkin_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, checkin_at: data.checkin_at }, { status: 201 })
}

// PATCH — check-out
//   Normal: body { id } — checks out session user's own record
//   Admin/supervisor override: body { forUserId } — checks out a specific user's today record
export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  const body = await req.json()
  const { id, forUserId } = body

  const isAdminOverride = !!forUserId && (role === 'admin' || role === 'supervisor')

  if (!isAdminOverride && role === 'admin') {
    return NextResponse.json({ error: 'Admins do not have attendance records' }, { status: 403 })
  }

  const now = new Date().toISOString()
  const sb = getSb()

  if (isAdminOverride) {
    const today = new Date().toISOString().split('T')[0]
    const { data: att } = await sb
      .from('attendance')
      .select('id')
      .eq('user_id', forUserId)
      .eq('date', today)
      .maybeSingle()

    if (!att) return NextResponse.json({ error: 'No check-in found for today' }, { status: 404 })

    const { error } = await sb
      .from('attendance')
      .update({ checkout_at: now })
      .eq('id', att.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, checkout_at: now })
  }

  // Self checkout
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await sb
    .from('attendance')
    .update({ checkout_at: now })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, checkout_at: now })
}

// GET — two modes:
//   ?today=true  → current employee's own attendance for today
//   ?date=YYYY-MM-DD → admin/supervisor view of all staff for that date
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const role = session.user.role

  // Employee self history
  if (url.searchParams.get('history') === 'true') {
    const days = parseInt(url.searchParams.get('days') ?? '30') || 30
    const since = new Date()
    since.setDate(since.getDate() - days + 1)
    const sinceDate = since.toISOString().split('T')[0]
    const sb = getSb()
    const { data } = await sb
      .from('attendance')
      .select('id, date, checkin_at, checkout_at')
      .eq('user_id', session.user.id)
      .gte('date', sinceDate)
      .order('date', { ascending: false })
    return NextResponse.json({ records: data ?? [] })
  }

  // Employee self-check
  if (url.searchParams.get('today') === 'true') {
    const today = new Date().toISOString().split('T')[0]
    const sb = getSb()
    const { data } = await sb
      .from('attendance')
      .select('id, checkin_at, checkout_at')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .maybeSingle()
    return NextResponse.json({ record: data ?? null })
  }

  // Admin/supervisor view
  if (role !== 'admin' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
  const sb = getSb()

  const { data: staff } = await sb
    .from('users')
    .select('id, name, role, active')
    .in('role', ['technician', 'supervisor', 'receptionist'])
    .order('name')

  if (!staff || staff.length === 0) return NextResponse.json({ records: [] })

  const staffIds = staff.map(s => s.id)

  const { data: att } = await sb
    .from('attendance')
    .select('id, user_id, checkin_at, checkout_at')
    .in('user_id', staffIds)
    .eq('date', date)

  const { data: closedJobs } = await sb
    .from('job_cards')
    .select('technician_id')
    .in('technician_id', staffIds)
    .eq('status', 'delivered')
    .gte('updated_at', `${date}T00:00:00`)
    .lt('updated_at', `${date}T23:59:59`)

  const { data: activeJobs } = await sb
    .from('job_cards')
    .select('technician_id')
    .in('technician_id', staffIds)
    .not('status', 'in', '(delivered,cancelled)')

  const { data: totalJobs } = await sb
    .from('job_cards')
    .select('technician_id')
    .in('technician_id', staffIds)

  const attMap: Record<string, { id: string; checkin_at: string; checkout_at: string | null }> = {}
  for (const a of att ?? []) attMap[a.user_id] = a

  const closedMap: Record<string, number> = {}
  for (const j of closedJobs ?? []) {
    if (j.technician_id) closedMap[j.technician_id] = (closedMap[j.technician_id] || 0) + 1
  }

  const activeMap: Record<string, number> = {}
  for (const j of activeJobs ?? []) {
    if (j.technician_id) activeMap[j.technician_id] = (activeMap[j.technician_id] || 0) + 1
  }

  const totalMap: Record<string, number> = {}
  for (const j of totalJobs ?? []) {
    if (j.technician_id) totalMap[j.technician_id] = (totalMap[j.technician_id] || 0) + 1
  }

  const records = staff.map(s => ({
    ...s,
    attendance: attMap[s.id] ?? null,
    jobs_closed_today: closedMap[s.id] ?? 0,
    active_jobs: activeMap[s.id] ?? 0,
    total_jobs: totalMap[s.id] ?? 0,
  }))

  return NextResponse.json({ records, date })
}

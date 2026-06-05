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

// POST — check-in (idempotent: returns existing if already checked in today)
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = new Date().toISOString().split('T')[0]
  const sb = getSb()

  // Return existing record if already checked in today
  const { data: existing } = await sb
    .from('attendance')
    .select('id, checkin_at, checkout_at')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (existing) return NextResponse.json({ id: existing.id, alreadyIn: true, checkin_at: existing.checkin_at })

  const { data, error } = await sb
    .from('attendance')
    .insert({ user_id: userId, date: today })
    .select('id, checkin_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, checkin_at: data.checkin_at }, { status: 201 })
}

// PATCH — check-out (always updates checkout_at so last disconnect wins)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getSb()
  const { error } = await sb
    .from('attendance')
    .update({ checkout_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// GET — admin: all attendance for a date with job stats
export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const date = new URL(req.url).searchParams.get('date') || new Date().toISOString().split('T')[0]
  const sb = getSb()

  // All staff that are technician or supervisor
  const { data: staff } = await sb
    .from('users')
    .select('id, name, role, active')
    .in('role', ['technician', 'supervisor'])
    .order('name')

  if (!staff || staff.length === 0) return NextResponse.json({ records: [] })

  const staffIds = staff.map(s => s.id)

  // Attendance for the date
  const { data: att } = await sb
    .from('attendance')
    .select('id, user_id, checkin_at, checkout_at')
    .in('user_id', staffIds)
    .eq('date', date)

  // Jobs closed on this date (delivered, date matches updated_at date)
  const { data: closedJobs } = await sb
    .from('job_cards')
    .select('technician_id')
    .in('technician_id', staffIds)
    .eq('status', 'delivered')
    .gte('updated_at', `${date}T00:00:00`)
    .lt('updated_at', `${date}T23:59:59`)

  // Active jobs (not delivered/cancelled)
  const { data: activeJobs } = await sb
    .from('job_cards')
    .select('technician_id')
    .in('technician_id', staffIds)
    .not('status', 'in', '(delivered,cancelled)')

  // Total jobs (all time)
  const { data: totalJobs } = await sb
    .from('job_cards')
    .select('technician_id')
    .in('technician_id', staffIds)

  // Build maps
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

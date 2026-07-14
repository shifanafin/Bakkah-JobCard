import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET — list all users
export async function GET() {
  try {
    const sb = getServiceClient()
    const { data, error } = await sb
      .from('users')
      .select('id, name, email, username, role, active, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ users: data ?? [] })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST — create new employee
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, username, role, password } = body

    if (!name || !email || !username || !role || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const sb = getServiceClient()

    // Check for existing email/username
    const { data: existing } = await sb
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const { data, error } = await sb
      .from('users')
      .insert({ name, email, username: username.toLowerCase(), role, password_hash, active: true })
      .select('id, name, email, username, role, active, created_at')
      .single()

    if (error) throw error

    // Create ba_account row so the user can log in via username/email
    const now = new Date().toISOString()
    await sb.from('ba_account').insert({
      id:          randomUUID(),
      account_id:  data.id,
      provider_id: 'credential',
      user_id:     data.id,
      password:    password_hash,
      created_at:  now,
      updated_at:  now,
    })

    // Mirror technician users into the technicians table so they appear in assignment dropdowns
    if (role === 'technician') {
      await sb.from('technicians').upsert({ id: data.id, name, active: true }, { onConflict: 'id' })
    }

    return NextResponse.json({ user: data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create employee' },
      { status: 500 }
    )
  }
}

// DELETE — soft delete. Hidden from lists immediately (and can no longer log in,
// since sessions are cleared), permanently purged after 30 days.
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sb = getServiceClient()
    await sb.from('ba_session').delete().eq('user_id', id)
    // active:false too, so a deleted account is blocked from sign-in the same way a deactivated one is
    const { error } = await sb.from('users').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to delete' }, { status: 500 })
  }
}

// PATCH — toggle active or reset password
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, password } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    }

    const sb = getServiceClient()

    if (action === 'toggle_active') {
      const { data: user } = await sb.from('users').select('active, role').eq('id', id).single()
      const newActive = !user?.active
      const { error } = await sb.from('users').update({ active: newActive }).eq('id', id)
      if (error) throw error
      // Keep technicians table in sync
      if (user?.role === 'technician') {
        await sb.from('technicians').update({ active: newActive }).eq('id', id)
      }
      return NextResponse.json({ success: true, active: newActive })
    }

    if (action === 'update_details') {
      const { name, email, username, role } = body
      if (!name || !email || !username || !role) {
        return NextResponse.json({ error: 'name, email, username and role are required' }, { status: 400 })
      }

      const { data: existing } = await sb
        .from('users')
        .select('id')
        .neq('id', id)
        .or(`email.eq.${email},username.eq.${username}`)
        .limit(1)
      if (existing && existing.length > 0) {
        return NextResponse.json({ error: 'Email or username already in use' }, { status: 409 })
      }

      const { data: before } = await sb.from('users').select('role').eq('id', id).single()

      const { data, error } = await sb
        .from('users')
        .update({ name, email, username: username.toLowerCase(), role })
        .eq('id', id)
        .select('id, name, email, username, role, active, created_at')
        .single()
      if (error) throw error

      // Keep technicians table in sync when a role changes to/from technician
      if (role === 'technician') {
        await sb.from('technicians').upsert({ id, name, active: data.active }, { onConflict: 'id' })
      } else if (before?.role === 'technician') {
        await sb.from('technicians').delete().eq('id', id)
      }

      return NextResponse.json({ user: data })
    }

    if (action === 'reset_password') {
      if (!password) return NextResponse.json({ error: 'password required' }, { status: 400 })
      const password_hash = await bcrypt.hash(password, 10)
      const now = new Date().toISOString()
      const { error } = await sb.from('users').update({ password_hash }).eq('id', id)
      if (error) throw error
      // Keep ba_account in sync so login still works
      await sb.from('ba_account')
        .update({ password: password_hash, updated_at: now })
        .eq('user_id', id)
        .eq('provider_id', 'credential')
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update employee' },
      { status: 500 }
    )
  }
}

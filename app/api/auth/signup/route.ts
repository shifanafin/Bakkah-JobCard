import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, role } = await req.json()

    if (!name?.trim() || !email?.trim() || !username?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (role === 'admin') {
      return NextResponse.json({ error: 'Admin accounts can only be created by an existing admin' }, { status: 403 })
    }

    const sb = adminClient()

    // Check email taken
    const { data: byEmail } = await sb.from('users').select('id').eq('email', email.trim().toLowerCase()).maybeSingle()
    if (byEmail) return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })

    // Check username taken
    const { data: byUsername } = await sb.from('users').select('id').eq('username', username.trim().toLowerCase()).maybeSingle()
    if (byUsername) return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })

    const password_hash = await bcrypt.hash(password, 10)

    const { data: user, error } = await sb.from('users').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password_hash,
      role: role || 'receptionist',
      active: true,
    }).select('id, email, name, role').single()

    if (error) {
      console.error('[signup] insert error:', error.message)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Create ba_account entry so Better Auth can verify credentials at sign-in
    await sb.from('ba_account').insert({
      account_id: user.email,
      provider_id: 'credential',
      user_id: user.id,
      password: password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, user })
  } catch (e) {
    console.error('[signup] error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

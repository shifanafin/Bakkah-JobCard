import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { createServerSession, setSessionCookie } from '@/lib/server-session'

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

    const sb = adminClient()

    // Block admin creation unless no users exist (first-time setup)
    if (role === 'admin') {
      const { count } = await sb.from('users').select('id', { count: 'exact', head: true })
      if (count !== 0) {
        return NextResponse.json(
          { error: 'Admin accounts can only be created by an existing admin' },
          { status: 403 }
        )
      }
    }

    const cleanEmail    = email.trim().toLowerCase()
    const cleanUsername = username.trim().toLowerCase()

    // Check duplicates
    const { data: existingEmail } = await sb.from('users').select('id').eq('email', cleanEmail).maybeSingle()
    if (existingEmail) return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })

    const { data: existingUser } = await sb.from('users').select('id').eq('username', cleanUsername).maybeSingle()
    if (existingUser) return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })

    // Create user
    const userId        = randomUUID()
    const passwordHash  = await bcrypt.hash(password, 10)
    const now           = new Date().toISOString()

    const { error: userErr } = await sb.from('users').insert({
      id:              userId,
      name:            name.trim(),
      email:           cleanEmail,
      username:        cleanUsername,
      password_hash:   passwordHash,
      role:            role || 'receptionist',
      active:          true,
      email_verified:  false,
      created_at:      now,
      updated_at:      now,
    })
    if (userErr) {
      console.error('[signup] user insert:', userErr.message)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Create credential account in ba_account
    const { error: acctErr } = await sb.from('ba_account').insert({
      id:          randomUUID(),
      account_id:  userId,
      provider_id: 'credential',
      user_id:     userId,
      password:    passwordHash,
      created_at:  now,
      updated_at:  now,
    })
    if (acctErr) {
      console.error('[signup] ba_account insert:', acctErr.message)
      await sb.from('users').delete().eq('id', userId)
      return NextResponse.json({ error: 'Failed to create account credentials' }, { status: 500 })
    }

    // Create session and set cookie
    const { token, expiresAt } = await createServerSession(
      userId,
      req.headers.get('user-agent'),
      req.headers.get('x-forwarded-for'),
    )

    const res = NextResponse.json({
      ok:   true,
      user: { id: userId, email: cleanEmail, name: name.trim(), role: role || 'receptionist' },
    })
    setSessionCookie(res, token, expiresAt)
    return res

  } catch (e) {
    console.error('[signup]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

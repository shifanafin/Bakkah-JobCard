import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, role } = await req.json()

    if (!name?.trim() || !email?.trim() || !username?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Block admin creation unless no users exist yet (first-time setup)
    if (role === 'admin') {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      const { count } = await sb.from('users').select('id', { count: 'exact', head: true })
      if (count !== 0) {
        return NextResponse.json(
          { error: 'Admin accounts can only be created by an existing admin' },
          { status: 403 }
        )
      }
    }

    // Let Better Auth handle user + ba_account + session creation atomically.
    // This ensures the credential account is stored in the exact format BA expects,
    // so subsequent signIn calls work without any format mismatches.
    const baRes = await auth.api.signUpEmail({
      body: {
        email:    email.trim().toLowerCase(),
        password,
        name:     name.trim(),
        username: username.trim().toLowerCase(),
        role:     role || 'receptionist',
      },
      headers:    req.headers,
      asResponse: true,
    })

    if (!baRes.ok) {
      const err = await baRes.json().catch(() => ({})) as Record<string, string>
      // Map BA's generic error message to something user-friendly
      const message = err.message || err.error || ''
      if (message.toLowerCase().includes('email') && message.toLowerCase().includes('exist')) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 409 })
      }
      if (message.toLowerCase().includes('username') && message.toLowerCase().includes('exist')) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }
      return NextResponse.json(
        { error: message || 'Failed to create account' },
        { status: baRes.status }
      )
    }

    // Return BA's response directly — it contains the session cookie and user data
    return baRes

  } catch (e) {
    console.error('[signup]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

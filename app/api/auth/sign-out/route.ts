import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteServerSession, clearSessionCookie, SESSION_COOKIE } from '@/lib/server-session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) await deleteServerSession(token)
  const res = NextResponse.json({ success: true })
  clearSessionCookie(res)
  return res
}

// BA client may call GET /sign-out too
export { POST as GET }

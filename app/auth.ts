import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { authConfig } from '@/auth.config'

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        login:    { label: 'Email or Username', type: 'text' },
        password: { label: 'Password',          type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null
        const login = (credentials.login as string).trim().toLowerCase()
        try {
          const supabase = getAdminClient()

          // Determine lookup field: contains "@" → email, else → username
          const isEmail = login.includes('@')
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq(isEmail ? 'email' : 'username', login)
            .eq('active', true)
            .single()

          if (error) {
            console.error('[auth] db error:', error.message)
            return null
          }
          if (!user) return null

          const valid = await bcrypt.compare(credentials.password as string, user.password_hash)
          if (!valid) return null

          return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.avatar_url }
        } catch (e) {
          console.error('[auth] unexpected error:', e)
          return null
        }
      },
    }),
  ],
})

import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { Pool } from 'pg'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  plugins: [username()],
  user: {
    tableName: 'users',
    fields: {
      image:         'avatar_url',
      emailVerified: 'email_verified',
      createdAt:     'created_at',
      updatedAt:     'updated_at',
    },
    additionalFields: {
      role:   { type: 'string',  required: false, defaultValue: 'receptionist', input: true },
      active: { type: 'boolean', required: false, defaultValue: true,           input: false },
    },
  },
  session: {
    tableName: 'ba_session',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      userId:    'user_id',
    },
  },
  account: {
    tableName: 'ba_account',
    fields: {
      accountId:             'account_id',
      providerId:            'provider_id',
      accessToken:           'access_token',
      refreshToken:          'refresh_token',
      idToken:               'id_token',
      accessTokenExpiresAt:  'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt:             'created_at',
      updatedAt:             'updated_at',
      userId:                'user_id',
    },
  },
  verification: {
    tableName: 'ba_verification',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

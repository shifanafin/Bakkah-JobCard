import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT ?? '5432'),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'postgres',
    ssl:      { rejectUnauthorized: false },
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash:   (password) => bcrypt.hash(password, 10),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  plugins: [username()],
  user: {
    modelName: 'users',           // modelName = actual SQL table name (not tableName)
    fields: {
      image:           'avatar_url',
      emailVerified:   'email_verified',
      createdAt:       'created_at',
      updatedAt:       'updated_at',
      displayUsername: 'display_username',
    },
    additionalFields: {
      role:   { type: 'string',  required: false, defaultValue: 'receptionist', input: true },
      active: { type: 'boolean', required: false, defaultValue: true,           input: false },
    },
  },
  session: {
    modelName: 'ba_session',
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
    modelName: 'ba_account',
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
    modelName: 'ba_verification',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user

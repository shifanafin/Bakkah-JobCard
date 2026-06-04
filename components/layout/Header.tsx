'use client'

import { useSession } from 'next-auth/react'
import { Bell, Search } from 'lucide-react'

interface HeaderProps { title: string; subtitle?: string }

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/[0.06] bg-surface-900/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white leading-none">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-white/30">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition hover:border-white/[0.15] hover:text-white/70">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-brand/20 ring-2 ring-brand/30 flex items-center justify-center">
            <span className="text-xs font-bold text-brand">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white/80">{session?.user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-white/30 capitalize">{(session?.user as { role?: string })?.role ?? 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, ClipboardList, Plus, Settings,
  LogOut, Zap, Car, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV = [
  { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/workshop/job-cards', icon: ClipboardList, label: 'Job Cards' },
  { href: '/workshop/job-cards/new', icon: Plus, label: 'New Job Card', highlight: true },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-white/[0.06] bg-surface-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/30">
          <Zap className="h-4 w-4 text-brand" />
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-wide text-white">AutoEdge</p>
          <p className="text-[10px] text-white/30 leading-tight">Workshop Pro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Workshop</p>
        {NAV.map(({ href, icon: Icon, label, highlight }) => {
          const isActive = path === href || (href !== '/workshop/dashboard' && path.startsWith(href) && href !== '/workshop/job-cards/new')
          return (
            <Link key={href} href={href} className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              highlight && !isActive
                ? 'border border-brand/20 bg-brand/10 text-brand hover:bg-brand/15'
                : isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
            )}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] p-3 space-y-0.5">
        <Link href="/workshop/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 hover:bg-white/[0.04] hover:text-white/70 transition-all">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

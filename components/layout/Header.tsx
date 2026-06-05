'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Sun, Moon, Menu, X, Check } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useShell } from '@/components/layout/WorkshopShell'
import { cn } from '@/lib/utils/cn'
import { useT } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface HeaderProps { title: string; subtitle?: string }

const MOCK_NOTIFICATIONS = [
  { id: '1', message: 'Job JC-2026-0001 status updated to Ready', time: '2m ago', read: false },
  { id: '2', message: 'New job card created: JC-2026-0002', time: '15m ago', read: false },
  { id: '3', message: 'Payment received for JC-2026-0001', time: '1h ago', read: true },
]

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const { setSidebarOpen } = useShell()
  const { t } = useT()
  const h = t.app.header
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm dark:border-white/[0.06] dark:bg-surface-900/80 lg:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/40 dark:hover:border-white/[0.15] dark:hover:text-white/70 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-xl tracking-wide text-gray-900 leading-none dark:text-white lg:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-white/30">{subtitle}</p>}
        </div>
      </div>

      {/* Right: language switcher, theme toggle, notifications, avatar */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher variant="app" />
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/40 dark:hover:border-white/[0.15] dark:hover:text-white/70"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/40 dark:hover:border-white/[0.15] dark:hover:text-white/70"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-black">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-surface-800">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{h.notifications}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-brand hover:text-brand/80 transition-colors">
                      {h.markAllRead}
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400 dark:text-white/30">{h.noNotifications}</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={cn(
                      'flex items-start gap-3 border-b border-gray-50 px-4 py-3 last:border-0 transition-colors dark:border-white/[0.03]',
                      n.read ? 'opacity-60' : 'bg-brand/5'
                    )}>
                      <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-gray-300 dark:bg-white/20' : 'bg-brand')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-relaxed dark:text-white/70">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-white/30">{n.time}</p>
                      </div>
                      {n.read && <Check className="h-3 w-3 shrink-0 text-gray-300 dark:text-white/20" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <Link href="/workshop/settings" className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition hover:bg-gray-100 dark:hover:bg-white/[0.04]">
          <div className="h-8 w-8 rounded-full bg-brand/20 ring-2 ring-brand/30 flex items-center justify-center">
            <span className="text-xs font-bold text-brand">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 dark:text-white/80">{session?.user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-gray-400 capitalize dark:text-white/30">{(session?.user as { role?: string })?.role ?? 'admin'}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}

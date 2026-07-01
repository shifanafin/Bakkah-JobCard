'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { Bell, Sun, Moon, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useShell } from '@/components/layout/WorkshopShell'
interface HeaderProps { title: string; subtitle?: string }

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const { setSidebarOpen } = useShell()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

      {/* Right: theme toggle, notifications, avatar */}
      <div className="flex items-center gap-2">
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
          </button>

          {/* Notifications dropdown */}
          {notifOpen && (
            <div className="absolute ltr:right-0 rtl:left-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/[0.08] dark:bg-surface-800">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="h-8 w-8 text-gray-200 dark:text-white/10 mb-3" />
                <p className="text-sm text-gray-400 dark:text-white/30">No notifications</p>
                <p className="text-xs text-gray-300 dark:text-white/20 mt-0.5">Job updates will appear here</p>
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
            <p className="text-[10px] text-gray-400 capitalize dark:text-white/30">{(session?.user as { role?: string } | undefined)?.role ?? 'admin'}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}

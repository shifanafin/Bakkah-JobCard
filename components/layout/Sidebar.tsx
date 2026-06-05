'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, ClipboardList, Plus, Settings,
  LogOut, Zap, ChevronRight, X, Briefcase, Package,
  Users, Megaphone, Wrench, Clock, MessageSquare, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useShell } from '@/components/layout/WorkshopShell'
import AttendanceWidget from '@/components/AttendanceWidget'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  highlight?: boolean
}

export default function Sidebar() {
  const path = usePathname()
  const { sidebarOpen, setSidebarOpen } = useShell()

  return (
    <>
      {/* Desktop sidebar: always visible on lg+ */}
      <aside className="hidden lg:flex h-full w-[220px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-white/[0.06] dark:bg-surface-950">
        <SidebarContent path={path} onClose={() => {}} showClose={false} />
      </aside>

      {/* Mobile sidebar: slide-in drawer */}
      <aside className={cn(
        'absolute inset-y-0 left-0 z-30 flex w-[220px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-white/[0.06] dark:bg-surface-950 lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent path={path} onClose={() => setSidebarOpen(false)} showClose />
      </aside>
    </>
  )
}

function SidebarContent({ path, onClose, showClose }: { path: string; onClose: () => void; showClose: boolean }) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? 'receptionist'

  const workshopNav: NavItem[] = []
  const adminNav: NavItem[] = []

  if (role === 'technician') {
    workshopNav.push(
      { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/workshop/my-jobs', icon: Briefcase, label: 'My Jobs' },
    )
  } else if (role === 'receptionist') {
    workshopNav.push(
      { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/workshop/job-cards', icon: ClipboardList, label: 'Job Cards' },
      { href: '/workshop/job-cards/new', icon: Plus, label: 'New Job Card', highlight: true },
    )
  } else if (role === 'supervisor') {
    workshopNav.push(
      { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/workshop/job-cards', icon: ClipboardList, label: 'Job Cards' },
      { href: '/workshop/inventory', icon: Package, label: 'Inventory' },
    )
  } else {
    // admin + manager
    workshopNav.push(
      { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/workshop/job-cards', icon: ClipboardList, label: 'Job Cards' },
      { href: '/workshop/job-cards/new', icon: Plus, label: 'New Job Card', highlight: true },
      { href: '/workshop/inventory', icon: Package, label: 'Inventory' },
    )
  }

  if (role === 'admin') {
    adminNav.push(
      { href: '/workshop/admin/employees', icon: Users, label: 'Employees' },
      { href: '/workshop/admin/technicians', icon: Wrench, label: 'Technicians' },
      { href: '/workshop/admin/attendance', icon: Clock, label: 'Attendance' },
      { href: '/workshop/admin/feedback', icon: MessageSquare, label: 'Feedback' },
      { href: '/workshop/admin/announcements', icon: Megaphone, label: 'Announcements' },
      { href: '/workshop/admin/analytics', icon: BarChart2, label: 'Analytics' },
    )
  }

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/30">
            <Zap className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="font-display text-lg leading-none tracking-wide text-gray-900 dark:text-white">AutoEdge</p>
            <p className="text-[10px] text-gray-400 leading-tight dark:text-white/30">Workshop Pro</p>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:text-white/30 dark:hover:bg-white/[0.06] dark:hover:text-white/60"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/25">Workshop</p>
        {workshopNav.map(({ href, icon: Icon, label, highlight }) => {
          const isActive = path === href || (href !== '/workshop/dashboard' && path.startsWith(href) && href !== '/workshop/job-cards/new')
          return (
            <Link key={href} href={href} onClick={onClose} className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              highlight && !isActive
                ? 'border border-brand/20 bg-brand/10 text-brand hover:bg-brand/15'
                : isActive
                  ? 'bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/80'
            )}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
            </Link>
          )
        })}

        {/* Admin section */}
        {adminNav.length > 0 && (
          <>
            <div className="my-2 px-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/25">Admin</p>
            </div>
            {adminNav.map(({ href, icon: Icon, label }) => {
              const isActive = path === href || path.startsWith(href)
              return (
                <Link key={href} href={href} onClick={onClose} className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/50 dark:hover:bg-white/[0.04] dark:hover:text-white/80'
                )}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-40" />}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Attendance widget — visible to technicians, supervisors, receptionists */}
      <div className="border-t border-gray-200 dark:border-white/[0.06] pt-3">
        <AttendanceWidget />
      </div>

      {/* Bottom */}
      <div className="p-3 space-y-0.5">
        <Link href="/workshop/settings" onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/70">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all dark:text-white/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  )
}

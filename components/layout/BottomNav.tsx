'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { LayoutDashboard, ClipboardList, Plus, Briefcase, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Item = { href: string; icon: React.ElementType; label: string; exact?: boolean; fab?: boolean; matchPrefix?: string }

export default function BottomNav() {
  const path = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? 'receptionist'

  const techItems: Item[] = [
    { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Home', exact: true },
    { href: '/workshop/my-jobs', icon: Briefcase, label: 'My Jobs', matchPrefix: '/workshop/my-jobs' },
    { href: '/workshop/settings', icon: MoreHorizontal, label: 'More', exact: true },
  ]

  const staffItems: Item[] = [
    { href: '/workshop/dashboard', icon: LayoutDashboard, label: 'Home', exact: true },
    { href: '/workshop/job-cards', icon: ClipboardList, label: 'Jobs', matchPrefix: '/workshop/job-cards' },
    { href: '/workshop/job-cards/new', icon: Plus, label: 'New', exact: true, fab: true },
    { href: '/workshop/customers', icon: Users, label: 'Customers', matchPrefix: '/workshop/customers' },
    { href: '/workshop/settings', icon: MoreHorizontal, label: 'More', exact: true },
  ]

  const items = role === 'technician' ? techItems : staffItems

  function isActive(item: Item) {
    if (item.exact) return path === item.href
    if (item.matchPrefix) {
      // Job cards: active for /workshop/job-cards/* EXCEPT /new (which has its own tab)
      if (item.matchPrefix === '/workshop/job-cards') {
        return path.startsWith('/workshop/job-cards') && path !== '/workshop/job-cards/new'
      }
      return path.startsWith(item.matchPrefix)
    }
    return false
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200/60 dark:border-white/[0.06] bg-white/96 dark:bg-[#0c0c0c]/96 backdrop-blur-2xl"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)' }}
    >
      <div className="flex items-center h-14">
        {items.map(item => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full transition-all duration-100 active:scale-90 active:opacity-70"
            >
              <div className={cn(
                'flex items-center justify-center rounded-xl transition-all duration-150',
                item.fab
                  ? cn('w-10 h-8 rounded-2xl shadow-lg shadow-brand/30', active ? 'bg-brand/80' : 'bg-brand')
                  : cn('w-10 h-6', active && 'bg-brand/10 dark:bg-brand/15')
              )}>
                <Icon className={cn(
                  'transition-all duration-150',
                  item.fab ? 'h-[18px] w-[18px] text-black' : active ? 'h-[18px] w-[18px] text-brand' : 'h-[18px] w-[18px] text-gray-400 dark:text-white/30'
                )} strokeWidth={item.fab ? 2.5 : active ? 2 : 1.8} />
              </div>
              <span className={cn(
                'text-[9px] font-semibold leading-none tracking-tight',
                item.fab
                  ? 'text-brand dark:text-brand'
                  : active ? 'text-brand' : 'text-gray-400 dark:text-white/25'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

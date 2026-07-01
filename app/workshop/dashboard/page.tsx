import { getServerSession } from '@/lib/server-session'
import Header from '@/components/layout/Header'
import { Car, ClipboardList, DollarSign, TrendingUp, Plus, ArrowRight, Clock, UserCheck, Wrench, ShieldCheck, CheckCircle, Users, Receipt, Bell, Globe, Tag, Megaphone, MessageSquare, Settings, Briefcase, CalendarClock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  try {
    const sb = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.slice(0, 7) + '-01'
    const [{ count: total }, { count: active }, { data: revenue }, { data: recent }, { data: statusRows }] = await Promise.all([
      sb.from('job_cards').select('*', { count: 'exact', head: true }),
      sb.from('job_cards').select('*', { count: 'exact', head: true }).in('status', ['pending', 'received', 'assigned', 'in_progress', 'qc_check', 'ready']),
      sb.from('job_cards').select('total').eq('payment_status', 'paid').gte('date_in', monthStart),
      sb.from('job_cards').select(`*, vehicle:vehicles(plate_number,make,model), customer:customers(name)`).order('created_at', { ascending: false }).limit(5),
      sb.from('job_cards').select('status').in('status', ['pending', 'received', 'assigned', 'in_progress', 'qc_check', 'ready']),
    ])
    const monthRevenue = (revenue || []).reduce((s: number, j: { total: number }) => s + (j.total || 0), 0)
    const counts: Record<string, number> = {}
    for (const row of statusRows || []) counts[row.status] = (counts[row.status] || 0) + 1
    const statusCounts = {
      pending: (counts.pending || 0) + (counts.received || 0),
      assigned: counts.assigned || 0,
      in_progress: counts.in_progress || 0,
      qc_check: counts.qc_check || 0,
      ready: counts.ready || 0,
    }
    return { total: total || 0, active: active || 0, monthRevenue, recent: recent || [], statusCounts }
  } catch {
    return { total: 0, active: 0, monthRevenue: 0, recent: [], statusCounts: { pending: 0, assigned: 0, in_progress: 0, qc_check: 0, ready: 0 } }
  }
}

async function getTechnicianStats(userId: string) {
  try {
    const sb = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const [{ count: myActive }, { count: myCompletedToday }, { data: myJobs }] = await Promise.all([
      sb.from('job_cards').select('*', { count: 'exact', head: true })
        .eq('technician_id', userId)
        .in('status', ['pending', 'received', 'assigned', 'in_progress', 'qc_check', 'ready']),
      sb.from('job_cards').select('*', { count: 'exact', head: true })
        .eq('technician_id', userId)
        .eq('status', 'delivered')
        .gte('date_in', today),
      sb.from('job_cards').select(`*, vehicle:vehicles(plate_number,make,model), customer:customers(name)`)
        .eq('technician_id', userId)
        .in('status', ['assigned', 'in_progress', 'qc_check', 'ready'])
        .order('created_at', { ascending: false })
        .limit(5),
    ])
    return { myActive: myActive || 0, myCompletedToday: myCompletedToday || 0, myJobs: myJobs || [] }
  } catch {
    return { myActive: 0, myCompletedToday: 0, myJobs: [] }
  }
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400', assigned: 'bg-blue-500/15 text-blue-300',
  received: 'bg-blue-500/15 text-blue-300', in_progress: 'bg-brand/15 text-brand',
  qc_check: 'bg-purple-500/15 text-purple-300', ready: 'bg-emerald-500/15 text-emerald-300',
  delivered: 'bg-zinc-500/15 text-zinc-400', cancelled: 'bg-red-500/15 text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', received: 'Received',
  in_progress: 'In Progress', qc_check: 'QC Check',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
}

export default async function DashboardPage() {
  const session = await getServerSession()
  const role = (session?.user as { role?: string })?.role ?? 'receptionist'
  const userId = session?.user?.id ?? ''

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  // Technician view
  if (role === 'technician') {
    const { myActive, myCompletedToday, myJobs } = await getTechnicianStats(userId)

    const techWidgets = [
      { href: '/workshop/my-jobs', icon: ClipboardList, label: 'My Jobs', color: 'text-brand', bg: 'bg-brand/10', highlight: true },
      { href: '/workshop/attendance', icon: CalendarClock, label: 'Attendance', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { href: '/workshop/job-cards', icon: Car, label: 'All Jobs', color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { href: '/workshop/my/leave', icon: Tag, label: 'Leave', color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { href: '/workshop/my/suggestions', icon: MessageSquare, label: 'Suggest', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
      { href: '/workshop/my/complaints', icon: Megaphone, label: 'Complaint', color: 'text-orange-500', bg: 'bg-orange-500/10' },
      { href: '/workshop/settings', icon: Settings, label: 'Settings', color: 'text-gray-500', bg: 'bg-gray-500/10 dark:bg-white/[0.06]' },
    ]

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
        <Header title="Dashboard" subtitle={`${greeting}, ${firstName}`} />

        {/* ── Mobile home screen ── */}
        <div className="sm:hidden px-4 pt-5 pb-28 space-y-5">
          {/* Greeting */}
          <div>
            <p className="text-xs text-gray-400 dark:text-white/30 font-medium uppercase tracking-wider">Bakkah Workshop</p>
            <h1 className="font-display text-2xl text-gray-900 dark:text-white tracking-wide mt-0.5">{greeting}, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
              {myActive > 0 ? `${myActive} active job${myActive !== 1 ? 's' : ''} assigned to you` : 'No active jobs — all clear!'}
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm">
              <p className="text-3xl font-bold text-brand tracking-tight">{myActive}</p>
              <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mt-0.5">Active Jobs</p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm">
              <p className="text-3xl font-bold text-emerald-500 tracking-tight">{myCompletedToday}</p>
              <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mt-0.5">Done Today</p>
            </div>
          </div>

          {/* Widget grid */}
          <div>
            <p className="text-xs text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest mb-3">Quick Access</p>
            <div className="grid grid-cols-4 gap-3">
              {techWidgets.map(({ href, icon: Icon, label, color, bg, highlight }) => (
                <Link key={href} href={href} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${bg} ${highlight ? 'shadow-brand/25 shadow-md' : ''}`}>
                    <Icon className={`h-6 w-6 ${color}`} strokeWidth={highlight ? 2.5 : 1.8} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 dark:text-white/60 text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* My recent jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest">My Jobs</p>
              <Link href="/workshop/my-jobs" className="text-xs text-brand font-semibold">View all →</Link>
            </div>
            {myJobs.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-6 text-center">
                <p className="text-sm text-gray-400 dark:text-white/30">No active jobs</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
                {myJobs.map((job: Record<string, unknown>) => (
                  <Link key={job.id as string} href={`/workshop/job-cards/${job.id}`}
                    className="flex items-center gap-3 p-3 active:bg-gray-50 dark:active:bg-white/[0.03] transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                      <Car className="h-4.5 w-4.5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand">{job.job_number as string}</span>
                        <span className={`badge border-transparent text-[9px] ${STATUS_COLOR[job.status as string] ?? ''}`}>
                          {STATUS_LABEL[job.status as string] ?? job.status as string}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {(job.vehicle as { plate_number?: string })?.plate_number}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/40 truncate">{(job.customer as { name?: string })?.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 dark:text-white/20 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop / tablet view ── */}
        <div className="hidden sm:block p-6 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-6">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand/5 blur-3xl" />
            <div className="relative">
              <p className="text-sm text-gray-500 mb-1 dark:text-white/50">Bakkah · My Dashboard</p>
              <h2 className="font-display text-3xl text-gray-900 tracking-wide dark:text-white">{greeting}, {firstName}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-white/40">
                {myActive > 0 ? `You have ${myActive} active job${myActive !== 1 ? 's' : ''} assigned to you.` : 'No active jobs assigned to you.'}
              </p>
              <Link href="/workshop/my-jobs" className="btn-primary mt-4 inline-flex">
                <ClipboardList className="h-4 w-4" /> My Jobs
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card group cursor-default">
              <div className="flex items-start justify-between">
                <div className="rounded-xl p-2.5 bg-brand/10">
                  <Car className="h-5 w-5 text-brand" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 tracking-tight dark:text-white">{myActive}</p>
                <p className="mt-0.5 text-sm font-medium text-gray-600 dark:text-white/60">My Active Jobs</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/30">In workshop now</p>
              </div>
            </div>
            <div className="card group cursor-default">
              <div className="flex items-start justify-between">
                <div className="rounded-xl p-2.5 bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 tracking-tight dark:text-white">{myCompletedToday}</p>
                <p className="mt-0.5 text-sm font-medium text-gray-600 dark:text-white/60">My Completed Today</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/30">Delivered today</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">My Active Jobs</h3>
              <Link href="/workshop/my-jobs" className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {myJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
                <p className="text-sm text-gray-400 dark:text-white/30">No active jobs assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myJobs.map((job: Record<string, unknown>) => (
                  <Link key={job.id as string} href={`/workshop/job-cards/${job.id}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-all hover:border-gray-200 hover:bg-gray-100 dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04]">
                      <Car className="h-4 w-4 text-gray-400 dark:text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-brand">{job.job_number as string}</span>
                        <span className={`badge ${STATUS_COLOR[job.status as string] ?? ''} border-transparent`}>
                          {STATUS_LABEL[job.status as string] ?? job.status as string}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                        {(job.vehicle as { plate_number?: string })?.plate_number} · {(job.vehicle as { make?: string })?.make} {(job.vehicle as { model?: string })?.model}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-white/40">{(job.customer as { name?: string })?.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 dark:text-white/20" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Employee Services — desktop */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Employee Services</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: '/workshop/attendance', icon: CalendarClock, label: 'Attendance', desc: 'Check in / out', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { href: '/workshop/my/leave', icon: Tag, label: 'Leave Requests', desc: 'Apply for leave', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { href: '/workshop/my/suggestions', icon: MessageSquare, label: 'Suggestions', desc: 'Share an idea', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { href: '/workshop/my/complaints', icon: Megaphone, label: 'Complaints', desc: 'Report an issue', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4 transition-all hover:border-gray-200 dark:hover:border-white/[0.1] hover:bg-gray-100 dark:hover:bg-white/[0.04]">
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Admin / Supervisor / Manager / Receptionist view
  const { total, active, monthRevenue, recent, statusCounts } = await getStats()
  const showRevenue = role !== 'receptionist' && role !== 'supervisor'
  const showStatusBreakdown = role === 'admin' || role === 'supervisor'

  const STATS = [
    { label: 'Total Jobs', value: total.toString(), icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10', delta: 'All time', show: true },
    { label: 'Active Jobs', value: active.toString(), icon: Car, color: 'text-brand', bg: 'bg-brand/10', delta: 'In workshop now', show: true },
    { label: 'Revenue (Month)', value: `AED ${monthRevenue.toLocaleString('en-AE', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', delta: 'Paid this month', show: showRevenue },
    { label: 'Completion Rate', value: total > 0 ? `${Math.round(((total - active) / total) * 100)}%` : '—', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', delta: 'Jobs delivered', show: showRevenue },
  ].filter(s => s.show)

  const STATUS_BREAKDOWN = [
    { label: 'Pending', value: statusCounts.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', href: '/workshop/job-cards?status=pending' },
    { label: 'Assigned', value: statusCounts.assigned, icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-500/10', href: '/workshop/job-cards?status=assigned' },
    { label: 'In Progress', value: statusCounts.in_progress, icon: Wrench, color: 'text-brand', bg: 'bg-brand/10', href: '/workshop/job-cards?status=in_progress' },
    { label: 'QC Check', value: statusCounts.qc_check, icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', href: '/workshop/job-cards?status=qc_check' },
    { label: 'Ready', value: statusCounts.ready, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', href: '/workshop/job-cards?status=ready' },
  ]

  const workshopWidgets = [
    { href: '/workshop/job-cards', icon: ClipboardList, label: 'Job Cards', color: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-500/15' },
    { href: '/workshop/job-cards/new', icon: Plus, label: 'New Job', color: 'text-black dark:text-black', bg: 'bg-brand', highlight: true },
    { href: '/workshop/customers', icon: Users, label: 'Customers', color: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-500/15' },
    { href: '/workshop/services', icon: Wrench, label: 'Services', color: 'text-emerald-500', bg: 'bg-emerald-500/10 dark:bg-emerald-500/15' },
    { href: '/workshop/admin/technicians', icon: UserCheck, label: 'Technicians', color: 'text-brand', bg: 'bg-brand/10 dark:bg-brand/15', show: role !== 'receptionist' },
    { href: '/workshop/transactions', icon: Receipt, label: 'Transactions', color: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/15' },
    { href: '/workshop/enquiries', icon: Bell, label: 'Enquiries', color: 'text-orange-500', bg: 'bg-orange-500/10 dark:bg-orange-500/15' },
    { href: '/workshop/admin/attendance', icon: Clock, label: 'Attendance', color: 'text-indigo-500', bg: 'bg-indigo-500/10 dark:bg-indigo-500/15', show: role === 'admin' },
    { href: '/workshop/admin/employees', icon: Briefcase, label: 'Employees', color: 'text-teal-500', bg: 'bg-teal-500/10 dark:bg-teal-500/15', show: role === 'admin' },
    { href: '/workshop/admin/feedback', icon: MessageSquare, label: 'Feedback', color: 'text-pink-500', bg: 'bg-pink-500/10 dark:bg-pink-500/15', show: role === 'admin' },
    { href: '/workshop/admin/announcements', icon: Megaphone, label: 'Notices', color: 'text-cyan-500', bg: 'bg-cyan-500/10 dark:bg-cyan-500/15', show: role === 'admin' },
    { href: '/workshop/admin/website', icon: Globe, label: 'Website', color: 'text-violet-500', bg: 'bg-violet-500/10 dark:bg-violet-500/15', show: role === 'admin' },
    { href: '/workshop/admin/promotions', icon: Tag, label: 'Promotions', color: 'text-rose-500', bg: 'bg-rose-500/10 dark:bg-rose-500/15', show: role === 'admin' },
    { href: '/workshop/settings', icon: Settings, label: 'Settings', color: 'text-gray-500', bg: 'bg-gray-500/10 dark:bg-white/[0.06]' },
  ].filter(w => w.show !== false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Dashboard" subtitle={`${greeting}, ${firstName}`} />

      {/* ── Mobile home screen (hidden on sm+) ── */}
      <div className="sm:hidden px-4 pt-5 pb-28 space-y-5">
        {/* Greeting */}
        <div>
          <p className="text-xs text-gray-400 dark:text-white/30 font-medium uppercase tracking-wider">Bakkah Workshop</p>
          <h1 className="font-display text-2xl text-gray-900 dark:text-white tracking-wide mt-0.5">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
            {active > 0 ? `${active} active job${active !== 1 ? 's' : ''} in workshop` : 'All clear — ready for new vehicles'}
          </p>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm">
            <p className="text-3xl font-bold text-brand tracking-tight">{active}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mt-0.5">Active Jobs</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-4 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{total}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mt-0.5">Total Jobs</p>
          </div>
        </div>

        {/* Navigation widget grid */}
        <div>
          <p className="text-xs text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest mb-3">Quick Access</p>
          <div className="grid grid-cols-4 gap-3">
            {workshopWidgets.map(({ href, icon: Icon, label, color, bg, highlight }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${bg} ${highlight ? 'shadow-brand/30 shadow-md' : ''}`}>
                  <Icon className={`h-6 w-6 ${color}`} strokeWidth={highlight ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-semibold text-gray-600 dark:text-white/60 text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 dark:text-white/30 font-bold uppercase tracking-widest">Recent Jobs</p>
            <Link href="/workshop/job-cards" className="text-xs text-brand font-semibold">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] p-6 text-center">
              <p className="text-sm text-gray-400 dark:text-white/30">No recent jobs</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-surface-800 border border-gray-100 dark:border-white/[0.06] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
              {recent.map((job: Record<string, unknown>) => (
                <Link key={job.id as string} href={`/workshop/job-cards/${job.id}`}
                  className="flex items-center gap-3 p-3 active:bg-gray-50 dark:active:bg-white/[0.03] transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                    <Car className="h-4.5 w-4.5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand">{job.job_number as string}</span>
                      <span className={`badge border-transparent text-[9px] ${STATUS_COLOR[job.status as string] ?? ''}`}>
                        {STATUS_LABEL[job.status as string] ?? job.status as string}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {(job.vehicle as { plate_number?: string })?.plate_number}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/40 truncate">{(job.customer as { name?: string })?.name}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-white/20 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop / tablet view (hidden on mobile) ── */}
      <div className="hidden sm:block p-6 space-y-6">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-6">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-gray-500 mb-1 dark:text-white/50">Bakkah · Workshop Management</p>
            <h2 className="font-display text-3xl text-gray-900 tracking-wide dark:text-white">{greeting}, {firstName}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-white/40">
              {active > 0 ? `You have ${active} active job${active !== 1 ? 's' : ''} in the workshop today.` : 'No active jobs — ready for new vehicles!'}
            </p>
            {role !== 'supervisor' && (
              <Link href="/workshop/job-cards/new" className="btn-primary mt-4 inline-flex">
                <Plus className="h-4 w-4" /> New Job Card
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={`grid gap-4 ${showRevenue ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
          {STATS.map(({ label, value, icon: Icon, color, bg, delta }) => (
            <div key={label} className="card group cursor-default hover:border-gray-200 dark:hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 tracking-tight dark:text-white">{value}</p>
                <p className="mt-0.5 text-sm font-medium text-gray-600 dark:text-white/60">{label}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/30">{delta}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status breakdown — admin / supervisor only */}
        {showStatusBreakdown && (
          <div className="card">
            <h3 className="section-title mb-4">Live Status Breakdown</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {STATUS_BREAKDOWN.map(({ label, value, icon: Icon, color, bg, href }) => (
                <Link key={label} href={href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center transition-all hover:border-gray-200 hover:bg-gray-100 dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-white/40">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Jobs */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Recent Job Cards</h3>
            <Link href="/workshop/job-cards" className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
              <p className="text-sm text-gray-400 dark:text-white/30">No job cards yet.</p>
              <Link href="/workshop/job-cards/new" className="mt-3 text-xs text-brand hover:underline">Create the first one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((job: Record<string, unknown>) => (
                <Link key={job.id as string} href={`/workshop/job-cards/${job.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-all hover:border-gray-200 hover:bg-gray-100 dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <Car className="h-4 w-4 text-gray-400 dark:text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-brand">{job.job_number as string}</span>
                      <span className={`badge ${STATUS_COLOR[job.status as string] ?? ''} border-transparent`}>
                        {STATUS_LABEL[job.status as string] ?? job.status as string}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {(job.vehicle as { plate_number?: string })?.plate_number} · {(job.vehicle as { make?: string })?.make} {(job.vehicle as { model?: string })?.model}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-white/40">{(job.customer as { name?: string })?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300 hover:text-gray-500 dark:text-white/20 dark:hover:text-white/50">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

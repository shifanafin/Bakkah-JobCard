import { getServerSession } from '@/lib/server-session'
import Header from '@/components/layout/Header'
import { Car, ClipboardList, DollarSign, TrendingUp, Plus, ArrowRight, Clock, UserCheck, Wrench, ShieldCheck, CheckCircle } from 'lucide-react'
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

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
        <Header title="Dashboard" subtitle={`${greeting}, ${firstName}`} />
        <div className="p-6 space-y-6">
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Dashboard" subtitle={`${greeting}, ${firstName}`} />

      <div className="p-6 space-y-6">
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

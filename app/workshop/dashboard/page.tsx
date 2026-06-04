import { auth } from '@/app/auth'
import Header from '@/components/layout/Header'
import { Car, ClipboardList, DollarSign, TrendingUp, Plus, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  try {
    const sb = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.slice(0, 7) + '-01'
    const [{ count: total }, { count: active }, { data: revenue }, { data: recent }] = await Promise.all([
      sb.from('job_cards').select('*', { count: 'exact', head: true }),
      sb.from('job_cards').select('*', { count: 'exact', head: true }).in('status', ['received', 'in_progress', 'qc_check', 'ready']),
      sb.from('job_cards').select('total').eq('payment_status', 'paid').gte('date_in', monthStart),
      sb.from('job_cards').select(`*, vehicle:vehicles(plate_number,make,model), customer:customers(name)`).order('created_at', { ascending: false }).limit(5),
    ])
    const monthRevenue = (revenue || []).reduce((s: number, j: { total: number }) => s + (j.total || 0), 0)
    return { total: total || 0, active: active || 0, monthRevenue, recent: recent || [] }
  } catch {
    return { total: 0, active: 0, monthRevenue: 0, recent: [] }
  }
}

const STATUS_COLOR: Record<string, string> = {
  received: 'bg-blue-500/15 text-blue-300', in_progress: 'bg-brand/15 text-brand',
  qc_check: 'bg-purple-500/15 text-purple-300', ready: 'bg-emerald-500/15 text-emerald-300',
  delivered: 'bg-zinc-500/15 text-zinc-400', cancelled: 'bg-red-500/15 text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  received: 'Received', in_progress: 'In Progress', qc_check: 'QC Check',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
}

export default async function DashboardPage() {
  const session = await auth()
  const { total, active, monthRevenue, recent } = await getStats()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const STATS = [
    { label: 'Total Jobs', value: total.toString(), icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10', delta: 'All time' },
    { label: 'Active Jobs', value: active.toString(), icon: Car, color: 'text-brand', bg: 'bg-brand/10', delta: 'In workshop now' },
    { label: 'Revenue (Month)', value: `AED ${monthRevenue.toLocaleString('en-AE', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', delta: 'Paid this month' },
    { label: 'Completion Rate', value: total > 0 ? `${Math.round(((total - active) / total) * 100)}%` : '—', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', delta: 'Jobs delivered' },
  ]

  return (
    <div className="min-h-screen bg-surface-900">
      <Header title="Dashboard" subtitle={`${greeting}, ${session?.user?.name?.split(' ')[0] ?? 'there'}`} />

      <div className="p-6 space-y-6">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-6">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-white/50 mb-1">AutoEdge Pro · Workshop Management</p>
            <h2 className="font-display text-3xl text-white tracking-wide">{greeting}, {session?.user?.name?.split(' ')[0] ?? 'there'} 👋</h2>
            <p className="mt-2 text-sm text-white/40">
              {active > 0 ? `You have ${active} active job${active !== 1 ? 's' : ''} in the workshop today.` : 'No active jobs — ready for new vehicles!'}
            </p>
            <Link href="/workshop/job-cards/new" className="btn-primary mt-4 inline-flex">
              <Plus className="h-4 w-4" /> New Job Card
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map(({ label, value, icon: Icon, color, bg, delta }) => (
            <div key={label} className="card group cursor-default hover:border-white/[0.12] transition-all">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <p className="mt-0.5 text-sm font-medium text-white/60">{label}</p>
                <p className="mt-1 text-xs text-white/30">{delta}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Job Cards</h3>
            <Link href="/workshop/job-cards" className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-10 w-10 text-white/10 mb-3" />
              <p className="text-sm text-white/30">No job cards yet.</p>
              <Link href="/workshop/job-cards/new" className="mt-3 text-xs text-brand hover:underline">Create the first one →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((job: Record<string, unknown>) => (
                <Link key={job.id as string} href={`/workshop/job-cards/${job.id}`}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                    <Car className="h-4 w-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-brand">{job.job_number as string}</span>
                      <span className={`badge ${STATUS_COLOR[job.status as string] ?? ''} border-transparent`}>
                        {STATUS_LABEL[job.status as string] ?? job.status as string}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">
                      {(job.vehicle as { plate_number?: string })?.plate_number} · {(job.vehicle as { make?: string })?.make} {(job.vehicle as { model?: string })?.model}
                    </p>
                    <p className="text-xs text-white/40">{(job.customer as { name?: string })?.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-white/20 hover:text-white/50">
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

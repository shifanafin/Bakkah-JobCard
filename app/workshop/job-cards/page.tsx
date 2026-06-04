'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { getJobCards } from '@/lib/queries'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR, JOB_TYPE_LABEL, PAYMENT_STATUS_COLOR, type JobCard, type JobStatus } from '@/types'
import { Plus, Search, FileSpreadsheet, Car, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatAED, formatDate } from '@/lib/utils/format'
import * as XLSX from 'xlsx'

const TABS: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'qc_check', label: 'QC Check' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
]

export default function JobCardsPage() {
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<JobStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setJobs(await getJobCards({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })) }
    finally { setLoading(false) }
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const filtered = jobs
    .filter(j => status === 'all' || j.status === status)
    .filter(j => !search.trim() || [j.vehicle?.plate_number, j.customer?.name, j.job_number, j.customer?.phone].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  function exportExcel() {
    const rows = filtered.map(j => ({
      'Job #': j.job_number, 'Date In': j.date_in, 'Status': JOB_STATUS_LABEL[j.status],
      'Type': JOB_TYPE_LABEL[j.job_type], 'Customer': j.customer?.name, 'Phone': j.customer?.phone,
      'Company': j.customer?.company_name ?? '', 'Plate': j.vehicle?.plate_number,
      'Make': j.vehicle?.make, 'Model': j.vehicle?.model, 'Year': j.vehicle?.year ?? '',
      'Technician': j.technician?.name ?? '', 'Subtotal (AED)': j.subtotal,
      'VAT 5% (AED)': j.vat_amount, 'Discount (AED)': j.discount, 'Total (AED)': j.total,
      'Payment': j.payment_status, 'Method': j.payment_method ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 16 }))

    const vatRows = [
      { 'Metric': 'Total Jobs', 'Amount': filtered.length },
      { 'Metric': 'Total Subtotal (AED)', 'Amount': filtered.reduce((s, j) => s + j.subtotal, 0).toFixed(2) },
      { 'Metric': 'Total VAT 5% (AED)', 'Amount': filtered.reduce((s, j) => s + j.vat_amount, 0).toFixed(2) },
      { 'Metric': 'Total Discount (AED)', 'Amount': filtered.reduce((s, j) => s + j.discount, 0).toFixed(2) },
      { 'Metric': 'Grand Total (AED)', 'Amount': filtered.reduce((s, j) => s + j.total, 0).toFixed(2) },
      { 'Metric': 'Paid Jobs', 'Amount': filtered.filter(j => j.payment_status === 'paid').length },
    ]
    const ws2 = XLSX.utils.json_to_sheet(vatRows)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Job Cards')
    XLSX.utils.book_append_sheet(wb, ws2, 'VAT Summary')
    XLSX.writeFile(wb, `AutoEdge_Jobs_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const counts = TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] = tab.value === 'all' ? jobs.length : jobs.filter(j => j.status === tab.value).length
    return acc
  }, {})

  const revenue = jobs.filter(j => j.payment_status === 'paid').reduce((s, j) => s + j.total, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Job Cards" subtitle="Workshop job management" />

      <div className="p-4 space-y-5 lg:p-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Plate, customer, job #..."
                className="input-base w-56 pl-9 lg:w-64"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-base w-36" />
            <span className="text-xs text-gray-400 dark:text-white/30">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-base w-36" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="btn-ghost border-emerald-600/30 bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" /> Export
            </button>
            <Link href="/workshop/job-cards/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New Job Card
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total Jobs', value: jobs.length, color: 'text-gray-900 dark:text-white' },
            { label: 'In Progress', value: counts['in_progress'] || 0, color: 'text-brand' },
            { label: 'Ready', value: counts['ready'] || 0, color: 'text-emerald-500 dark:text-emerald-400' },
            { label: 'Paid Revenue', value: formatAED(revenue), color: 'text-brand' },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1.5 overflow-x-auto dark:border-white/[0.06] dark:bg-surface-800">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatus(tab.value)}
              className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                status === tab.value ? 'bg-brand text-black' : 'text-gray-500 hover:text-gray-800 dark:text-white/40 dark:hover:text-white/70'
              )}>
              {tab.label}
              <span className={cn('rounded-full px-1.5 py-px text-[10px] font-bold',
                status === tab.value ? 'bg-black/20' : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/40'
              )}>{counts[tab.value]}</span>
            </button>
          ))}
        </div>

        {/* Table — desktop */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand dark:border-white/10" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Car className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
              <p className="text-sm text-gray-400 dark:text-white/30">No job cards found.</p>
              <Link href="/workshop/job-cards/new" className="mt-2 text-xs text-brand hover:underline">Create one →</Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                      {['Job #', 'Vehicle', 'Customer', 'Type', 'Date In', 'Status', 'Total', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {filtered.map(job => (
                      <tr key={job.id} className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-brand">{job.job_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-gray-900 tracking-wider dark:text-white">{job.vehicle?.plate_number}</p>
                          <p className="text-xs text-gray-400 dark:text-white/40">{job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900 dark:text-white">{job.customer?.name}</p>
                          <p className="text-xs text-gray-400 dark:text-white/40">{job.customer?.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-white/50">{JOB_TYPE_LABEL[job.job_type]}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-white/50">{formatDate(job.date_in)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('badge', JOB_STATUS_COLOR[job.status])}>{JOB_STATUS_LABEL[job.status]}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{formatAED(job.total)}</p>
                          <p className={cn('text-xs capitalize', PAYMENT_STATUS_COLOR[job.payment_status])}>{job.payment_status}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/workshop/job-cards/${job.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 transition hover:border-brand/30 hover:text-brand dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50">
                            <Eye className="h-3.5 w-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
                {filtered.map(job => (
                  <Link key={job.id} href={`/workshop/job-cards/${job.id}`}
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04]">
                      <Car className="h-5 w-5 text-gray-400 dark:text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-brand">{job.job_number}</span>
                        <span className={cn('badge text-[10px]', JOB_STATUS_COLOR[job.status])}>{JOB_STATUS_LABEL[job.status]}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 tracking-wider dark:text-white">{job.vehicle?.plate_number}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50">{job.vehicle?.make} {job.vehicle?.model} · {job.customer?.name}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-xs text-gray-400 dark:text-white/40">{formatDate(job.date_in)}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatAED(job.total)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useSession } from '@/lib/auth-client'
import { getJobCards } from '@/lib/queries'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR, JOB_TYPE_LABEL, PAYMENT_STATUS_COLOR, type JobCard, type JobStatus, type JobSource } from '@/types'
import { Plus, Search, FileSpreadsheet, Car, Eye, X, Trash2, CheckSquare, Square, Upload, Download, Loader2, AlertCircle, CheckCircle2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatAED, formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 20

const SOURCE_BADGE: Record<JobSource, { label: string; className: string }> = {
  application: { label: 'Workshop', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  website_chat: { label: 'Website', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  import:       { label: 'Import',  className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

function SourceBadge({ source }: { source?: JobSource | null }) {
  if (!source) return null
  const s = SOURCE_BADGE[source]
  if (!s) return null
  return (
    <span className={cn('inline-block rounded border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider', s.className)}>
      {s.label}
    </span>
  )
}

const TABS: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'waiting_for_approval', label: 'Awaiting Approval' },
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'qc_check', label: 'QC Check' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
]

export default function JobCardsPage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? ''
  const canDelete = role === 'admin' || role === 'supervisor'

  const [jobs, setJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<JobStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setJobs(await getJobCards({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })) }
    finally { setLoading(false) }
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const filtered = jobs
    .filter(j => status === 'all' || j.status === status)
    .filter(j => !search.trim() || [j.vehicle?.plate_number, j.customer?.name, j.job_number, j.customer?.phone].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageIds = paginated.map(j => j.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id))
  const someSelected = selectedIds.size > 0

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        pageIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedIds(prev => new Set([...prev, ...pageIds]))
    }
  }

  async function handleBulkDelete() {
    if (!someSelected) return
    const count = selectedIds.size
    const confirmed = window.confirm(`Delete ${count} job card${count > 1 ? 's' : ''}?\n\nThis cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)
    const ids = [...selectedIds]
    let failed = 0
    for (const id of ids) {
      const res = await fetch(`/api/job-cards/${id}`, { method: 'DELETE' })
      if (!res.ok) failed++
    }
    setDeleting(false)
    setSelectedIds(new Set())
    await load()
    if (failed === 0) toast.success(`${count} job card${count > 1 ? 's' : ''} deleted`)
    else toast.error(`${failed} deletion${failed > 1 ? 's' : ''} failed`)
  }

  async function handleDeleteSingle(jobId: string) {
    const confirmed = window.confirm('Delete this job card?\n\nThis cannot be undone.')
    if (!confirmed) return
    setDeleting(true)
    const res = await fetch(`/api/job-cards/${jobId}`, { method: 'DELETE' })
    setDeleting(false)
    await load()
    if (res.ok) toast.success('Job card deleted')
    else toast.error('Delete failed')
  }

  function exportExcel() {
    const rows = filtered.map(j => ({
      'Job #': j.job_number, 'Date In': j.date_in, 'Status': JOB_STATUS_LABEL[j.status],
      'Type': JOB_TYPE_LABEL[j.job_type] ?? j.job_type, 'Customer': j.customer?.name, 'Phone': j.customer?.phone,
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
    XLSX.writeFile(wb, `Bakkah_Jobs_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ── Import state ─────────────────────────────────────────────
  const [showImport, setShowImport] = useState(false)
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; failed: number; results: { row: number; job_number?: string; error?: string }[] } | null>(null)

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Customer Name', 'Customer Phone', 'Plate Number', 'Vehicle Make', 'Vehicle Model', 'Vehicle Year', 'Job Type', 'Date In', 'Customer Complaint'],
      ['Ahmed Al Mansouri', '+971501234567', 'A12345', 'Toyota', 'Camry', '2021', 'Service', new Date().toISOString().split('T')[0], 'Oil change required'],
    ])
    ws['!cols'] = Array(9).fill({ wch: 20 })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Job Cards Import')
    XLSX.writeFile(wb, 'Bakkah_JobCards_Import_Template.xlsx')
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        setImportRows(data)
        setImportResult(null)
      } catch { toast.error('Failed to parse file') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (importRows.length === 0) return
    setImporting(true)
    setImportResult(null)
    try {
      const rows = importRows.map(r => ({
        customer_name: r['Customer Name'] ?? r['customer_name'] ?? '',
        customer_phone: r['Customer Phone'] ?? r['customer_phone'] ?? '',
        plate_number: r['Plate Number'] ?? r['plate_number'] ?? '',
        make: r['Vehicle Make'] ?? r['make'] ?? '',
        model: r['Vehicle Model'] ?? r['model'] ?? '',
        year: r['Vehicle Year'] ?? r['year'] ?? '',
        job_type: r['Job Type'] ?? r['job_type'] ?? '',
        date_in: r['Date In'] ?? r['date_in'] ?? '',
        customer_complaint: r['Customer Complaint'] ?? r['customer_complaint'] ?? '',
      }))
      const res = await fetch('/api/job-cards/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setImportResult(d)
      if (d.created > 0) { await load(); toast.success(`${d.created} job card${d.created !== 1 ? 's' : ''} imported`) }
      if (d.failed > 0) toast.error(`${d.failed} row${d.failed !== 1 ? 's' : ''} failed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally { setImporting(false) }
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/25" />
              <input
                value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Plate, customer, job #..."
                className="input-base w-56 pl-9 lg:w-64"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-base w-36" />
            <span className="text-xs text-gray-400 dark:text-white/30">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-base w-36" />
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk delete — visible when items are selected */}
            {canDelete && someSelected && (
              <button onClick={handleBulkDelete} disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
                Delete ({selectedIds.size})
              </button>
            )}
            <button onClick={exportExcel} className="btn-ghost border-emerald-600/30 bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" /> Export
            </button>
            <button onClick={() => { setShowImport(true); setImportRows([]); setImportResult(null) }}
              className="btn-ghost border-blue-600/30 bg-blue-500/8 text-blue-600 hover:bg-blue-500/15 dark:text-blue-400">
              <Upload className="h-4 w-4" /> Import
            </button>
            <Link href="/workshop/job-cards/new" className="btn-primary">
              <Plus className="h-4 w-4" /> New Job Card
            </Link>
          </div>
        </div>

        {/* ── Import modal ── */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-surface-800 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-brand" />
                  <h2 className="font-bold text-gray-900 dark:text-white">Import Job Cards</h2>
                </div>
                <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Template download */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Download Template</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">Fill in the Excel template then upload it below</p>
                  </div>
                  <button onClick={downloadTemplate}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white dark:bg-white/[0.05] dark:border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 transition-colors">
                    <Download className="h-3.5 w-3.5" /> Template
                  </button>
                </div>

                {/* File upload */}
                <div>
                  <label className="label">Upload Excel / CSV File</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-6 hover:border-brand/40 transition-colors">
                    <Upload className="h-6 w-6 text-gray-300 dark:text-white/20" />
                    <span className="text-sm text-gray-500 dark:text-white/40">Click to select file (.xlsx, .csv)</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>

                {/* Preview */}
                {importRows.length > 0 && !importResult && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-2 uppercase tracking-wide">
                      Preview — {importRows.length} row{importRows.length !== 1 ? 's' : ''}
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-white/[0.03]">
                            {['Customer Name', 'Phone', 'Plate', 'Make', 'Model', 'Job Type', 'Date In'].map(h => (
                              <th key={h} className="px-2 py-2 text-left font-bold text-gray-400 dark:text-white/30 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                          {importRows.slice(0, 8).map((row, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1.5 text-gray-700 dark:text-white/70">{row['Customer Name'] ?? row['customer_name']}</td>
                              <td className="px-2 py-1.5 text-gray-500 dark:text-white/50">{row['Customer Phone'] ?? row['customer_phone']}</td>
                              <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-white/70">{row['Plate Number'] ?? row['plate_number']}</td>
                              <td className="px-2 py-1.5 text-gray-500 dark:text-white/50">{row['Vehicle Make'] ?? row['make']}</td>
                              <td className="px-2 py-1.5 text-gray-500 dark:text-white/50">{row['Vehicle Model'] ?? row['model']}</td>
                              <td className="px-2 py-1.5 text-gray-500 dark:text-white/50">{row['Job Type'] ?? row['job_type']}</td>
                              <td className="px-2 py-1.5 text-gray-500 dark:text-white/50">{row['Date In'] ?? row['date_in']}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importRows.length > 8 && (
                        <p className="px-3 py-2 text-xs text-gray-400 dark:text-white/30">+{importRows.length - 8} more rows</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Results */}
                {importResult && (
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      {importResult.created > 0 && (
                        <div className="flex-1 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{importResult.created} imported</span>
                        </div>
                      )}
                      {importResult.failed > 0 && (
                        <div className="flex-1 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{importResult.failed} failed</span>
                        </div>
                      )}
                    </div>
                    {importResult.results.filter(r => r.error).map(r => (
                      <p key={r.row} className="text-xs text-red-500">Row {r.row}: {r.error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 border-t border-gray-100 dark:border-white/[0.06] px-5 py-4">
                {importRows.length > 0 && !importResult && (
                  <button onClick={handleImport} disabled={importing}
                    className="btn-primary flex-1 gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Import {importRows.length} Row{importRows.length !== 1 ? 's' : ''}
                  </button>
                )}
                <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null) }}
                  className="btn-ghost">
                  {importResult ? 'Close' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

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
            <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); setSelectedIds(new Set()) }}
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

        {/* Table + Pagination */}
        <div className="space-y-3">
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
                        {canDelete && (
                          <th className="w-10 px-3 py-3">
                            <button onClick={toggleSelectAll}
                              className="flex items-center justify-center text-gray-400 hover:text-brand dark:text-white/30 dark:hover:text-brand transition-colors">
                              {allPageSelected
                                ? <CheckSquare className="h-4 w-4 text-brand" />
                                : <Square className="h-4 w-4" />}
                            </button>
                          </th>
                        )}
                        {['Job #', 'Vehicle', 'Customer', 'Type', 'Date In', 'Status', 'Total', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                      {paginated.map(job => {
                        const isSelected = selectedIds.has(job.id)
                        const isDelivered = job.status === 'delivered'
                        return (
                          <tr key={job.id}
                            className={cn('group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]',
                              isSelected && 'bg-brand/5 dark:bg-brand/10'
                            )}>
                            {canDelete && (
                              <td className="w-10 px-3 py-3">
                                {!isDelivered && (
                                  <button onClick={() => toggleSelect(job.id)}
                                    className="flex items-center justify-center text-gray-300 hover:text-brand dark:text-white/20 dark:hover:text-brand transition-colors">
                                    {isSelected
                                      ? <CheckSquare className="h-4 w-4 text-brand" />
                                      : <Square className="h-4 w-4" />}
                                  </button>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs font-semibold text-brand">{job.job_number}</span>
                              <div className="mt-1"><SourceBadge source={job.source} /></div>
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
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/workshop/job-cards/${job.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 transition hover:border-brand/30 hover:text-brand dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50">
                                  <Eye className="h-3.5 w-3.5" /> View
                                </Link>
                                {!isDelivered && (
                                  <Link href={`/workshop/job-cards/${job.id}/edit`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-500 transition hover:border-brand/30 hover:text-brand dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50">
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                  </Link>
                                )}
                                {canDelete && !isDelivered && (
                                  <button onClick={() => handleDeleteSingle(job.id)} disabled={deleting}
                                    className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-xs text-red-400 transition hover:bg-red-100 hover:text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20 disabled:opacity-50">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {paginated.map(job => {
                    const isSelected = selectedIds.has(job.id)
                    const isDelivered = job.status === 'delivered'
                    return (
                      <div key={job.id}
                        className={cn('flex items-start gap-3 p-4 transition-colors', isSelected && 'bg-brand/5 dark:bg-brand/10')}>
                        {canDelete && !isDelivered && (
                          <button onClick={() => toggleSelect(job.id)}
                            className="mt-0.5 shrink-0 text-gray-300 hover:text-brand dark:text-white/20 dark:hover:text-brand transition-colors">
                            {isSelected ? <CheckSquare className="h-4.5 w-4.5 text-brand" /> : <Square className="h-4.5 w-4.5" />}
                          </button>
                        )}
                        <Link href={`/workshop/job-cards/${job.id}`} className="flex flex-1 items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04]">
                            <Car className="h-5 w-5 text-gray-400 dark:text-white/40" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-brand">{job.job_number}</span>
                                <SourceBadge source={job.source} />
                              </div>
                              <span className={cn('badge text-[10px]', JOB_STATUS_COLOR[job.status])}>{JOB_STATUS_LABEL[job.status]}</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 tracking-wider dark:text-white">{job.vehicle?.plate_number}</p>
                            <p className="text-xs text-gray-500 dark:text-white/50">{job.vehicle?.make} {job.vehicle?.model} · {job.customer?.name}</p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <p className="text-xs text-gray-400 dark:text-white/40">{formatDate(job.date_in)}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={cn('text-[10px] font-semibold capitalize', PAYMENT_STATUS_COLOR[job.payment_status])}>{job.payment_status}</span>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatAED(job.total)}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

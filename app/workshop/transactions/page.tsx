'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { FileText, Receipt, ClipboardList, Loader2, ChevronDown, ChevronUp, Upload, Download, X, AlertCircle, CheckCircle2, Plus, ArrowRightCircle, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import RowActionsMenu from '@/components/ui/RowActionsMenu'
import { formatAED, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import JobCardPicker from '@/components/job-card/JobCardPicker'
import type { JobCard } from '@/types'

type JobRef = {
  job_number: string
  status: string
  customer?: { name: string; phone: string } | null
  vehicle?: { model: string; plate_number: string } | null
}

type Quotation = {
  id: string
  quotation_number: string
  status: 'draft' | 'sent' | 'approved' | 'declined'
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  created_at: string
  job_card_id: string
  job_card?: JobRef | null
  has_proforma?: boolean
}

type Proforma = {
  id: string
  proforma_number: string
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  invoice_date: string
  created_at: string
  job_card_id: string
  job_card?: JobRef | null
  has_tax_invoice?: boolean
}

type TaxInvoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'issued' | 'paid'
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  invoice_date: string
  created_at: string
  job_card_id: string
  job_card?: JobRef | null
}

const QUOTATION_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/50' },
  sent: { label: 'Awaiting', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  declined: { label: 'Declined', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
}

const TAX_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  issued: { label: 'Issued', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  paid: { label: 'Paid', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' },
}

type Tab = 'quotations' | 'proformas' | 'tax'

type SortKey = 'date' | 'total' | 'number'
type SortDir = 'asc' | 'desc'

export default function TransactionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as { role?: string })?.role ?? ''

  const [tab, setTab] = useState<Tab>('quotations')
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [proformas, setProformas] = useState<Proforma[]>([])
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // ── Create new document / convert existing ──────────────────────
  const [showPicker, setShowPicker] = useState<Tab | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmProforma, setConfirmProforma] = useState<Quotation | null>(null)
  const [confirmTaxConvert, setConfirmTaxConvert] = useState<Proforma | null>(null)
  const [confirmMarkPaid, setConfirmMarkPaid] = useState<TaxInvoice | null>(null)

  // ── Delete ────────────────────────────────────────────────────
  type DeleteTarget = { kind: 'quotation' | 'proforma' | 'tax'; id: string; number: string }
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const DELETE_ENDPOINT: Record<DeleteTarget['kind'], string> = {
    quotation: '/api/quotations',
    proforma: '/api/proforma-invoices',
    tax: '/api/tax-invoices',
  }

  async function doDelete() {
    if (!deleteTarget) return
    const { kind, id } = deleteTarget
    setDeletingId(id)
    try {
      const res = await fetch(`${DELETE_ENDPOINT[kind]}/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to delete'); setDeletingId(null); return }
      if (kind === 'quotation') setQuotations(rows => rows.filter(r => r.id !== id))
      if (kind === 'proforma') setProformas(rows => rows.filter(r => r.id !== id))
      if (kind === 'tax') setTaxInvoices(rows => rows.filter(r => r.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const TAB_META: Record<Tab, { pickerTitle: string; newLabel: string; endpoint: string; path: string }> = {
    quotations: { pickerTitle: 'Select a job card for the new quotation', newLabel: 'New Quotation', endpoint: '/api/quotations', path: 'quotation' },
    proformas: { pickerTitle: 'Select a job card for the new proforma', newLabel: 'New Proforma', endpoint: '/api/proforma-invoices', path: 'proforma' },
    tax: { pickerTitle: 'Select a job card for the new tax invoice', newLabel: 'New Tax Invoice', endpoint: '/api/tax-invoices', path: 'tax-invoice' },
  }

  async function handlePickJobCard(jc: JobCard) {
    const meta = TAB_META[showPicker as Tab]
    setShowPicker(null)
    setBusyId(jc.id)
    try {
      const res = await fetch(meta.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: jc.id }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to create'); setBusyId(null); return }
      router.push(`/workshop/job-cards/${jc.id}/${meta.path}`)
    } catch {
      toast.error('Failed to create')
      setBusyId(null)
    }
  }

  async function handleCreateProforma(row: Quotation) {
    setConfirmProforma(row)
  }

  async function doCreateProforma(row: Quotation) {
    setConfirmProforma(null)
    setBusyId(row.id)
    try {
      const res = await fetch('/api/proforma-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: row.job_card_id, quotation_id: row.id }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to create proforma'); setBusyId(null); return }
      router.push(`/workshop/job-cards/${row.job_card_id}/proforma`)
    } catch {
      toast.error('Failed to create proforma')
      setBusyId(null)
    }
  }

  async function handleConvertToTax(row: Proforma) {
    setConfirmTaxConvert(row)
  }

  async function handleMarkPaid(row: TaxInvoice) {
    setConfirmMarkPaid(row)
  }

  async function handleIssue(row: TaxInvoice) {
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/tax-invoices/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue' }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to issue invoice'); return }
      setTaxInvoices(rows => rows.map(r => r.id === row.id ? { ...r, status: 'issued' } : r))
      toast.success('Invoice issued')
    } catch {
      toast.error('Failed to issue invoice')
    } finally {
      setBusyId(null)
    }
  }

  async function doMarkPaid(row: TaxInvoice) {
    setConfirmMarkPaid(null)
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/tax-invoices/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid' }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to mark as paid'); return }
      setTaxInvoices(rows => rows.map(r => r.id === row.id ? { ...r, status: 'paid' } : r))
      toast.success('Marked as paid')
    } catch {
      toast.error('Failed to mark as paid')
    } finally {
      setBusyId(null)
    }
  }

  async function doConvertToTax(row: Proforma) {
    setConfirmTaxConvert(null)
    setBusyId(row.id)
    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: row.job_card_id, proforma_id: row.id }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to convert'); setBusyId(null); return }
      router.push(`/workshop/job-cards/${row.job_card_id}/tax-invoice`)
    } catch {
      toast.error('Failed to convert')
      setBusyId(null)
    }
  }

  useEffect(() => {
    if (session && role !== 'admin' && role !== 'supervisor') {
      router.replace('/workshop/dashboard')
    }
  }, [session, role, router])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/transactions')
        const d = await res.json()
        setQuotations(d.quotations ?? [])
        setProformas(d.proformas ?? [])
        setTaxInvoices(d.taxInvoices ?? [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />
  }

  const q = search.toLowerCase()

  const filteredQuotations = quotations
    .filter(x => !q || x.quotation_number.toLowerCase().includes(q) || (x.job_card?.customer?.name ?? '').toLowerCase().includes(q) || (x.job_card?.job_number ?? '').toLowerCase().includes(q) || (x.job_card?.vehicle?.plate_number ?? '').toLowerCase().includes(q) || (x.job_card?.vehicle?.model ?? '').toLowerCase().includes(q))
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'date') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      if (sortKey === 'total') return mul * (a.total - b.total)
      return mul * a.quotation_number.localeCompare(b.quotation_number)
    })

  const filteredProformas = proformas
    .filter(x => !q || x.proforma_number.toLowerCase().includes(q) || (x.job_card?.customer?.name ?? '').toLowerCase().includes(q) || (x.job_card?.job_number ?? '').toLowerCase().includes(q) || (x.job_card?.vehicle?.plate_number ?? '').toLowerCase().includes(q) || (x.job_card?.vehicle?.model ?? '').toLowerCase().includes(q))
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'date') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      if (sortKey === 'total') return mul * (a.total - b.total)
      return mul * a.proforma_number.localeCompare(b.proforma_number)
    })

  const filteredTax = taxInvoices
    .filter(x => !q || x.invoice_number.toLowerCase().includes(q) || (x.job_card?.customer?.name ?? '').toLowerCase().includes(q) || (x.job_card?.job_number ?? '').toLowerCase().includes(q) || (x.job_card?.vehicle?.plate_number ?? '').toLowerCase().includes(q) || (x.job_card?.vehicle?.model ?? '').toLowerCase().includes(q))
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'date') return mul * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      if (sortKey === 'total') return mul * (a.total - b.total)
      return mul * a.invoice_number.localeCompare(b.invoice_number)
    })

  const totalQuotationValue = quotations.reduce((s, x) => s + x.total, 0)
  const totalProformaValue = proformas.reduce((s, x) => s + x.total, 0)
  const totalTaxValue = taxInvoices.reduce((s, x) => s + x.total, 0)
  const issuedTaxValue = taxInvoices.filter(x => x.status === 'issued' || x.status === 'paid').reduce((s, x) => s + x.total, 0)
  const paidTaxCount = taxInvoices.filter(x => x.status === 'paid').length

  // ── Payment import state ──────────────────────────────────────
  const [showImport, setShowImport] = useState(false)
  const [importRows, setImportRows] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ updated: number; failed: number; errors: string[] } | null>(null)

  function downloadPaymentTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Job Number', 'Payment Status', 'Payment Method'],
      ['JC-2024-0001', 'paid', 'cash'],
      ['JC-2024-0002', 'partial', 'card'],
    ])
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Import')
    XLSX.writeFile(wb, 'Bakkah_Payment_Import_Template.xlsx')
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
    const errors: string[] = []
    let updated = 0
    for (let i = 0; i < importRows.length; i++) {
      const r = importRows[i]
      const jobNumber = (r['Job Number'] ?? r['job_number'] ?? '').trim()
      const paymentStatus = (r['Payment Status'] ?? r['payment_status'] ?? '').trim().toLowerCase()
      const paymentMethod = (r['Payment Method'] ?? r['payment_method'] ?? '').trim().toLowerCase()
      if (!jobNumber) { errors.push(`Row ${i + 1}: Job Number is required`); continue }
      if (!['paid', 'partial', 'unpaid'].includes(paymentStatus)) {
        errors.push(`Row ${i + 1}: Payment Status must be paid, partial, or unpaid`); continue
      }
      try {
        const res = await fetch(`/api/job-cards/payment-import`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_number: jobNumber, payment_status: paymentStatus, payment_method: paymentMethod || null }),
        })
        const d = await res.json()
        if (!res.ok) { errors.push(`Row ${i + 1} (${jobNumber}): ${d.error}`); continue }
        updated++
      } catch { errors.push(`Row ${i + 1} (${jobNumber}): Network error`) }
    }
    setImportResult({ updated, failed: errors.length, errors })
    setImporting(false)
    if (updated > 0) toast.success(`${updated} payment${updated !== 1 ? 's' : ''} updated`)
    if (errors.length > 0) toast.error(`${errors.length} row${errors.length !== 1 ? 's' : ''} failed`)
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Transactions" subtitle="Quotations · Proforma Invoices · Tax Invoices" />

      <div className="p-4 space-y-5 lg:p-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard
            label="Quotations"
            count={quotations.length}
            value={totalQuotationValue}
            icon={<ClipboardList className="h-4 w-4 text-amber-500" />}
            iconBg="bg-amber-500/10"
            sub={`${quotations.filter(x => x.status === 'approved').length} approved`}
          />
          <SummaryCard
            label="Proforma Invoices"
            count={proformas.length}
            value={totalProformaValue}
            icon={<FileText className="h-4 w-4 text-blue-500" />}
            iconBg="bg-blue-500/10"
            sub="issued to customers"
          />
          <SummaryCard
            label="Tax Invoices"
            count={taxInvoices.length}
            value={totalTaxValue}
            icon={<Receipt className="h-4 w-4 text-brand" />}
            iconBg="bg-brand/10"
            sub={`${taxInvoices.filter(x => x.status === 'issued').length} issued`}
          />
          <SummaryCard
            label="Revenue (Issued + Paid)"
            count={taxInvoices.filter(x => x.status === 'issued' || x.status === 'paid').length}
            value={issuedTaxValue}
            icon={<Receipt className="h-4 w-4 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            sub={`${paidTaxCount} paid`}
            highlight
          />
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/[0.05]">
            {([
              { key: 'quotations', label: 'Quotations', count: filteredQuotations.length },
              { key: 'proformas', label: 'Proformas', count: filteredProformas.length },
              { key: 'tax', label: 'Tax Invoices', count: filteredTax.length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all',
                  tab === key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-white/[0.1] dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70'
                )}
              >
                {label}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  tab === key ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60' : 'bg-gray-200/80 text-gray-500 dark:bg-white/[0.05] dark:text-white/30'
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by number, customer, job…"
              className="input-base sm:w-64"
            />
            <button
              onClick={() => setShowPicker(tab)}
              className="btn-primary shrink-0">
              <Plus className="h-4 w-4" /> {TAB_META[tab].newLabel}
            </button>
            <button
              onClick={() => { setShowImport(true); setImportRows([]); setImportResult(null) }}
              className="btn-ghost border-blue-600/30 bg-blue-500/8 text-blue-600 hover:bg-blue-500/15 dark:text-blue-400 shrink-0">
              <Upload className="h-4 w-4" /> Import Payments
            </button>
          </div>
        </div>

        {/* ── Payment import modal ── */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-surface-800 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-brand" />
                  <h2 className="font-bold text-gray-900 dark:text-white">Import Payments</h2>
                </div>
                <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Download Template</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">Columns: Job Number, Payment Status, Payment Method</p>
                  </div>
                  <button onClick={downloadPaymentTemplate}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white dark:bg-white/[0.05] dark:border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 hover:bg-gray-50 transition-colors">
                    <Download className="h-3.5 w-3.5" /> Template
                  </button>
                </div>

                <div>
                  <label className="label">Upload Excel / CSV File</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-6 hover:border-brand/40 transition-colors">
                    <Upload className="h-6 w-6 text-gray-300 dark:text-white/20" />
                    <span className="text-sm text-gray-500 dark:text-white/40">Click to select file (.xlsx, .csv)</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>

                {importRows.length > 0 && !importResult && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-white/40 mb-2 uppercase tracking-wide">
                      Preview — {importRows.length} row{importRows.length !== 1 ? 's' : ''}
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-white/[0.03]">
                            {['Job Number', 'Payment Status', 'Payment Method'].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-bold text-gray-400 dark:text-white/30">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                          {importRows.slice(0, 6).map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-white/70">{row['Job Number'] ?? row['job_number']}</td>
                              <td className="px-3 py-1.5 text-gray-500 dark:text-white/50 capitalize">{row['Payment Status'] ?? row['payment_status']}</td>
                              <td className="px-3 py-1.5 text-gray-500 dark:text-white/50">{row['Payment Method'] ?? row['payment_method']}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importRows.length > 6 && (
                        <p className="px-3 py-2 text-xs text-gray-400 dark:text-white/30">+{importRows.length - 6} more rows</p>
                      )}
                    </div>
                  </div>
                )}

                {importResult && (
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      {importResult.updated > 0 && (
                        <div className="flex-1 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{importResult.updated} updated</span>
                        </div>
                      )}
                      {importResult.failed > 0 && (
                        <div className="flex-1 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{importResult.failed} failed</span>
                        </div>
                      )}
                    </div>
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-500">{e}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-gray-100 dark:border-white/[0.06] px-5 py-4">
                {importRows.length > 0 && !importResult && (
                  <button onClick={handleImport} disabled={importing}
                    className="btn-primary flex-1 gap-2">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Update {importRows.length} Payment{importRows.length !== 1 ? 's' : ''}
                  </button>
                )}
                <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null) }} className="btn-ghost">
                  {importResult ? 'Close' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {tab === 'quotations' && (
            <QuotationTable rows={filteredQuotations} SortIcon={SortIcon} onSort={toggleSort} busyId={busyId} onCreateProforma={handleCreateProforma}
              onDelete={row => setDeleteTarget({ kind: 'quotation', id: row.id, number: row.quotation_number })} />
          )}
          {tab === 'proformas' && (
            <ProformaTable rows={filteredProformas} SortIcon={SortIcon} onSort={toggleSort} busyId={busyId} onConvertToTax={handleConvertToTax}
              onDelete={row => setDeleteTarget({ kind: 'proforma', id: row.id, number: row.proforma_number })} />
          )}
          {tab === 'tax' && (
            <TaxTable rows={filteredTax} SortIcon={SortIcon} onSort={toggleSort} busyId={busyId} onIssue={handleIssue} onMarkPaid={handleMarkPaid}
              onDelete={row => setDeleteTarget({ kind: 'tax', id: row.id, number: row.invoice_number })} />
          )}
        </div>

      </div>

      {showPicker && (
        <JobCardPicker
          title={TAB_META[showPicker].pickerTitle}
          onSelect={handlePickJobCard}
          onClose={() => setShowPicker(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmProforma}
        title="Create Proforma Invoice?"
        message={confirmProforma ? `Create a proforma from quotation ${confirmProforma.quotation_number}?` : ''}
        confirmLabel="Create Proforma"
        variant="warning"
        loading={busyId === confirmProforma?.id}
        onConfirm={() => confirmProforma && doCreateProforma(confirmProforma)}
        onCancel={() => setConfirmProforma(null)}
      />

      <ConfirmDialog
        open={!!confirmTaxConvert}
        title="Convert to Tax Invoice?"
        message={confirmTaxConvert ? `Convert proforma ${confirmTaxConvert.proforma_number} to a tax invoice? This finalises the document.` : ''}
        confirmLabel="Convert"
        variant="warning"
        loading={busyId === confirmTaxConvert?.id}
        onConfirm={() => confirmTaxConvert && doConvertToTax(confirmTaxConvert)}
        onCancel={() => setConfirmTaxConvert(null)}
      />

      <ConfirmDialog
        open={!!confirmMarkPaid}
        title="Mark Invoice as Paid?"
        message={confirmMarkPaid ? `Mark ${confirmMarkPaid.invoice_number} as paid? This updates the job card's payment status too.` : ''}
        confirmLabel="Mark as Paid"
        variant="warning"
        loading={busyId === confirmMarkPaid?.id}
        onConfirm={() => confirmMarkPaid && doMarkPaid(confirmMarkPaid)}
        onCancel={() => setConfirmMarkPaid(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this document?"
        message={deleteTarget ? `This will permanently delete ${deleteTarget.number}. This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={!!deleteTarget && deletingId === deleteTarget.id}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function SummaryCard({
  label, count, value, icon, iconBg, sub, highlight,
}: {
  label: string; count: number; value: number; icon: React.ReactNode; iconBg: string; sub: string; highlight?: boolean
}) {
  return (
    <div className={cn('card space-y-2', highlight && 'border-emerald-200 dark:border-emerald-500/20')}>
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', iconBg)}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-white/40">{label}</span>
      </div>
      <p className={cn('text-xl font-bold tabular-nums', highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand')}>{formatAED(value)}</p>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-gray-400 dark:text-white/30">{sub}</span>
        <span className="text-xs font-bold text-gray-700 dark:text-white/60">{count}</span>
      </div>
    </div>
  )
}

const thCls = 'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 cursor-pointer select-none hover:text-gray-600 dark:hover:text-white/60 transition-colors'
const thClsRight = cn(thCls, 'text-right')
const tdCls = 'px-4 py-3 text-sm'
const tdClsRight = cn(tdCls, 'text-right')

function QuotationTable({ rows, SortIcon, onSort, busyId, onCreateProforma, onDelete }: {
  rows: Quotation[]
  SortIcon: React.FC<{ k: SortKey }>
  onSort: (k: SortKey) => void
  busyId: string | null
  onCreateProforma: (row: Quotation) => void
  onDelete: (row: Quotation) => void
}) {
  const router = useRouter()
  if (rows.length === 0) return <EmptyState label="No quotations found" />

  function actionsFor(row: Quotation) {
    return [
      ...(row.status === 'approved' && !row.has_proforma
        ? [{ label: 'Create Proforma', icon: ArrowRightCircle, disabled: busyId === row.id, onClick: () => onCreateProforma(row) }]
        : []),
      ...(row.status === 'draft'
        ? [{ label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => onDelete(row) }]
        : []),
    ]
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <tr>
              <th className={thCls} onClick={() => onSort('number')}>Number <SortIcon k="number" /></th>
              <th className={thCls}>Customer</th>
              <th className={thCls}>Vehicle</th>
              <th className={thCls}>Job Card</th>
              <th className={thCls}>Status</th>
              <th className={thClsRight} onClick={() => onSort('total')}>Total <SortIcon k="total" /></th>
              <th className={thCls} onClick={() => onSort('date')}>Date <SortIcon k="date" /></th>
              <th className={cn(thCls, 'text-right cursor-default hover:text-gray-400 dark:hover:text-white/30')}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {rows.map(row => {
              const st = QUOTATION_STATUS[row.status] ?? QUOTATION_STATUS.draft
              return (
                <tr key={row.id}
                  onClick={() => row.job_card_id && router.push(`/workshop/job-cards/${row.job_card_id}/quotation`)}
                  className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className={cn(tdCls, 'font-mono font-semibold text-gray-900 dark:text-white')}>{row.quotation_number}</td>
                  <td className={tdCls}>
                    <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.customer?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">{row.job_card?.customer?.phone ?? ''}</p>
                  </td>
                  <td className={tdCls}>
                    <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.vehicle?.model ?? '—'}</p>
                    <p className="font-mono text-xs text-gray-400 dark:text-white/30">{row.job_card?.vehicle?.plate_number ?? ''}</p>
                  </td>
                  <td className={cn(tdCls, 'font-mono text-xs text-gray-500 dark:text-white/40')}>{row.job_card?.job_number ?? '—'}</td>
                  <td className={tdCls}>
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', st.cls)}>{st.label}</span>
                  </td>
                  <td className={cn(tdClsRight, 'font-semibold tabular-nums text-gray-900 dark:text-white')}>{formatAED(row.total)}</td>
                  <td className={cn(tdCls, 'text-gray-500 dark:text-white/40')}>{formatDate(row.created_at)}</td>
                  <td className={cn(tdCls, 'text-right')} onClick={e => e.stopPropagation()}>
                    <RowActionsMenu actions={actionsFor(row)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
        {rows.map(row => {
          const st = QUOTATION_STATUS[row.status] ?? QUOTATION_STATUS.draft
          return (
            <div key={row.id}
              onClick={() => row.job_card_id && router.push(`/workshop/job-cards/${row.job_card_id}/quotation`)}
              className="p-4 space-y-2 cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-sm text-gray-900 dark:text-white">{row.quotation_number}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', st.cls)}>{st.label}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActionsMenu actions={actionsFor(row)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-white/40">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.customer?.name ?? '—'}</p>
                  <p>{row.job_card?.customer?.phone ?? ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-800 dark:text-white/80">{row.job_card?.vehicle?.model ?? '—'}</p>
                  <p className="font-mono">{row.job_card?.vehicle?.plate_number ?? ''}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-400 dark:text-white/30">{row.job_card?.job_number ?? '—'}</span>
                <span className="text-gray-400 dark:text-white/30">{formatDate(row.created_at)}</span>
              </div>
              <p className="font-bold tabular-nums text-gray-900 dark:text-white">{formatAED(row.total)}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}

function ProformaTable({ rows, SortIcon, onSort, busyId, onConvertToTax, onDelete }: {
  rows: Proforma[]
  SortIcon: React.FC<{ k: SortKey }>
  onSort: (k: SortKey) => void
  busyId: string | null
  onConvertToTax: (row: Proforma) => void
  onDelete: (row: Proforma) => void
}) {
  const router = useRouter()
  if (rows.length === 0) return <EmptyState label="No proforma invoices found" />

  function actionsFor(row: Proforma) {
    return [
      ...(!row.has_tax_invoice
        ? [{ label: 'Convert to Tax Invoice', icon: ArrowRightCircle, disabled: busyId === row.id, onClick: () => onConvertToTax(row) }]
        : []),
      ...(!row.has_tax_invoice
        ? [{ label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => onDelete(row) }]
        : []),
    ]
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <tr>
              <th className={thCls} onClick={() => onSort('number')}>Number <SortIcon k="number" /></th>
              <th className={thCls}>Customer</th>
              <th className={thCls}>Vehicle</th>
              <th className={thCls}>Job Card</th>
              <th className={thClsRight} onClick={() => onSort('total')}>Amount <SortIcon k="total" /></th>
              <th className={thCls} onClick={() => onSort('date')}>Date <SortIcon k="date" /></th>
              <th className={cn(thCls, 'text-right cursor-default hover:text-gray-400 dark:hover:text-white/30')}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {rows.map(row => (
              <tr key={row.id}
                onClick={() => row.job_card_id && router.push(`/workshop/job-cards/${row.job_card_id}/proforma`)}
                className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className={cn(tdCls, 'font-mono font-semibold text-gray-900 dark:text-white')}>{row.proforma_number}</td>
                <td className={tdCls}>
                  <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.customer?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">{row.job_card?.customer?.phone ?? ''}</p>
                </td>
                <td className={tdCls}>
                  <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.vehicle?.model ?? '—'}</p>
                  <p className="font-mono text-xs text-gray-400 dark:text-white/30">{row.job_card?.vehicle?.plate_number ?? ''}</p>
                </td>
                <td className={cn(tdCls, 'font-mono text-xs text-gray-500 dark:text-white/40')}>{row.job_card?.job_number ?? '—'}</td>
                <td className={tdClsRight}>
                  <p className="font-bold tabular-nums text-brand">{formatAED(row.total)}</p>
                  <p className="text-[11px] tabular-nums text-gray-400 dark:text-white/30">
                    {formatAED(row.subtotal)} sub{row.discount > 0 && <span className="text-emerald-500 dark:text-emerald-400"> · −{formatAED(row.discount)}</span>} · {formatAED(row.vat_amount)} VAT
                  </p>
                </td>
                <td className={cn(tdCls, 'text-gray-500 dark:text-white/40')}>{formatDate(row.invoice_date || row.created_at)}</td>
                <td className={cn(tdCls, 'text-right')} onClick={e => e.stopPropagation()}>
                  <RowActionsMenu actions={actionsFor(row)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
        {rows.map(row => (
          <div key={row.id}
            onClick={() => row.job_card_id && router.push(`/workshop/job-cards/${row.job_card_id}/proforma`)}
            className="p-4 space-y-2 cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-semibold text-sm text-gray-900 dark:text-white">{row.proforma_number}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-gray-400 dark:text-white/30">{formatDate(row.invoice_date || row.created_at)}</span>
                <div onClick={e => e.stopPropagation()}>
                  <RowActionsMenu actions={actionsFor(row)} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-white/40">
              <div>
                <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.customer?.name ?? '—'}</p>
                <p>{row.job_card?.customer?.phone ?? ''}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-800 dark:text-white/80">{row.job_card?.vehicle?.model ?? '—'}</p>
                <p className="font-mono">{row.job_card?.vehicle?.plate_number ?? ''}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-gray-400 dark:text-white/30">{row.job_card?.job_number ?? '—'}</span>
              <span className="text-gray-400 dark:text-white/30">
                {formatAED(row.subtotal)} sub{row.discount > 0 && <span className="text-emerald-500 dark:text-emerald-400"> · −{formatAED(row.discount)}</span>} · {formatAED(row.vat_amount)} VAT
              </span>
            </div>
            <p className="font-bold tabular-nums text-brand">{formatAED(row.total)}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function TaxTable({ rows, SortIcon, onSort, busyId, onIssue, onMarkPaid, onDelete }: {
  rows: TaxInvoice[]
  SortIcon: React.FC<{ k: SortKey }>
  onSort: (k: SortKey) => void
  busyId: string | null
  onIssue: (row: TaxInvoice) => void
  onMarkPaid: (row: TaxInvoice) => void
  onDelete: (row: TaxInvoice) => void
}) {
  const router = useRouter()
  if (rows.length === 0) return <EmptyState label="No tax invoices found" />

  function actionsFor(row: TaxInvoice) {
    return [
      ...(row.status === 'draft'
        ? [{ label: 'Issue Invoice', icon: ArrowRightCircle, disabled: busyId === row.id, onClick: () => onIssue(row) }]
        : []),
      ...(row.status === 'issued'
        ? [{ label: 'Mark as Paid', icon: CheckCircle2, disabled: busyId === row.id, onClick: () => onMarkPaid(row) }]
        : []),
      ...(row.status !== 'paid'
        ? [{ label: 'Delete', icon: Trash2, variant: 'danger' as const, onClick: () => onDelete(row) }]
        : []),
    ]
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <tr>
              <th className={thCls} onClick={() => onSort('number')}>Invoice # <SortIcon k="number" /></th>
              <th className={thCls}>Customer</th>
              <th className={thCls}>Vehicle</th>
              <th className={thCls}>Job Card</th>
              <th className={thCls}>Status</th>
              <th className={thClsRight} onClick={() => onSort('total')}>Amount <SortIcon k="total" /></th>
              <th className={thCls} onClick={() => onSort('date')}>Date <SortIcon k="date" /></th>
              <th className={cn(thCls, 'text-right cursor-default hover:text-gray-400 dark:hover:text-white/30')}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {rows.map(row => {
              const st = TAX_STATUS[row.status] ?? TAX_STATUS.draft
              return (
                <tr key={row.id}
                  onClick={() => row.job_card_id && router.push(`/workshop/job-cards/${row.job_card_id}/tax-invoice`)}
                  className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className={cn(tdCls, 'font-mono font-semibold text-gray-900 dark:text-white')}>{row.invoice_number}</td>
                  <td className={tdCls}>
                    <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.customer?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">{row.job_card?.customer?.phone ?? ''}</p>
                  </td>
                  <td className={tdCls}>
                    <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.vehicle?.model ?? '—'}</p>
                    <p className="font-mono text-xs text-gray-400 dark:text-white/30">{row.job_card?.vehicle?.plate_number ?? ''}</p>
                  </td>
                  <td className={cn(tdCls, 'font-mono text-xs text-gray-500 dark:text-white/40')}>{row.job_card?.job_number ?? '—'}</td>
                  <td className={tdCls}>
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', st.cls)} title={st.label === 'Issued' ? 'Open the invoice to mark it as paid' : undefined}>{st.label}</span>
                  </td>
                  <td className={tdClsRight}>
                    <p className="font-bold tabular-nums text-brand">{formatAED(row.total)}</p>
                    <p className="text-[11px] tabular-nums text-gray-400 dark:text-white/30">
                      {formatAED(row.subtotal)} sub{row.discount > 0 && <span className="text-emerald-500 dark:text-emerald-400"> · −{formatAED(row.discount)}</span>} · {formatAED(row.vat_amount)} VAT
                    </p>
                  </td>
                  <td className={cn(tdCls, 'text-gray-500 dark:text-white/40')}>{formatDate(row.invoice_date || row.created_at)}</td>
                  <td className={cn(tdCls, 'text-right')} onClick={e => e.stopPropagation()}>
                    <RowActionsMenu actions={actionsFor(row)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
        {rows.map(row => {
          const st = TAX_STATUS[row.status] ?? TAX_STATUS.draft
          return (
            <div key={row.id}
              onClick={() => row.job_card_id && router.push(`/workshop/job-cards/${row.job_card_id}/tax-invoice`)}
              className="p-4 space-y-2 cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.02]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-sm text-gray-900 dark:text-white">{row.invoice_number}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', st.cls)}>{st.label}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <RowActionsMenu actions={actionsFor(row)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-white/40">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/80">{row.job_card?.customer?.name ?? '—'}</p>
                  <p>{row.job_card?.customer?.phone ?? ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-800 dark:text-white/80">{row.job_card?.vehicle?.model ?? '—'}</p>
                  <p className="font-mono">{row.job_card?.vehicle?.plate_number ?? ''}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-400 dark:text-white/30">{row.job_card?.job_number ?? '—'}</span>
                <span className="text-gray-400 dark:text-white/30">{formatDate(row.invoice_date || row.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-white/30">
                  {formatAED(row.subtotal)} sub{row.discount > 0 && <span className="text-emerald-500 dark:text-emerald-400"> · −{formatAED(row.discount)}</span>} · {formatAED(row.vat_amount)} VAT
                </span>
                <span className="font-bold tabular-nums text-brand">{formatAED(row.total)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Receipt className="h-10 w-10 text-gray-200 dark:text-white/10" />
      <p className="text-sm text-gray-400 dark:text-white/30">{label}</p>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { FileText, Receipt, ClipboardList, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { formatAED, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

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
}

type TaxInvoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'issued'
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
  const issuedTaxValue = taxInvoices.filter(x => x.status === 'issued').reduce((s, x) => s + x.total, 0)

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
            label="Revenue (Issued)"
            count={taxInvoices.filter(x => x.status === 'issued').length}
            value={issuedTaxValue}
            icon={<Receipt className="h-4 w-4 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            sub="finalized tax invoices"
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

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by number, customer, job…"
            className="input-base sm:w-64"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {tab === 'quotations' && (
            <QuotationTable rows={filteredQuotations} SortIcon={SortIcon} onSort={toggleSort} />
          )}
          {tab === 'proformas' && (
            <ProformaTable rows={filteredProformas} SortIcon={SortIcon} onSort={toggleSort} />
          )}
          {tab === 'tax' && (
            <TaxTable rows={filteredTax} SortIcon={SortIcon} onSort={toggleSort} />
          )}
        </div>

      </div>
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
const tdCls = 'px-4 py-3 text-sm'

function QuotationTable({ rows, SortIcon, onSort }: {
  rows: Quotation[]
  SortIcon: React.FC<{ k: SortKey }>
  onSort: (k: SortKey) => void
}) {
  if (rows.length === 0) return <EmptyState label="No quotations found" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <tr>
            <th className={thCls} onClick={() => onSort('number')}>Number <SortIcon k="number" /></th>
            <th className={thCls}>Customer</th>
            <th className={thCls}>Vehicle</th>
            <th className={thCls}>Job Card</th>
            <th className={thCls}>Status</th>
            <th className={thCls} onClick={() => onSort('total')}>Total <SortIcon k="total" /></th>
            <th className={thCls} onClick={() => onSort('date')}>Date <SortIcon k="date" /></th>
            <th className={thCls}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {rows.map(row => {
            const st = QUOTATION_STATUS[row.status] ?? QUOTATION_STATUS.draft
            return (
              <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
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
                <td className={cn(tdCls, 'font-semibold tabular-nums text-gray-900 dark:text-white')}>{formatAED(row.total)}</td>
                <td className={cn(tdCls, 'text-gray-500 dark:text-white/40')}>{formatDate(row.created_at)}</td>
                <td className={tdCls}>
                  {row.job_card_id && (
                    <Link href={`/workshop/job-cards/${row.job_card_id}`}
                      className="flex items-center gap-1 text-xs text-brand hover:underline font-medium">
                      <ExternalLink className="h-3 w-3" /> View Job
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ProformaTable({ rows, SortIcon, onSort }: {
  rows: Proforma[]
  SortIcon: React.FC<{ k: SortKey }>
  onSort: (k: SortKey) => void
}) {
  if (rows.length === 0) return <EmptyState label="No proforma invoices found" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <tr>
            <th className={thCls} onClick={() => onSort('number')}>Number <SortIcon k="number" /></th>
            <th className={thCls}>Customer</th>
            <th className={thCls}>Vehicle</th>
            <th className={thCls}>Job Card</th>
            <th className={thCls} onClick={() => onSort('total')}>Subtotal</th>
            <th className={thCls}>Discount</th>
            <th className={thCls}>VAT</th>
            <th className={thCls} onClick={() => onSort('total')}>Total <SortIcon k="total" /></th>
            <th className={thCls} onClick={() => onSort('date')}>Date <SortIcon k="date" /></th>
            <th className={thCls}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
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
              <td className={cn(tdCls, 'tabular-nums text-gray-600 dark:text-white/60')}>{formatAED(row.subtotal)}</td>
              <td className={cn(tdCls, 'tabular-nums text-emerald-600 dark:text-emerald-400')}>{row.discount > 0 ? `−${formatAED(row.discount)}` : '—'}</td>
              <td className={cn(tdCls, 'tabular-nums text-gray-500 dark:text-white/40')}>{formatAED(row.vat_amount)}</td>
              <td className={cn(tdCls, 'font-bold tabular-nums text-brand')}>{formatAED(row.total)}</td>
              <td className={cn(tdCls, 'text-gray-500 dark:text-white/40')}>{formatDate(row.invoice_date || row.created_at)}</td>
              <td className={tdCls}>
                {row.job_card_id && (
                  <Link href={`/workshop/job-cards/${row.job_card_id}`}
                    className="flex items-center gap-1 text-xs text-brand hover:underline font-medium">
                    <ExternalLink className="h-3 w-3" /> View Job
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaxTable({ rows, SortIcon, onSort }: {
  rows: TaxInvoice[]
  SortIcon: React.FC<{ k: SortKey }>
  onSort: (k: SortKey) => void
}) {
  if (rows.length === 0) return <EmptyState label="No tax invoices found" />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <tr>
            <th className={thCls} onClick={() => onSort('number')}>Invoice # <SortIcon k="number" /></th>
            <th className={thCls}>Customer</th>
            <th className={thCls}>Vehicle</th>
            <th className={thCls}>Job Card</th>
            <th className={thCls}>Status</th>
            <th className={thCls}>Subtotal</th>
            <th className={thCls}>Discount</th>
            <th className={thCls}>VAT</th>
            <th className={thCls} onClick={() => onSort('total')}>Total <SortIcon k="total" /></th>
            <th className={thCls} onClick={() => onSort('date')}>Date <SortIcon k="date" /></th>
            <th className={thCls}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
          {rows.map(row => {
            const st = TAX_STATUS[row.status] ?? TAX_STATUS.draft
            return (
              <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
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
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase', st.cls)}>{st.label}</span>
                </td>
                <td className={cn(tdCls, 'tabular-nums text-gray-600 dark:text-white/60')}>{formatAED(row.subtotal)}</td>
                <td className={cn(tdCls, 'tabular-nums text-emerald-600 dark:text-emerald-400')}>{row.discount > 0 ? `−${formatAED(row.discount)}` : '—'}</td>
                <td className={cn(tdCls, 'tabular-nums text-gray-500 dark:text-white/40')}>{formatAED(row.vat_amount)}</td>
                <td className={cn(tdCls, 'font-bold tabular-nums text-brand')}>{formatAED(row.total)}</td>
                <td className={cn(tdCls, 'text-gray-500 dark:text-white/40')}>{formatDate(row.invoice_date || row.created_at)}</td>
                <td className={tdCls}>
                  {row.job_card_id && (
                    <Link href={`/workshop/job-cards/${row.job_card_id}`}
                      className="flex items-center gap-1 text-xs text-brand hover:underline font-medium">
                      <ExternalLink className="h-3 w-3" /> View Job
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
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

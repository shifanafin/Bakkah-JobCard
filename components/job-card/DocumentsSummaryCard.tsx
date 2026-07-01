'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, FileText, Receipt, Plus, ChevronRight, Loader2 } from 'lucide-react'
import { formatAED } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Doc = { number: string; status?: string; total: number } | null

const QUOTATION_STATUS_CLS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/50',
  sent: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

const TAX_STATUS_CLS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  issued: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
}

type RowKey = 'quotation' | 'proforma' | 'tax-invoice'

const ROW_META: Record<RowKey, { label: string; icon: React.ElementType; iconCls: string; iconBg: string; createLabel: string }> = {
  quotation: { label: 'Quotation', icon: ClipboardList, iconCls: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-500/15', createLabel: 'Create Quotation' },
  proforma: { label: 'Proforma Invoice', icon: FileText, iconCls: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-500/15', createLabel: 'Create Proforma' },
  'tax-invoice': { label: 'Tax Invoice', icon: Receipt, iconCls: 'text-brand', iconBg: 'bg-brand/15', createLabel: 'Create Tax Invoice' },
}

export default function DocumentsSummaryCard({
  jobId,
  canCreateProforma,
  canCreateTax,
  readOnly,
}: {
  jobId: string
  canCreateProforma?: boolean
  canCreateTax?: boolean
  readOnly?: boolean
}) {
  const router = useRouter()
  const [quotation, setQuotation] = useState<Doc | undefined>(undefined)
  const [proforma, setProforma] = useState<Doc | undefined>(undefined)
  const [taxInvoice, setTaxInvoice] = useState<Doc | undefined>(undefined)
  const [creating, setCreating] = useState<RowKey | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/quotations?job_card_id=${jobId}`).then(r => r.json())
      .then(d => setQuotation(d.quotation ? { number: d.quotation.quotation_number, status: d.quotation.status, total: d.quotation.total } : null))
      .catch(() => setQuotation(null))
    fetch(`/api/proforma-invoices?job_card_id=${jobId}`).then(r => r.json())
      .then(d => setProforma(d.proforma ? { number: d.proforma.proforma_number, total: d.proforma.total } : null))
      .catch(() => setProforma(null))
    fetch(`/api/tax-invoices?job_card_id=${jobId}`).then(r => r.json())
      .then(d => setTaxInvoice(d.invoice ? { number: d.invoice.invoice_number, status: d.invoice.status, total: d.invoice.total } : null))
      .catch(() => setTaxInvoice(null))
  }, [jobId])

  function handleCreate(row: RowKey, endpoint: string, path: string) {
    setCreating(row)
    startTransition(async () => {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_card_id: jobId }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed to create'); setCreating(null); return }
        router.push(`/workshop/job-cards/${jobId}/${path}`)
      } catch {
        toast.error('Failed to create')
        setCreating(null)
      }
    })
  }

  function Row({ rowKey, doc, statusCls, canCreate, onCreate }: {
    rowKey: RowKey
    doc: Doc | undefined
    statusCls?: Record<string, string>
    canCreate: boolean
    onCreate: () => void
  }) {
    const meta = ROW_META[rowKey]
    const Icon = meta.icon
    return (
      <div className="flex items-center gap-3 py-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', meta.iconBg)}>
          <Icon className={cn('h-4 w-4', meta.iconCls)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta.label}</p>
          {doc === undefined ? (
            <p className="text-xs text-gray-400 dark:text-white/30">Loading…</p>
          ) : doc ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-gray-500 dark:text-white/40">{doc.number}</span>
              {doc.status && statusCls && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', statusCls[doc.status])}>{doc.status}</span>
              )}
              <span className="text-xs font-semibold text-gray-700 dark:text-white/60">{formatAED(doc.total)}</span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-white/30">Not created yet</p>
          )}
        </div>
        {doc === undefined ? null : doc ? (
          <button
            onClick={() => router.push(`/workshop/job-cards/${jobId}/${rowKey}`)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 shrink-0"
          >
            View <ChevronRight className="h-3 w-3" />
          </button>
        ) : (!readOnly && canCreate) ? (
          <button
            onClick={onCreate}
            disabled={creating === rowKey}
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand/90 transition-colors disabled:opacity-50 shrink-0"
          >
            {creating === rowKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            {meta.createLabel}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
          <FileText className="h-3.5 w-3.5 text-brand" />
        </div>
        <h3 className="section-title">Documents</h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        <Row
          rowKey="quotation"
          doc={quotation}
          statusCls={QUOTATION_STATUS_CLS}
          canCreate={true}
          onCreate={() => handleCreate('quotation', '/api/quotations', 'quotation')}
        />
        <Row
          rowKey="proforma"
          doc={proforma}
          canCreate={!!canCreateProforma}
          onCreate={() => handleCreate('proforma', '/api/proforma-invoices', 'proforma')}
        />
        <Row
          rowKey="tax-invoice"
          doc={taxInvoice}
          statusCls={TAX_STATUS_CLS}
          canCreate={!!canCreateTax}
          onCreate={() => handleCreate('tax-invoice', '/api/tax-invoices', 'tax-invoice')}
        />
      </div>
    </div>
  )
}

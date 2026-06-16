'use client'

import { useState, useEffect, useTransition } from 'react'
import { Receipt, Loader2, Check, MessageCircle, AlertTriangle, BadgeCheck } from 'lucide-react'
import { formatAED } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Item = {
  id: string
  item_type: 'service' | 'part' | 'labor'
  description: string
  quantity: number
  unit_price: number
  total_price: number
  sort_order: number
}

type TaxInvoice = {
  id: string
  invoice_number: string
  job_card_id: string
  status: 'draft' | 'issued' | 'paid'
  invoice_date: string
  notes: string | null
  terms: string | null
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  items: Item[]
}

const ITEM_TYPE_CLS: Record<string, string> = {
  service: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  part: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  labor: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  issued: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  issued: 'Issued',
  paid: 'Paid',
}

export default function TaxInvoiceSection({
  jobId,
  jobNumber,
  customerPhone,
}: {
  jobId: string
  jobNumber: string
  customerPhone?: string
}) {
  const [invoice, setInvoice] = useState<TaxInvoice | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/tax-invoices?job_card_id=${jobId}`)
      const d = await res.json()
      const inv = d.invoice ?? null
      setInvoice(inv)
      if (inv) { setDiscount(inv.discount?.toString() ?? '0'); setNotes(inv.notes ?? '') }
    } catch { setInvoice(null) }
  }

  useEffect(() => { load() }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDraft = invoice?.status === 'draft'
  const isIssued = invoice?.status === 'issued'
  const isPaid = invoice?.status === 'paid'

  function handleDiscount() {
    if (!invoice || !isDraft) return
    startTransition(async () => {
      try {
        const disc = parseFloat(discount) || 0
        const res = await fetch(`/api/tax-invoices/${invoice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discount: disc }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setInvoice(d.invoice)
        toast.success('Discount applied')
      } catch { toast.error('Failed to apply discount') }
    })
  }

  function handleSaveNotes() {
    if (!invoice || !isDraft) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setInvoice(d.invoice); setEditingNotes(false)
        toast.success('Notes saved')
      } catch { toast.error('Failed to save notes') }
    })
  }

  function handleIssue() {
    if (!invoice || !isDraft) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'issue' }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setInvoice(d.invoice)
        toast.success('Tax invoice issued')
      } catch { toast.error('Failed to issue invoice') }
    })
  }

  function handleMarkPaid() {
    if (!invoice || !isIssued) return
    if (!confirm('Mark this tax invoice as Paid? This cannot be undone.')) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_paid' }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setInvoice(d.invoice)
        toast.success('Invoice marked as paid')
      } catch { toast.error('Failed to mark as paid') }
    })
  }

  function buildShareHref() {
    if (!customerPhone) return '#'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const trackUrl = `${origin}/track?q=${encodeURIComponent(jobNumber)}`
    const msg = [
      `Dear Customer,`,
      `Your Tax Invoice ${invoice?.invoice_number} for Job ${jobNumber} is ready.`,
      ``,
      `View your invoice: ${trackUrl}`,
      ``,
      `Total: AED ${invoice?.total?.toFixed(2)}`,
      ``,
      `Bakkah Auto Premium Care | +971 54 588 6999`,
    ].join('\n')
    return `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  if (invoice === undefined) {
    return (
      <div className="card flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
          <Receipt className="h-3.5 w-3.5 text-brand" />
        </div>
        <h3 className="section-title">Tax Invoice</h3>
        {invoice && (
          <>
            <span className="font-mono text-xs text-gray-400 dark:text-white/40">{invoice.invoice_number}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', STATUS_BADGE[invoice.status])}>
              {STATUS_LABEL[invoice.status]}
            </span>
          </>
        )}
        {invoice && customerPhone && (
          <a href={buildShareHref()} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <MessageCircle className="h-3.5 w-3.5" /> Share
          </a>
        )}
      </div>

      {!invoice ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Receipt className="h-6 w-6 text-brand/60" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-white/70">No tax invoice yet</p>
          <p className="text-xs text-gray-400 dark:text-white/30">Auto-created as a draft when the job is marked delivered</p>
        </div>
      ) : (
        <>
          {/* Draft notice */}
          {isDraft && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Draft — apply any final discount below, then issue to lock the invoice.
              </p>
            </div>
          )}

          {/* Items table */}
          {invoice.items.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    {['Type', 'Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {invoice.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', ITEM_TYPE_CLS[item.item_type])}>
                          {item.item_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-800 dark:text-white/80">{item.description}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{formatAED(item.unit_price)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums dark:text-white">{formatAED(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 dark:border-white/[0.07] dark:bg-surface-900">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-white/50">Subtotal</span>
              <span className="tabular-nums text-gray-600 dark:text-white/70">{formatAED(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-white/50">Completion Discount</span>
                <span className="tabular-nums text-emerald-500">−{formatAED(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-white/50">VAT (5%)</span>
              <span className="tabular-nums text-gray-600 dark:text-white/70">{formatAED(invoice.vat_amount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between dark:border-white/[0.08]">
              <span className="font-bold text-gray-900 dark:text-white">Total (incl. VAT)</span>
              <span className="font-bold text-xl text-brand tabular-nums">{formatAED(invoice.total)}</span>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/25 text-right">Prices in AED · VAT applicable</p>
          </div>

          {/* Completion Discount — draft only */}
          {isDraft && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label">Completion Discount (AED)</label>
                <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)} className="input-base" />
              </div>
              <button onClick={handleDiscount} disabled={isPending} className="btn-ghost h-[42px]">Apply</button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label">Notes</label>
              {isDraft && !editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="text-xs text-brand hover:underline">Edit</button>
              )}
            </div>
            {isDraft && editingNotes ? (
              <div className="space-y-2">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="input-base w-full min-h-[80px] resize-none"
                  placeholder="Payment terms, additional notes..." rows={3} />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 h-auto">
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                  </button>
                  <button onClick={() => { setEditingNotes(false); setNotes(invoice.notes ?? '') }}
                    className="btn-ghost text-xs px-3 py-1.5 h-auto">Cancel</button>
                </div>
              </div>
            ) : invoice.notes ? (
              <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">{invoice.notes}</p>
            ) : isDraft ? (
              <p className="text-xs text-gray-300 dark:text-white/20 italic">No notes — click Edit to add</p>
            ) : null}
          </div>

          {/* Issue button — draft only */}
          {isDraft && (
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button onClick={handleIssue} disabled={isPending} className="btn-primary flex-1">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Issue Tax Invoice
              </button>
            </div>
          )}

          {/* Issued — show Mark as Paid */}
          {isIssued && (
            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tax Invoice Issued — Locked</span>
              </div>
              <button onClick={handleMarkPaid} disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Mark as Paid
              </button>
            </div>
          )}

          {/* Paid — final state */}
          {isPaid && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 pt-1 mt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Invoice Paid</p>
                <p className="text-xs text-blue-500/70 dark:text-blue-400/60">Payment received and recorded</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import { FileText, Plus, Trash2, Loader2, Send, Edit2, Check, ChevronDown, AlertTriangle, MessageCircle } from 'lucide-react'
import { formatAED } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type CatalogService = { id: string; name: string; default_price: number; category: string }

type QuotationItem = {
  id: string
  item_type: 'service' | 'part' | 'labor'
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

type Quotation = {
  id: string
  quotation_number: string
  status: 'draft' | 'sent' | 'approved' | 'declined'
  valid_days: number
  notes: string | null
  customer_notes: string | null
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  created_at: string
  items: QuotationItem[]
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-white/50' },
  sent: { label: 'Awaiting Customer', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  declined: { label: 'Declined', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
}

const ITEM_TYPE_CLS: Record<string, string> = {
  service: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  part: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  labor: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
}

export default function QuotationSection({
  jobId,
  jobNumber,
  customerPhone,
  customerName,
  canApprove,
  onStatusChange,
}: {
  jobId: string
  jobNumber?: string
  customerPhone?: string
  customerName?: string
  canApprove?: boolean
  onStatusChange?: (status: string | null) => void
}) {
  // undefined = loading, null = no quotation
  const [quotation, setQuotation] = useState<Quotation | null | undefined>(undefined)

  function applyQuotation(q: Quotation | null) {
    setQuotation(q)
    onStatusChange?.(q?.status ?? null)
  }
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)

  const [catalog, setCatalog] = useState<CatalogService[]>([])

  const [itemType, setItemType] = useState<'service' | 'part' | 'labor'>('service')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')

  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)

  async function load() {
    try {
      const res = await fetch(`/api/quotations?job_card_id=${jobId}`)
      const data = await res.json()
      const q = data.quotation ?? null
      setQuotation(q)
      onStatusChange?.(q?.status ?? null)
      if (q) {
        setDiscount(q.discount?.toString() ?? '0')
        setNotes(q.notes ?? '')
      }
    } catch {
      setQuotation(null)
      onStatusChange?.(null)
    }
  }

  useEffect(() => { load() }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setCatalog(d.services ?? []))
      .catch(() => {})
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: jobId }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to create quotation'); return }
      await load()
      toast.success('Quotation created')
    } catch { toast.error('Failed to create quotation') }
    finally { setCreating(false) }
  }

  function handleAddItem() {
    if (!itemDesc.trim() || !itemPrice || !quotation) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_type: itemType,
            description: itemDesc.trim(),
            quantity: parseFloat(itemQty) || 1,
            unit_price: parseFloat(itemPrice),
          }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to add item'); return }
        const d = await res.json()
        applyQuotation(d.quotation)
        setItemDesc(''); setItemQty('1'); setItemPrice('')
        toast.success('Item added')
      } catch { toast.error('Failed to add item') }
    })
  }

  function handleRemoveItem(itemId: string) {
    if (!quotation) return
    startTransition(async () => {
      try {
        await fetch(`/api/quotations/${quotation.id}/items?item_id=${itemId}`, { method: 'DELETE' })
        await load()
        toast.success('Item removed')
      } catch { toast.error('Failed to remove item') }
    })
  }

  function handleDiscount() {
    if (!quotation) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discount: parseFloat(discount) || 0 }),
        })
        const d = await res.json(); applyQuotation(d.quotation)
        toast.success('Discount applied')
      } catch { toast.error('Failed to apply discount') }
    })
  }

  function handleSaveNotes() {
    if (!quotation) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        const d = await res.json(); applyQuotation(d.quotation); setEditingNotes(false)
        toast.success('Notes saved')
      } catch { toast.error('Failed to save notes') }
    })
  }

  function handleSend() {
    if (!quotation || quotation.items.length === 0) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send' }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to save quotation'); return }
        const d = await res.json(); applyQuotation(d.quotation)
        toast.success('Quotation saved')
      } catch { toast.error('Failed to save quotation') }
    })
  }

  function handleRevert() {
    if (!quotation) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'draft' }),
        })
        const d = await res.json(); applyQuotation(d.quotation)
        toast.success('Reverted to draft')
      } catch { toast.error('Failed to revert quotation') }
    })
  }

  function handleDelete() {
    if (!quotation || quotation.items.length > 0) return
    startTransition(async () => {
      try {
        await fetch(`/api/quotations/${quotation.id}`, { method: 'DELETE' })
        applyQuotation(null); toast.success('Quotation deleted')
      } catch { toast.error('Failed to delete quotation') }
    })
  }

  function handleAdminApprove() {
    if (!quotation) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to approve'); return }
        const d = await res.json(); applyQuotation(d.quotation)
        toast.success('Quotation approved — proforma created')
      } catch { toast.error('Failed to approve quotation') }
    })
  }

  function handleAdminDecline() {
    if (!quotation) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decline' }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to decline'); return }
        const d = await res.json(); applyQuotation(d.quotation)
        toast.success('Quotation declined')
      } catch { toast.error('Failed to decline quotation') }
    })
  }

  const inputSm = 'flex-1 rounded-lg border px-2.5 py-2 text-sm focus:border-brand/50 focus:outline-none transition bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/20'

  function buildWhatsAppHref(): string {
    if (!customerPhone || !quotation) return '#'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const trackUrl = `${origin}/track?q=${encodeURIComponent(jobNumber ?? '')}`

    const itemLines = quotation.items.map(i => {
      const qty = i.quantity !== 1 ? ` ×${i.quantity}` : ''
      return `  • ${i.description}${qty} — AED ${i.total_price.toFixed(2)}`
    }).join('\n')

    const lines = [
      `Dear ${customerName ?? 'Valued Customer'},`,
      ``,
      `Your vehicle has been assessed at Bakkah Auto Premium Care.`,
      `Here is your Quotation *${quotation.quotation_number}*${jobNumber ? ` for Job *${jobNumber}*` : ''}:`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      itemLines,
      `━━━━━━━━━━━━━━━━━━`,
      `Subtotal: AED ${quotation.subtotal.toFixed(2)}`,
      ...(quotation.discount > 0 ? [`Discount: −AED ${quotation.discount.toFixed(2)}`] : []),
      `VAT (5%): AED ${quotation.vat_amount.toFixed(2)}`,
      `*Total: AED ${quotation.total.toFixed(2)}*`,
      ``,
      `✅ To *APPROVE* or ❌ *DECLINE* this quotation, tap the link below and enter your mobile number:`,
      trackUrl,
      ``,
      `Questions? Call or WhatsApp us:`,
      `📞 +971 54 588 6999`,
      ``,
      `Bakkah Auto Premium Care`,
      `Al Qusais Industrial Area 5, Dubai`,
    ]

    return `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`
  }

  if (quotation === undefined) {
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
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
          <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="section-title">Quotation</h3>
        {quotation && (
          <>
            <span className="font-mono text-xs text-gray-400 dark:text-white/40">{quotation.quotation_number}</span>
            <span className={cn('ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold', STATUS_BADGE[quotation.status]?.cls)}>
              {STATUS_BADGE[quotation.status]?.label}
            </span>
          </>
        )}
      </div>

      {/* No quotation */}
      {!quotation && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
            <FileText className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-white/70">No quotation yet</p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Create a quotation to send to the customer for approval</p>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Quotation
          </button>
        </div>
      )}

      {quotation && (
        <>
          {/* Declined reason banner */}
          {quotation.status === 'declined' && quotation.customer_notes && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">Customer Reason</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/70 mt-0.5">&ldquo;{quotation.customer_notes}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Items table */}
          {quotation.items.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    {['Type', 'Description', 'Qty', 'Unit', 'Total', ...(quotation.status === 'draft' ? [''] : [])].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {quotation.items.map(item => (
                    <tr key={item.id} className="group">
                      <td className="px-3 py-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', ITEM_TYPE_CLS[item.item_type])}>
                          {item.item_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-800 dark:text-white/80">{item.description}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{item.quantity}</td>
                      <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50">{formatAED(item.unit_price)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums dark:text-white">{formatAED(item.total_price)}</td>
                      {quotation.status === 'draft' && (
                        <td className="px-3 py-2">
                          <button onClick={() => handleRemoveItem(item.id)} disabled={isPending}
                            className="text-gray-200 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all dark:text-white/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add item — draft only */}
          {quotation.status === 'draft' && (
            <div className="flex gap-2 flex-wrap">
              {/* Type */}
              <div className="relative">
                <select value={itemType} onChange={e => {
                  setItemType(e.target.value as 'service' | 'part' | 'labor')
                  setItemDesc('')
                  setItemPrice('')
                }} className={cn(inputSm, 'w-28 flex-none appearance-none pr-7')}>
                  <option value="service">Service</option>
                  <option value="part">Part</option>
                  <option value="labor">Labor</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              </div>

              {itemType === 'service' ? (
                <div className="relative flex-1 min-w-[150px]">
                  <select
                    value={itemDesc}
                    onChange={e => {
                      const name = e.target.value
                      setItemDesc(name)
                      const match = catalog.find(s => s.name === name)
                      if (match && match.default_price > 0) setItemPrice(match.default_price.toString())
                      else if (!name) setItemPrice('')
                    }}
                    className={cn(inputSm, 'w-full appearance-none pr-7')}
                  >
                    <option value="">— Select Service —</option>
                    {catalog.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/30" />
                </div>
              ) : (
                <input
                  value={itemDesc}
                  onChange={e => setItemDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                  placeholder="Description"
                  className={cn(inputSm, 'min-w-[150px] flex-1')}
                />
              )}

              <input value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="Qty"
                type="number" min={0.5} step={0.5} className={cn(inputSm, 'w-16 flex-none')} />
              <input value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="Price (AED)"
                type="number" min={0} className={cn(inputSm, 'w-32 flex-none')} />
              <button onClick={handleAddItem} disabled={isPending || !itemDesc.trim() || !itemPrice}
                className="btn-primary text-xs px-3 py-2 h-auto flex-none">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Add</>}
              </button>
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 dark:border-white/[0.07] dark:bg-surface-900">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-white/50">Subtotal</span>
              <span className="tabular-nums text-gray-600 dark:text-white/70">{formatAED(quotation.subtotal)}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-white/50">Discount</span>
                <span className="tabular-nums text-emerald-500 dark:text-emerald-400">−{formatAED(quotation.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-white/50">VAT (5%)</span>
              <span className="tabular-nums text-gray-600 dark:text-white/70">{formatAED(quotation.vat_amount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between dark:border-white/[0.08]">
              <span className="font-bold text-gray-900 dark:text-white">Total (incl. VAT)</span>
              <span className="font-bold text-lg text-brand tabular-nums">{formatAED(quotation.total)}</span>
            </div>
          </div>

          {/* Discount — draft only */}
          {quotation.status === 'draft' && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label">Discount (AED)</label>
                <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)} className="input-base" />
              </div>
              <button onClick={handleDiscount} disabled={isPending} className="btn-ghost h-[42px]">Apply</button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label">Notes to Customer</label>
              {quotation.status === 'draft' && !editingNotes && (
                <button onClick={() => setEditingNotes(true)}
                  className="text-xs text-brand hover:underline flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {quotation.status === 'draft' && editingNotes ? (
              <div className="space-y-2">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="input-base w-full min-h-[80px] resize-none"
                  placeholder="Add any notes, terms, or conditions for the customer..."
                  rows={3} />
                <div className="flex gap-2">
                  <button onClick={handleSaveNotes} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 h-auto">Save</button>
                  <button onClick={() => { setEditingNotes(false); setNotes(quotation.notes ?? '') }}
                    className="btn-ghost text-xs px-3 py-1.5 h-auto">Cancel</button>
                </div>
              </div>
            ) : (
              quotation.notes
                ? <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">{quotation.notes}</p>
                : quotation.status === 'draft'
                  ? <p className="text-xs text-gray-300 dark:text-white/20 italic">No notes — click Edit to add</p>
                  : null
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
            {quotation.status === 'draft' && (
              <>
                <button onClick={handleSend} disabled={isPending || quotation.items.length === 0}
                  className="btn-primary flex-1 disabled:opacity-40">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save Quotation
                </button>
                <button onClick={handleDelete} disabled={isPending || quotation.items.length > 0}
                  className="btn-ghost text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 flex-none disabled:opacity-30 disabled:pointer-events-none">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            )}

            {quotation.status === 'sent' && (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="h-4 w-4 shrink-0" /> Quotation saved — awaiting customer
                  </div>
                  <button onClick={handleRevert} disabled={isPending}
                    className="btn-ghost text-xs px-3">
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit2 className="h-3.5 w-3.5" />}
                    Edit
                  </button>
                </div>

                {/* Admin / supervisor can approve or decline on behalf of customer */}
                {canApprove && (
                  <div className="flex gap-2">
                    <button onClick={handleAdminApprove} disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 disabled:opacity-50">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </button>
                    <button onClick={handleAdminDecline} disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 disabled:opacity-50">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                      Decline
                    </button>
                  </div>
                )}

                {customerPhone && (
                  <a href={buildWhatsAppHref()} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30">
                    <MessageCircle className="h-4 w-4" />
                    Share Quotation via WhatsApp
                  </a>
                )}
              </div>
            )}

            {quotation.status === 'approved' && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 w-full">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Customer Approved — Work Authorized
                </span>
              </div>
            )}

            {quotation.status === 'declined' && (
              <button onClick={handleRevert} disabled={isPending} className="btn-primary flex-1">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                Revise &amp; Resend
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

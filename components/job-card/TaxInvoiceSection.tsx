'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { Receipt, Loader2, Check, MessageCircle, AlertTriangle, BadgeCheck, Plus, Trash2, Edit2, X, ChevronDown, RefreshCw, Download, Upload } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
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
// i have nothing to commit 
type TaxInvoice = {
  id: string
  invoice_number: string
  job_card_id: string
  proforma_id: string | null
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

const inputSm = 'flex-1 rounded-lg border px-2.5 py-2 text-sm focus:border-brand/50 focus:outline-none transition bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/20'

export default function TaxInvoiceSection({
  jobId,
  jobNumber,
  customerPhone,
  customerName,
  vehiclePlate,
  canCreate,
  onJobUpdate,
  readOnly,
}: {
  jobId: string
  jobNumber: string
  customerPhone?: string
  customerName?: string
  vehiclePlate?: string
  canCreate?: boolean
  onJobUpdate?: () => void
  readOnly?: boolean
}) {
  const [invoice, setInvoice] = useState<TaxInvoice | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [confirmMarkPaid, setConfirmMarkPaid] = useState(false)
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [importing, setImporting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const [catalog, setCatalog] = useState<{ id: string; name: string; default_price: number }[]>([])

  const [itemType, setItemType] = useState<'service' | 'part' | 'labor'>('service')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')
  const [editingItem, setEditingItem] = useState<{
    id: string; description: string; quantity: string; unit_price: string
  } | null>(null)

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

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setCatalog(d.services ?? []))
      .catch(() => { })
  }, [])

  const isDraft = invoice?.status === 'draft'
  const isIssued = invoice?.status === 'issued'
  const isPaid = invoice?.status === 'paid'

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: jobId }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed to create invoice'); return }
      await load()
      toast.success('Tax invoice created')
    } catch { toast.error('Failed to create invoice') }
    finally { setCreating(false) }
  }

  function handleDiscount() {
    if (!invoice) return
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
    if (!invoice) return
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
    setConfirmMarkPaid(true)
  }

  function doMarkPaid() {
    if (!invoice) return
    setConfirmMarkPaid(false)
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
        onJobUpdate?.()
      } catch { toast.error('Failed to mark as paid') }
    })
  }

  function handleSyncFromProforma() {
    if (!invoice) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_from_proforma' }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Sync failed'); return }
        setInvoice(d.invoice)
        setDiscount(d.invoice.discount?.toString() ?? '0')
        toast.success('Tax invoice synced from proforma')
      } catch { toast.error('Sync failed') }
    })
  }

  function handleAddItem() {
    if (!itemDesc.trim() || !itemPrice || !invoice) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_type: itemType,
            description: itemDesc.trim(),
            quantity: parseFloat(itemQty) || 1,
            unit_price: parseFloat(itemPrice),
          }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed to add item'); return }
        setInvoice(d.invoice)
        setItemDesc(''); setItemQty('1'); setItemPrice('')
        toast.success('Item added')
      } catch { toast.error('Failed to add item') }
    })
  }

  function handleSaveEditItem() {
    if (!invoice || !editingItem) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}/items?item_id=${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: editingItem.description,
            quantity: parseFloat(editingItem.quantity) || 1,
            unit_price: parseFloat(editingItem.unit_price) || 0,
          }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed to save'); return }
        setInvoice(d.invoice); setEditingItem(null)
        toast.success('Item updated')
      } catch { toast.error('Failed to update item') }
    })
  }

  function handleRemoveItem(itemId: string) {
    if (!invoice) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tax-invoices/${invoice.id}/items?item_id=${itemId}`, { method: 'DELETE' })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setInvoice(d.invoice)
        toast.success('Item removed')
      } catch { toast.error('Failed to remove item') }
    })
  }

  function buildShareHref() {
    if (!customerPhone) return '#'
    const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const plate = vehiclePlate ?? ''
    const trackUrl = `${base}/track${plate ? `?plate=${encodeURIComponent(plate)}` : ''}`
    const firstName = customerName?.split(' ')[0] ?? 'there'
    const phone = customerPhone.replace(/(\+?\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4')
    const msg = [
      `Hi ${firstName}! 👋`,
      ``,
      `📱 Mobile: ${phone}`,
      ...(plate ? [`🚗 Vehicle: ${plate}`] : []),
      ``,
      `Your tax invoice is ready at *Bakkah Premium Auto Care*.`,
      ``,
      `💰 *Amount Due: AED ${invoice?.total?.toFixed(2)}* (incl. 5% VAT)`,
      ``,
      `👇 *Tap the link below to view your invoice:*`,
      trackUrl,
      ``,
      `_(Just enter your mobile number to verify — no password needed)_`,
      ``,
      `Questions? Call or WhatsApp: 📞 +971 54 588 6999`,
    ].join('\n')
    return `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  async function exportExcel() {
    if (!invoice) return
    const XLSX = await import('xlsx')
    const rows = invoice.items.map(it => ({
      'Type': it.item_type,
      'Description': it.description,
      'Qty': it.quantity,
      'Unit Price (AED)': it.unit_price,
      'Total (AED)': it.total_price,
    }))
    const summary = [{
      'Invoice Number': invoice.invoice_number,
      'Status': STATUS_LABEL[invoice.status] ?? invoice.status,
      'Subtotal (AED)': invoice.subtotal,
      'Discount (AED)': invoice.discount,
      'VAT 5% (AED)': invoice.vat_amount,
      'Total (AED)': invoice.total,
    }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Items')
    XLSX.writeFile(wb, `${invoice.invoice_number}.xlsx`)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!invoice) return
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
      let imported = 0; let skipped = 0
      for (const row of rows) {
        const desc = (row['Description'] ?? row['description'] ?? '') as string
        if (!desc.trim()) { skipped++; continue }
        const rawType = ((row['Type'] ?? row['type'] ?? 'service') as string).toLowerCase().trim()
        const item_type = (['service', 'part', 'labor'].includes(rawType) ? rawType : 'service') as 'service' | 'part' | 'labor'
        const quantity = parseFloat((row['Qty'] ?? row['qty'] ?? row['quantity'] ?? '1') as string) || 1
        const unit_price = parseFloat((row['Unit Price (AED)'] ?? row['Unit Price'] ?? row['unit_price'] ?? row['Price'] ?? '0') as string) || 0
        const res = await fetch(`/api/tax-invoices/${invoice.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type, description: desc.trim(), quantity, unit_price }),
        })
        if (res.ok) { imported++ } else { skipped++ }
      }
      toast.success(`Imported ${imported} item${imported !== 1 ? 's' : ''}${skipped ? ` · ${skipped} skipped` : ''}`)
      await load()
    } catch { toast.error('Failed to import file') }
    finally { setImporting(false) }
  }

  if (invoice === undefined) {
    return (
      <div className="card flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    )
  }

  const inpCls = 'rounded-md border border-brand/30 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-brand dark:bg-white/[0.06] dark:text-white dark:border-brand/40'

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3 dark:border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 shrink-0">
            <Receipt className="h-3.5 w-3.5 text-brand" />
          </div>
          <h3 className="section-title">Tax Invoice</h3>
          {invoice && (
            <>
              <span className="font-mono text-xs text-gray-400 dark:text-white/40 hidden sm:inline">{invoice.invoice_number}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold ml-auto sm:ml-0', STATUS_BADGE[invoice.status])}>
                {STATUS_LABEL[invoice.status]}
              </span>
            </>
          )}
        </div>
        {invoice && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs text-gray-400 dark:text-white/40 sm:hidden">{invoice.invoice_number}</span>
            <div className="ml-auto flex items-center gap-1.5 flex-wrap">
              {!readOnly && (
                <>
                  <button
                    onClick={handleSyncFromProforma}
                    disabled={isPending}
                    className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 disabled:opacity-40">
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Sync
                  </button>
                  <button
                    onClick={() => importRef.current?.click()}
                    disabled={importing}
                    className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-colors disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/40 dark:hover:text-brand">
                    {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Import
                  </button>
                  <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
                </>
              )}
              <button
                onClick={exportExcel}
                disabled={!invoice.items.length}
                className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-colors disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/40 dark:hover:text-brand">
                <Download className="h-3 w-3" /> Export
              </button>
              {customerPhone && (
                <a href={buildShareHref()} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <MessageCircle className="h-3 w-3" /> Share
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {!invoice ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Receipt className="h-6 w-6 text-brand/60" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-white/70">No tax invoice yet</p>
          <p className="text-xs text-gray-400 dark:text-white/30">Auto-created as draft when the job is delivered</p>
          {!readOnly && canCreate && (
            <button onClick={handleCreate} disabled={creating} className="btn-primary mt-1">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Tax Invoice
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Amendment notice for issued/paid invoices */}
          {(isIssued || isPaid) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                This invoice is {invoice.status}. Edits are permitted — per UAE FTA regulations, significant amendments should be documented with a credit/debit note.
              </p>
            </div>
          )}

          {/* Draft notice */}
          {isDraft && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Draft — review items and apply any final discount, then issue to finalise.
              </p>
            </div>
          )}

          {/* Items — mobile cards */}
          {invoice.items.length > 0 && (
            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.06] rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
              {invoice.items.map(item => {
                const isEditing = editingItem?.id === item.id
                const liveTotal = isEditing
                  ? (parseFloat(editingItem!.quantity) || 0) * (parseFloat(editingItem!.unit_price) || 0)
                  : item.total_price
                return (
                  <div key={item.id} className="bg-white dark:bg-white/[0.02] p-3">
                    {!readOnly && isEditing ? (
                      <div className="space-y-3">
                        <input value={editingItem!.description}
                          onChange={e => setEditingItem(prev => prev && { ...prev, description: e.target.value })}
                          className="input-base w-full" placeholder="Description" />
                        <div className="flex gap-2">
                          <div className="w-24">
                            <label className="label text-[10px] mb-1">Qty</label>
                            <input type="number" min={0.5} step={0.5} value={editingItem!.quantity}
                              onChange={e => setEditingItem(prev => prev && { ...prev, quantity: e.target.value })}
                              className="input-base w-full" />
                          </div>
                          <div className="flex-1">
                            <label className="label text-[10px] mb-1">Price (AED)</label>
                            <input type="number" min={0} value={editingItem!.unit_price}
                              onChange={e => setEditingItem(prev => prev && { ...prev, unit_price: e.target.value })}
                              className="input-base w-full" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-white/40">
                            Total: <strong className="text-gray-900 dark:text-white">{formatAED(liveTotal)}</strong>
                          </span>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEditItem} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 h-auto">Save</button>
                            <button onClick={() => setEditingItem(null)} className="btn-ghost text-xs px-3 py-1.5 h-auto">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2 mb-2">
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 mt-0.5', ITEM_TYPE_CLS[item.item_type])}>
                            {item.item_type}
                          </span>
                          <span className="text-sm text-gray-800 dark:text-white/80 flex-1 min-w-0 leading-snug">{item.description}</span>
                          {!readOnly && (
                            <div className="flex shrink-0 -mr-1">
                              <button onClick={() => setEditingItem({ id: item.id, description: item.description, quantity: item.quantity.toString(), unit_price: item.unit_price.toString() })}
                                disabled={isPending} className="p-2 text-gray-400 active:text-brand transition-colors rounded-lg">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleRemoveItem(item.id)} disabled={isPending}
                                className="p-2 text-gray-400 active:text-red-400 transition-colors rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 dark:text-white/30">{item.quantity} × {formatAED(item.unit_price)}</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatAED(item.total_price)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Items table — desktop only */}
          {invoice.items.length > 0 && (
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-100 dark:border-white/[0.06] -mx-1">
              <table className="min-w-[480px] w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-20">Type</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">Description</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-12">Qty</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-24">Unit Price</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-24">Total (AED)</th>
                    {!readOnly && <th className="w-16" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {invoice.items.map(item => {
                    const isEditing = editingItem?.id === item.id
                    const liveTotal = isEditing
                      ? (parseFloat(editingItem!.quantity) || 0) * (parseFloat(editingItem!.unit_price) || 0)
                      : item.total_price
                    return (
                      <tr key={item.id} className="group">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', ITEM_TYPE_CLS[item.item_type])}>
                            {item.item_type}
                          </span>
                        </td>
                        {!readOnly && isEditing ? (
                          <>
                            <td className="px-2 py-1.5 min-w-[160px]">
                              <input value={editingItem!.description}
                                onChange={e => setEditingItem(prev => prev && { ...prev, description: e.target.value })}
                                className={cn(inpCls, 'w-full')} />
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" min={0.5} step={0.5} value={editingItem!.quantity}
                                onChange={e => setEditingItem(prev => prev && { ...prev, quantity: e.target.value })}
                                className={cn(inpCls, 'w-16')} />
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" min={0} value={editingItem!.unit_price}
                                onChange={e => setEditingItem(prev => prev && { ...prev, unit_price: e.target.value })}
                                className={cn(inpCls, 'w-24')} />
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums dark:text-white whitespace-nowrap">
                              {formatAED(liveTotal)}
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-1">
                                <button onClick={handleSaveEditItem} disabled={isPending}
                                  className="flex items-center justify-center rounded-md bg-brand p-1.5 text-white hover:bg-brand/80 disabled:opacity-50">
                                  <Check className="h-3 w-3" />
                                </button>
                                <button onClick={() => setEditingItem(null)} disabled={isPending}
                                  className="flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-white/50">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-gray-800 dark:text-white/80 min-w-[160px]">{item.description}</td>
                            <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50 whitespace-nowrap">{item.quantity}</td>
                            <td className="px-3 py-2 text-gray-500 tabular-nums dark:text-white/50 whitespace-nowrap">{formatAED(item.unit_price)}</td>
                            <td className="px-3 py-2 font-semibold text-gray-900 tabular-nums dark:text-white whitespace-nowrap">{formatAED(item.total_price)}</td>
                            {!readOnly && (
                              <td className="px-2 py-2">
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    onClick={() => setEditingItem({ id: item.id, description: item.description, quantity: item.quantity.toString(), unit_price: item.unit_price.toString() })}
                                    disabled={isPending}
                                    className="text-gray-300 hover:text-brand transition-colors dark:text-white/20 dark:hover:text-brand">
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleRemoveItem(item.id)} disabled={isPending}
                                    className="text-gray-300 hover:text-red-400 transition-colors dark:text-white/20">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add item — hidden when locked */}
          {!readOnly && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative w-28 flex-none">
                  <select value={itemType} onChange={e => {
                    setItemType(e.target.value as 'service' | 'part' | 'labor')
                    setItemDesc(''); setItemPrice('')
                  }} className={cn(inputSm, 'w-full appearance-none pr-7')}>
                    <option value="service">Service</option>
                    <option value="part">Part</option>
                    <option value="labor">Labor</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/30" />
                </div>
                {itemType === 'service' ? (
                  <div className="relative flex-1">
                    <select value={itemDesc} onChange={e => {
                      const name = e.target.value
                      setItemDesc(name)
                      const match = catalog.find(s => s.name === name)
                      if (match && match.default_price > 0) setItemPrice(match.default_price.toString())
                      else if (!name) setItemPrice('')
                    }} className={cn(inputSm, 'w-full appearance-none pr-7')}>
                      <option value="">— Select service —</option>
                      {catalog.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/30" />
                  </div>
                ) : (
                  <input value={itemDesc} onChange={e => setItemDesc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                    placeholder="Description" className={cn(inputSm, 'flex-1')} />
                )}
              </div>
              <div className="flex gap-2">
                <input value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="Qty"
                  type="number" min={0.5} step={0.5} className={cn(inputSm, 'w-20 flex-none')} />
                <input value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="Price (AED)"
                  type="number" min={0} className={cn(inputSm, 'flex-1')} />
                <button onClick={handleAddItem} disabled={isPending || !itemDesc.trim() || !itemPrice}
                  className="btn-primary text-xs px-3 py-2 h-auto flex-none">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Plus className="h-3.5 w-3.5" /> Add</>}
                </button>
              </div>
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
                <span className="text-gray-500 dark:text-white/50">Discount</span>
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
            <p className="text-[10px] text-gray-400 dark:text-white/25 text-right">Prices in AED · 5% UAE VAT</p>
          </div>

          {/* Discount — hidden when locked */}
          {!readOnly && (
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
              <label className="label">Notes</label>
              {!readOnly && !editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="text-xs text-brand hover:underline flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {!readOnly && editingNotes ? (
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
            ) : (
              <p className="text-xs text-gray-300 dark:text-white/20 italic">No notes</p>
            )}
          </div>

          {/* Issue button — draft only, hidden when locked */}
          {!readOnly && isDraft && (
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button onClick={handleIssue} disabled={isPending} className="btn-primary flex-1">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Issue Tax Invoice
              </button>
            </div>
          )}

          {/* Issued — show Mark as Paid, hidden when locked */}
          {!readOnly && isIssued && (
            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tax Invoice Issued</span>
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
            <div className="flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 mt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Invoice Paid</p>
                <p className="text-xs text-blue-500/70 dark:text-blue-400/60">Payment received and recorded</p>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmMarkPaid}
        title="Mark Invoice as Paid?"
        message="This will record the payment as received. This action cannot be undone."
        confirmLabel="Mark as Paid"
        variant="warning"
        loading={isPending}
        onConfirm={doMarkPaid}
        onCancel={() => setConfirmMarkPaid(false)}
      />
    </div>
  )
}

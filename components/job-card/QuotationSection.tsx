'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { FileText, Plus, Trash2, Loader2, Send, Edit2, Check, ChevronDown, AlertTriangle, MessageCircle, Mail, X, RefreshCw, Download, Upload } from 'lucide-react'
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
  customerEmail,
  vehiclePlate,
  canApprove,
  onStatusChange,
  onEmailNotify,
  onJobUpdate,
  readOnly,
}: {
  jobId: string
  jobNumber?: string
  customerPhone?: string
  customerName?: string
  customerEmail?: string
  vehiclePlate?: string
  canApprove?: boolean
  onStatusChange?: (status: string | null) => void
  onEmailNotify?: () => void
  onJobUpdate?: () => void
  readOnly?: boolean
}) {
  const [quotation, setQuotation] = useState<Quotation | null | undefined>(undefined)

  function applyQuotation(q: Quotation | null) {
    setQuotation(q)
    onStatusChange?.(q?.status ?? null)
  }
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    id: string; description: string; quantity: string; unit_price: string
  } | null>(null)

  const [catalog, setCatalog] = useState<CatalogService[]>([])

  const [itemType, setItemType] = useState<'service' | 'part' | 'labor'>('service')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')

  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  async function exportExcel() {
    if (!quotation) return
    const XLSX = await import('xlsx')
    const rows = quotation.items.map(i => ({
      Type: i.item_type,
      Description: i.description,
      Qty: i.quantity,
      'Unit Price (AED)': i.unit_price,
      'Total (AED)': i.total_price,
    }))
    const summary = [
      { Field: 'Quotation Number', Value: quotation.quotation_number },
      { Field: 'Status', Value: quotation.status },
      { Field: 'Subtotal (AED)', Value: quotation.subtotal },
      { Field: 'Discount (AED)', Value: quotation.discount },
      { Field: 'VAT 5% (AED)', Value: quotation.vat_amount },
      { Field: 'Total (AED)', Value: quotation.total },
    ]
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(rows)
    ws1['!cols'] = [{ wch: 10 }, { wch: 42 }, { wch: 6 }, { wch: 18 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Items')
    const ws2 = XLSX.utils.json_to_sheet(summary)
    ws2['!cols'] = [{ wch: 22 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary')
    XLSX.writeFile(wb, `${quotation.quotation_number}.xlsx`)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !quotation) return
    e.target.value = ''
    setImporting(true)
    try {
      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' })
      let added = 0, failed = 0
      for (const row of rows) {
        const description = String(row['Description'] || row['description'] || '').trim()
        const rawType = String(row['Type'] || row['type'] || 'service').toLowerCase().trim()
        const item_type = (['service', 'part', 'labor'].includes(rawType) ? rawType : 'service') as 'service' | 'part' | 'labor'
        const quantity = parseFloat(String(row['Qty'] || row['qty'] || row['Quantity'] || '1')) || 1
        const unit_price = parseFloat(String(row['Unit Price (AED)'] || row['Unit Price'] || row['unit_price'] || row['Price'] || '0'))
        if (!description || !unit_price) { failed++; continue }
        try {
          const res = await fetch(`/api/quotations/${quotation.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_type, description, quantity, unit_price }),
          })
          if (res.ok) added++; else failed++
        } catch { failed++ }
      }
      await load()
      toast.success(`Imported ${added} item${added !== 1 ? 's' : ''}${failed ? ` · ${failed} skipped` : ''}`)
    } catch {
      toast.error('Failed to read file')
    } finally {
      setImporting(false)
    }
  }

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
        onJobUpdate?.()
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

  function handleSaveEditItem() {
    if (!quotation || !editingItem) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/quotations/${quotation.id}/items?item_id=${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: editingItem.description,
            quantity: parseFloat(editingItem.quantity) || 1,
            unit_price: parseFloat(editingItem.unit_price) || 0,
          }),
        })
        if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to save'); return }
        const d = await res.json(); applyQuotation(d.quotation); setEditingItem(null)
        toast.success('Item updated')
      } catch { toast.error('Failed to update item') }
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
        onJobUpdate?.()
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
        onJobUpdate?.()
      } catch { toast.error('Failed to decline quotation') }
    })
  }

  const inputSm = 'flex-1 rounded-lg border px-2.5 py-2 text-sm focus:border-brand/50 focus:outline-none transition bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/20'
  const inpCls = 'rounded-md border border-brand/30 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-brand dark:bg-white/[0.06] dark:text-white dark:border-brand/40'

  function buildWhatsAppHref(): string {
    if (!customerPhone || !quotation) return '#'
    const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const plate = vehiclePlate ?? ''
    const trackUrl = `${base}/track${plate ? `?plate=${encodeURIComponent(plate)}` : ''}`
    const firstName = customerName?.split(' ')[0] ?? 'there'
    const phone = customerPhone.replace(/(\+?\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4')

    const lines = [
      `Hi ${firstName}! 👋`,
      ``,
      `📱 Mobile: ${phone}`,
      ...(plate ? [`🚗 Vehicle: ${plate}`] : []),
      ``,
      `Your vehicle has been assessed at *Bakkah Premium Auto Care* and we have prepared a repair estimate for you.`,
      ``,
      `💰 *Estimated Total: AED ${quotation.total.toFixed(2)}* (incl. 5% VAT)`,
      ``,
      `👇 *Tap the link below to view your quotation and respond:*`,
      trackUrl,
      ``,
      `Once you open the link, enter your mobile number, then:`,
      `✅ Tap *APPROVE* — to confirm and start the work`,
      `❌ Tap *DECLINE* — if you'd like to discuss first`,
      ``,
      `Questions? Call or WhatsApp: 📞 +971 54 588 6999`,
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
            <div className="ml-auto flex items-center gap-1.5">
              {!readOnly && (
                <>
                  <button
                    onClick={() => importRef.current?.click()}
                    disabled={importing || isPending}
                    title="Import items from Excel"
                    className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-colors disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/40 dark:hover:text-brand"
                  >
                    {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Import
                  </button>
                  <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
                </>
              )}
              <button
                onClick={exportExcel}
                disabled={quotation.items.length === 0}
                title="Export to Excel"
                className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 hover:border-brand/40 hover:text-brand hover:bg-brand/5 transition-colors disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/40 dark:hover:text-brand"
              >
                <Download className="h-3 w-3" /> Export
              </button>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', STATUS_BADGE[quotation.status]?.cls)}>
                {STATUS_BADGE[quotation.status]?.label}
              </span>
            </div>
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
          {!readOnly && (
            <button onClick={handleCreate} disabled={creating} className="btn-primary">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Quotation
            </button>
          )}
        </div>
      )}

      {quotation && (
        <>
          {/* Editing notice for locked statuses */}
          {(quotation.status === 'approved' || quotation.status === 'declined') && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Editing {quotation.status} quotation — changes will update proforma values. Use &ldquo;Sync from Quotation&rdquo; on the Proforma to push changes.
              </p>
            </div>
          )}

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

          {/* Items table — always editable */}
          {quotation.items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/[0.06] -mx-1">
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
                  {quotation.items.map(item => {
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
                    setItemDesc('')
                    setItemPrice('')
                  }} className={cn(inputSm, 'w-full appearance-none pr-7')}>
                    <option value="service">Service</option>
                    <option value="part">Part</option>
                    <option value="labor">Labor</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/30" />
                </div>

                {itemType === 'service' ? (
                  <div className="relative flex-1">
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
                    className={cn(inputSm, 'flex-1')}
                  />
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
              <label className="label">Notes to Customer</label>
              {!readOnly && !editingNotes && (
                <button onClick={() => setEditingNotes(true)}
                  className="text-xs text-brand hover:underline flex items-center gap-1">
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {!readOnly && editingNotes ? (
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
                : <p className="text-xs text-gray-300 dark:text-white/20 italic">No notes</p>
            )}
          </div>

          {/* Actions — hidden when locked */}
          {!readOnly && <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
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
                    Revert to Draft
                  </button>
                </div>

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

                {(customerPhone || customerEmail) && (
                  <div className="flex gap-2">
                    {customerPhone && (
                      <a href={buildWhatsAppHref()} target="_blank" rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    )}
                    {customerEmail && onEmailNotify && (
                      <button onClick={onEmailNotify}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25">
                        <Mail className="h-4 w-4" />
                        Email
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {quotation.status === 'approved' && (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex-1">
                    Customer Approved — Work Authorized
                  </span>
                  <button onClick={handleRevert} disabled={isPending}
                    className="text-xs text-emerald-600 hover:underline dark:text-emerald-400 flex items-center gap-1">
                    <Edit2 className="h-3 w-3" /> Revise
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-white/30 text-center">
                  You can still edit items above — use &ldquo;Sync from Quotation&rdquo; on the Proforma to reflect changes.
                </p>
              </div>
            )}

            {quotation.status === 'declined' && (
              <div className="flex w-full flex-col gap-2">
                <button onClick={handleRevert} disabled={isPending} className="btn-primary flex-1">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit2 className="h-4 w-4" />}
                  Revise &amp; Resend
                </button>
                <p className="text-xs text-gray-400 dark:text-white/30 text-center">
                  Edit items above, then click &ldquo;Revise &amp; Resend&rdquo; to move back to draft.
                </p>
              </div>
            )}
          </div>}

          {/* Send via WhatsApp shortcut for draft — hidden when locked */}
          {!readOnly && quotation.status === 'draft' && customerPhone && quotation.items.length > 0 && (
            <div className="flex gap-2">
              <a href={buildWhatsAppHref()} target="_blank" rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-300">
                <MessageCircle className="h-4 w-4" />
                Share via WhatsApp
              </a>
              {customerEmail && onEmailNotify && (
                <button onClick={onEmailNotify}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Mail className="h-4 w-4" />
                  Email
                </button>
              )}
            </div>
          )}

          {/* Refresh button */}
          <div className="flex justify-end">
            <button onClick={load} disabled={isPending}
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 flex items-center gap-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
        </>
      )}
    </div>
  )
}

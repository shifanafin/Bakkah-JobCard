'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { FileText, Plus, Trash2, Loader2, Check, ChevronDown, MessageCircle, Edit2, X, RefreshCw, Download, Upload } from 'lucide-react'
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

type Proforma = {
  id: string
  proforma_number: string
  job_card_id: string
  quotation_id: string | null
  invoice_date: string
  due_date?: string | null
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

const inputSm = 'flex-1 rounded-lg border px-2.5 py-2 text-sm focus:border-brand/50 focus:outline-none transition bg-white border-gray-200 text-gray-900 placeholder:text-gray-300 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/20'

export default function ProformaSection({
  jobId,
  jobNumber,
  customerPhone,
}: {
  jobId: string
  jobNumber: string
  customerPhone?: string
}) {
  const [proforma, setProforma] = useState<Proforma | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const [editingItem, setEditingItem] = useState<{
    id: string; description: string; quantity: string; unit_price: string
  } | null>(null)
  const [catalog, setCatalog] = useState<{ id: string; name: string; default_price: number }[]>([])

  const [itemType, setItemType] = useState<'service' | 'part' | 'labor'>('service')
  const [itemDesc, setItemDesc] = useState('')
  const [itemQty, setItemQty] = useState('1')
  const [itemPrice, setItemPrice] = useState('')
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [importing, setImporting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const res = await fetch(`/api/proforma-invoices?job_card_id=${jobId}`)
      const d = await res.json()
      const pf = d.proforma ?? null
      setProforma(pf)
      if (pf) { setDiscount(pf.discount?.toString() ?? '0'); setNotes(pf.notes ?? '') }
    } catch { setProforma(null) }
  }

  useEffect(() => { load() }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setCatalog(d.services ?? []))
      .catch(() => {})
  }, [])

  function handleAddItem() {
    if (!itemDesc.trim() || !itemPrice || !proforma) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proforma-invoices/${proforma.id}/items`, {
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
        setProforma(d.proforma)
        setItemDesc(''); setItemQty('1'); setItemPrice('')
        toast.success('Item added')
      } catch { toast.error('Failed to add item') }
    })
  }

  function handleSaveEditItem() {
    if (!proforma || !editingItem) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proforma-invoices/${proforma.id}/items?item_id=${editingItem.id}`, {
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
        setProforma(d.proforma); setEditingItem(null)
        toast.success('Item updated')
      } catch { toast.error('Failed to update item') }
    })
  }

  function handleRemoveItem(itemId: string) {
    if (!proforma) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proforma-invoices/${proforma.id}/items?item_id=${itemId}`, { method: 'DELETE' })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setProforma(d.proforma)
        toast.success('Item removed')
      } catch { toast.error('Failed to remove item') }
    })
  }

  function handleDiscount() {
    if (!proforma) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proforma-invoices/${proforma.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discount: parseFloat(discount) || 0 }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setProforma(d.proforma)
        toast.success('Discount applied')
      } catch { toast.error('Failed to apply discount') }
    })
  }

  function handleSaveNotes() {
    if (!proforma) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proforma-invoices/${proforma.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Failed'); return }
        setProforma(d.proforma); setEditingNotes(false)
        toast.success('Notes saved')
      } catch { toast.error('Failed to save notes') }
    })
  }

  function handleSyncFromQuotation() {
    if (!proforma) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proforma-invoices/${proforma.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_from_quotation' }),
        })
        const d = await res.json()
        if (!res.ok) { toast.error(d.error || 'Sync failed'); return }
        setProforma(d.proforma)
        setDiscount(d.proforma.discount?.toString() ?? '0')
        toast.success('Proforma synced from quotation')
      } catch { toast.error('Sync failed') }
    })
  }

  async function exportExcel() {
    if (!proforma) return
    const XLSX = await import('xlsx')
    const rows = proforma.items.map(it => ({
      'Type': it.item_type,
      'Description': it.description,
      'Qty': it.quantity,
      'Unit Price (AED)': it.unit_price,
      'Total (AED)': it.total_price,
    }))
    const summary = [{
      'Proforma Number': proforma.proforma_number,
      'Subtotal (AED)': proforma.subtotal,
      'Discount (AED)': proforma.discount,
      'VAT 5% (AED)': proforma.vat_amount,
      'Total (AED)': proforma.total,
    }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Items')
    XLSX.writeFile(wb, `${proforma.proforma_number}.xlsx`)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!proforma) return
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
        const res = await fetch(`/api/proforma-invoices/${proforma.id}/items`, {
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

  function buildShareHref() {
    if (!customerPhone) return '#'
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const trackUrl = `${origin}/track?q=${encodeURIComponent(jobNumber)}`
    const msg = [
      `Dear Customer,`,
      `Your Proforma Invoice ${proforma?.proforma_number} for Job ${jobNumber} is ready.`,
      ``,
      `Track your vehicle and view the proforma: ${trackUrl}`,
      ``,
      `Total: AED ${proforma?.total?.toFixed(2)}`,
      ``,
      `Bakkah Premium Auto Care | +971 54 588 6999`,
    ].join('\n')
    return `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
  }

  if (proforma === undefined) return null
  if (proforma === null) return null

  const inpCls = 'rounded-md border border-brand/30 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:border-brand dark:bg-white/[0.06] dark:text-white dark:border-brand/40'

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
          <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="section-title">Proforma Invoice</h3>
        <span className="font-mono text-xs text-gray-400 dark:text-white/40">{proforma.proforma_number}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 disabled:opacity-50">
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Import
          </button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} className="hidden" />
          <button
            onClick={exportExcel}
            disabled={!proforma.items.length}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          {proforma.quotation_id && (
            <button
              onClick={handleSyncFromQuotation}
              disabled={isPending}
              title="Sync items and totals from the linked quotation"
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 disabled:opacity-50">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sync from Quotation
            </button>
          )}
          {customerPhone && (
            <a href={buildShareHref()} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <MessageCircle className="h-3.5 w-3.5" /> Share
            </a>
          )}
        </div>
      </div>

      {/* Items table — always editable */}
      {proforma.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-white/[0.06] -mx-1">
          <table className="min-w-[480px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-20">Type</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">Description</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-12">Qty</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-24">Unit</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30 w-24">Total</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
              {proforma.items.map(item => {
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
                    {isEditing ? (
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
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add item — always available */}
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

      {/* Totals */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2 dark:border-white/[0.07] dark:bg-surface-900">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-white/50">Subtotal</span>
          <span className="tabular-nums text-gray-600 dark:text-white/70">{formatAED(proforma.subtotal)}</span>
        </div>
        {proforma.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-white/50">Discount</span>
            <span className="tabular-nums text-emerald-500">−{formatAED(proforma.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-white/50">VAT (5%)</span>
          <span className="tabular-nums text-gray-600 dark:text-white/70">{formatAED(proforma.vat_amount)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between dark:border-white/[0.08]">
          <span className="font-bold text-gray-900 dark:text-white">Total (incl. VAT)</span>
          <span className="font-bold text-lg text-brand tabular-nums">{formatAED(proforma.total)}</span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-white/25 text-right">Prices in AED · 5% VAT</p>
      </div>

      {/* Discount — always editable */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label">Discount (AED)</label>
          <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)} className="input-base" />
        </div>
        <button onClick={handleDiscount} disabled={isPending} className="btn-ghost h-[42px]">Apply</button>
      </div>

      {/* Notes — always editable */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="label">Notes</label>
          {!editingNotes && (
            <button onClick={() => setEditingNotes(true)} className="text-xs text-brand hover:underline">Edit</button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="input-base w-full min-h-[80px] resize-none"
              placeholder="Terms, conditions, or notes for the customer..." rows={3} />
            <div className="flex gap-2">
              <button onClick={handleSaveNotes} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 h-auto">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
              </button>
              <button onClick={() => { setEditingNotes(false); setNotes(proforma.notes ?? '') }}
                className="btn-ghost text-xs px-3 py-1.5 h-auto">Cancel</button>
            </div>
          </div>
        ) : proforma.notes ? (
          <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">{proforma.notes}</p>
        ) : (
          <p className="text-xs text-gray-300 dark:text-white/20 italic">No notes — click Edit to add</p>
        )}
      </div>
    </div>
  )
}

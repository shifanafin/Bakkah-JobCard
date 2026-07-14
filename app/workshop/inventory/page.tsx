'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, Loader2, X, Check, Minus } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 20
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import SwipeToDelete from '@/components/ui/SwipeToDelete'

type InventoryItem = {
  id: string
  name: string
  sku?: string
  category: string
  description?: string
  unit: string
  cost_price: number
  selling_price: number
  stock_quantity: number
  min_stock_level: number
  supplier?: string
  location?: string
  active: boolean
  created_at: string
}

type ItemForm = {
  name: string
  sku: string
  category: string
  description: string
  unit: string
  cost_price: string
  selling_price: string
  stock_quantity: string
  min_stock_level: string
  supplier: string
  location: string
}

const CATEGORIES = ['all', 'detailing', 'paint', 'chemical', 'tool', 'consumable', 'parts', 'general']
const CATEGORY_LABELS: Record<string, string> = {
  all: 'All', detailing: 'Detailing', paint: 'Paint', chemical: 'Chemical',
  tool: 'Tool', consumable: 'Consumable', parts: 'Parts', general: 'General',
}

const EMPTY_FORM: ItemForm = {
  name: '', sku: '', category: 'general', description: '', unit: 'pcs',
  cost_price: '', selling_price: '', stock_quantity: '', min_stock_level: '5',
  supplier: '', location: '',
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems((data.items ?? []) as InventoryItem[])
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(item => {
    const matchCat = categoryFilter === 'all' || item.category === categoryFilter
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (item.supplier ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalItems = items.length
  const lowStock = items.filter(i => i.stock_quantity <= i.min_stock_level).length
  const totalValue = items.reduce((s, i) => s + i.stock_quantity * i.selling_price, 0)

  function openAdd() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(item: InventoryItem) {
    setEditItem(item)
    setForm({
      name: item.name,
      sku: item.sku ?? '',
      category: item.category,
      description: item.description ?? '',
      unit: item.unit,
      cost_price: item.cost_price.toString(),
      selling_price: item.selling_price.toString(),
      stock_quantity: item.stock_quantity.toString(),
      min_stock_level: item.min_stock_level.toString(),
      supplier: item.supplier ?? '',
      location: item.location ?? '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        category: form.category,
        description: form.description.trim() || null,
        unit: form.unit.trim(),
        cost_price: parseFloat(form.cost_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        stock_quantity: parseFloat(form.stock_quantity) || 0,
        min_stock_level: parseFloat(form.min_stock_level) || 5,
        supplier: form.supplier.trim() || null,
        location: form.location.trim() || null,
      }

      const res = editItem
        ? await fetch(`/api/inventory/${editItem.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
        : await fetch('/api/inventory', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editItem ? 'Item updated' : 'Item added')
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  async function executeDelete(id: string) {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Item deleted')
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      toast.error('Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  async function adjustStock(id: string, delta: number) {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(0, item.stock_quantity + delta)
    setAdjustingId(id)
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock_quantity: newQty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setItems(prev => prev.map(i => i.id === id ? { ...i, stock_quantity: newQty } : i))
    } catch {
      toast.error('Failed to adjust stock')
    } finally {
      setAdjustingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Inventory" subtitle="Stock management" />

      <div className="p-4 space-y-5 max-w-7xl lg:p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card cursor-default">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">Total Items</p>
          </div>
          <div className={cn('card cursor-default', lowStock > 0 && 'border-amber-300 dark:border-amber-500/40')}>
            <p className={cn('text-2xl font-bold', lowStock > 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white')}>{lowStock}</p>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5 flex items-center gap-1">
              {lowStock > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
              Low Stock
            </p>
          </div>
          <div className="card cursor-default">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              AED {totalValue.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">Total Value</p>
          </div>
        </div>

        {/* Filters + Search + Add */}
        <div className="card space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(1) }}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                  categoryFilter === cat
                    ? 'bg-brand text-black'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white/50 dark:hover:bg-white/[0.1]'
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search items, SKU, supplier..."
                className="input-base w-full ltr:pl-9 rtl:pr-9"
              />
            </div>
            <button onClick={openAdd} className="btn-primary whitespace-nowrap">
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-gray-200 mb-3 dark:text-white/10" />
            <p className="text-sm text-gray-400 dark:text-white/30">No items found</p>
          </div>
        ) : (
          <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-white/[0.07] dark:bg-surface-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Name / SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Min</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Price (AED)</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Cost (AED)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Supplier</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {paginated.map(item => {
                  const isLow = item.stock_quantity <= item.min_stock_level
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]',
                        isLow && 'bg-amber-50/50 dark:bg-amber-500/5'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            {item.sku && <p className="text-xs font-mono text-gray-400 dark:text-white/30">{item.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-white/[0.06] dark:text-white/50">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => adjustStock(item.id, -1)}
                            disabled={adjustingId === item.id || item.stock_quantity <= 0}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-30 dark:border-white/[0.08] dark:text-white/30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={cn(
                            'w-12 text-center tabular-nums font-semibold',
                            isLow ? 'text-amber-500' : 'text-gray-900 dark:text-white'
                          )}>
                            {item.stock_quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => adjustStock(item.id, 1)}
                            disabled={adjustingId === item.id}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors disabled:opacity-30 dark:border-white/[0.08] dark:text-white/30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-white/40">
                        {item.min_stock_level} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                        {item.selling_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500 dark:text-white/40">
                        {item.cost_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-white/40 text-xs">
                        {item.supplier ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand/30 hover:text-brand transition-colors dark:border-white/[0.08] dark:text-white/30"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            disabled={deletingId === item.id}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50 dark:border-white/[0.08] dark:text-white/30"
                          >
                            {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list — swipe-to-delete, stepper/edit stay inline */}
          <div className="md:hidden space-y-2">
            {paginated.map(item => {
              const isLow = item.stock_quantity <= item.min_stock_level
              return (
                <SwipeToDelete key={item.id} onDelete={() => setConfirmDeleteId(item.id)}>
                  <div
                    className={cn(
                      'rounded-2xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-surface-800 p-4 space-y-3',
                      isLow && 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                    )}
                  >
                    {/* Row 1: name/sku + category */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                          {item.sku && <p className="text-xs font-mono text-gray-400 dark:text-white/30">{item.sku}</p>}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:bg-white/[0.06] dark:text-white/50">
                        {item.category}
                      </span>
                    </div>

                    {/* Row 2: stock stepper + min */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => adjustStock(item.id, -1)}
                          disabled={adjustingId === item.id || item.stock_quantity <= 0}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-30 dark:border-white/[0.08] dark:text-white/30"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={cn(
                          'w-14 text-center tabular-nums font-semibold',
                          isLow ? 'text-amber-500' : 'text-gray-900 dark:text-white'
                        )}>
                          {item.stock_quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => adjustStock(item.id, 1)}
                          disabled={adjustingId === item.id}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors disabled:opacity-30 dark:border-white/[0.08] dark:text-white/30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-white/40">
                        Min {item.min_stock_level} {item.unit}
                      </span>
                    </div>

                    {/* Row 3: price/cost/supplier + edit */}
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                          AED {item.selling_price.toFixed(2)}
                        </span>
                        <span className="tabular-nums text-gray-400 dark:text-white/40">
                          Cost {item.cost_price.toFixed(2)}
                        </span>
                        {item.supplier && (
                          <span className="text-gray-400 dark:text-white/40">{item.supplier}</span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(item) }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-brand/30 hover:text-brand transition-colors dark:border-white/[0.08] dark:text-white/30"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </SwipeToDelete>
              )
            })}
          </div>

          <Pagination page={page} totalItems={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-surface-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {editItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:text-white/30 dark:hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-base w-full"
                    placeholder="Item name"
                    required
                  />
                </div>
                <div>
                  <label className="label mb-1">SKU</label>
                  <input
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="input-base w-full font-mono"
                    placeholder="CP-9H-50ML"
                  />
                </div>
                <div>
                  <label className="label mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="input-base w-full"
                  >
                    {CATEGORIES.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1">Unit</label>
                  <input
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="input-base w-full"
                    placeholder="pcs, bottle, litre..."
                  />
                </div>
                <div>
                  <label className="label mb-1">Supplier</label>
                  <input
                    value={form.supplier}
                    onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="label mb-1">Cost Price (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost_price}
                    onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                    className="input-base w-full"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label mb-1">Selling Price (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.selling_price}
                    onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))}
                    className="input-base w-full"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    className="input-base w-full"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_stock_level}
                    onChange={e => setForm(f => ({ ...f, min_stock_level: e.target.value }))}
                    className="input-base w-full"
                    placeholder="5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label mb-1">Location</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="input-base w-full"
                    placeholder="Shelf A3, Storage Room..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="label mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-base w-full resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Remove Inventory Item?"
        message="This item will be marked as inactive and removed from listings."
        confirmLabel="Remove"
        loading={deletingId === confirmDeleteId}
        onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}

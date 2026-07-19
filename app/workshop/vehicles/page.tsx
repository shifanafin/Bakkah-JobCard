'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Search, Plus, Car, Phone, ChevronRight, Loader2, Trash2, Pencil, X, Save } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SwipeToDelete from '@/components/ui/SwipeToDelete'
import { toast } from 'sonner'

type Vehicle = {
  id: string
  plate_number: string
  make: string
  model: string
  year?: number
  color?: string
  vin?: string
  customer_id: string
  customer?: { id: string; name: string; phone: string }
}

type CustomerOption = { id: string; name: string; phone: string }

const emptyForm = { plate_number: '', make: '', model: '', year: '', color: '', vin: '' }

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // New vehicle (with customer picker)
  const [showNew, setShowNew] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Edit vehicle
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete vehicle
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vehicles')
      const d = await res.json()
      setVehicles(d.vehicles ?? [])
    } catch { toast.error('Failed to load vehicles') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (customerSearch.trim().length < 2 || selectedCustomer) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(customerSearch)}`)
        const d = await res.json()
        setCustomerResults(d.customers ?? [])
      } catch { /* ignore */ }
    }, 250)
    return () => clearTimeout(t)
  }, [customerSearch, selectedCustomer])

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    return !q
      || v.plate_number.toLowerCase().includes(q)
      || v.make.toLowerCase().includes(q)
      || v.model.toLowerCase().includes(q)
      || (v.vin ?? '').toLowerCase().includes(q)
      || (v.customer?.name ?? '').toLowerCase().includes(q)
      || (v.customer?.phone ?? '').includes(q)
  })

  const inputCls = 'input-base w-full'

  function resetNewForm() {
    setShowNew(false)
    setSelectedCustomer(null)
    setCustomerSearch('')
    setCustomerResults([])
    setForm(emptyForm)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCustomer) { toast.error('Select a customer first'); return }
    if (!form.plate_number.trim()) { toast.error('Plate number is required'); return }
    if (!form.make.trim()) { toast.error('Make is required'); return }
    if (!form.model.trim()) { toast.error('Model is required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Vehicle added')
      resetNewForm()
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add vehicle')
    } finally { setSaving(false) }
  }

  function startEdit(v: Vehicle) {
    setEditTarget(v)
    setEditForm({
      plate_number: v.plate_number, make: v.make, model: v.model,
      year: v.year ? String(v.year) : '', color: v.color ?? '', vin: v.vin ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/vehicles/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Vehicle updated')
      setVehicles(vs => vs.map(v => v.id === editTarget.id ? { ...v, ...d.vehicle } : v))
      setEditTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update vehicle')
    } finally { setSavingEdit(false) }
  }

  async function handleDelete(v: Vehicle) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/vehicles/${v.id}`, { method: 'DELETE' })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error ?? 'Failed to delete')
      toast.success(`${v.plate_number} deleted`)
      setVehicles(vs => vs.filter(x => x.id !== v.id))
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally { setDeleting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="Vehicles" subtitle={`${vehicles.length} total`} />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search plate, make, model, VIN, owner…"
              className="input-base pl-9 w-full"
            />
          </div>
          <button onClick={() => setShowNew(v => !v)} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Vehicle
          </button>
        </div>

        {/* New vehicle inline form */}
        {showNew && (
          <form onSubmit={handleCreate} className="card space-y-4">
            <h3 className="section-title border-b border-gray-100 dark:border-white/[0.06] pb-3">New Vehicle</h3>

            {/* Customer picker */}
            <div className="relative">
              <label className="label">Owner (Customer) <span className="text-brand">*</span></label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-lg border border-brand/20 bg-brand/[0.03] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/40">{selectedCustomer.phone}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="p-1 text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or phone…"
                    className={inputCls}
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-100 bg-white shadow-lg dark:border-white/[0.06] dark:bg-surface-800 max-h-48 overflow-y-auto">
                      {customerResults.map(c => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerResults([]) }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                          <span className="text-xs text-gray-400 dark:text-white/40">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Plate Number <span className="text-brand">*</span></label>
                <input value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} placeholder="A 12345" className={inputCls} />
              </div>
              <div>
                <label className="label">Make <span className="text-brand">*</span></label>
                <input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Toyota" className={inputCls} />
              </div>
              <div>
                <label className="label">Model <span className="text-brand">*</span></label>
                <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Land Cruiser" className={inputCls} />
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2023" className={inputCls} />
              </div>
              <div>
                <label className="label">Color</label>
                <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="White" className={inputCls} />
              </div>
              <div>
                <label className="label">VIN</label>
                <input value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} placeholder="Chassis number" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button type="submit" disabled={saving} className="btn-primary gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Vehicle
              </button>
              <button type="button" onClick={resetNewForm} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}

        {/* Vehicle list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Car className="h-10 w-10 text-gray-200 dark:text-white/10" />
            <p className="text-sm text-gray-400 dark:text-white/30">
              {search ? 'No vehicles match your search' : 'No vehicles yet'}
            </p>
          </div>
        ) : (
          <>
          {/* Desktop list */}
          <div className="hidden md:block space-y-2">
            {filtered.map(v => (
              <div key={v.id} className="card flex items-center gap-4 !p-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                  <Car className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>

                <Link href={`/workshop/vehicles/${v.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{v.plate_number}</span>
                    <span className="text-xs text-gray-400 dark:text-white/40">
                      {[v.year, v.make, v.model].filter(Boolean).join(' ')}{v.color ? ` · ${v.color}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {v.customer && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40">
                        <Phone className="h-3 w-3" />{v.customer.name} · {v.customer.phone}
                      </span>
                    )}
                    {v.vin && <span className="text-[11px] text-gray-300 dark:text-white/20 font-mono">VIN: {v.vin}</span>}
                  </div>
                </Link>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(v)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(v)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link href={`/workshop/vehicles/${v.id}`} className="hidden sm:block">
                    <ChevronRight className="h-4 w-4 text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/50 transition-colors" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile card list — tap to view history, swipe to delete */}
          <div className="md:hidden space-y-2">
            {filtered.map(v => (
              <SwipeToDelete key={v.id} onDelete={() => setDeleteTarget(v)}>
                <Link
                  href={`/workshop/vehicles/${v.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-surface-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <Car className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{v.plate_number}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-white/40">
                        {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                      </span>
                    </div>
                    {v.customer && (
                      <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{v.customer.name} · {v.customer.phone}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-white/20" />
                </Link>
              </SwipeToDelete>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Edit modal (inline card, reused across breakpoints) */}
      {editTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditTarget(null)}>
          <div className="card w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
              <h3 className="section-title">Edit Vehicle</h3>
              <button onClick={() => setEditTarget(null)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Plate</label>
                <input value={editForm.plate_number} onChange={e => setEditForm(f => ({ ...f, plate_number: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="label">Make</label>
                <input value={editForm.make} onChange={e => setEditForm(f => ({ ...f, make: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="label">Model</label>
                <input value={editForm.model} onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="label">Color</label>
                <input value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="label">VIN</label>
                <input value={editForm.vin} onChange={e => setEditForm(f => ({ ...f, vin: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button onClick={handleSaveEdit} disabled={savingEdit} className="btn-primary gap-2">
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
              <button onClick={() => setEditTarget(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Vehicle?"
        message={`Delete "${deleteTarget?.plate_number}"?`}
        detail="This will permanently remove the vehicle. Vehicles with job card history cannot be deleted."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

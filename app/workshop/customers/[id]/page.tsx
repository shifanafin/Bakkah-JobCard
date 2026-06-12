'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { useSession } from '@/lib/auth-client'
import {
  ArrowLeft, User, Phone, Mail, Building2, Car, ClipboardList,
  Plus, Pencil, Save, X, Loader2, Star, ChevronRight, GitMerge,
  Search, AlertTriangle, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatAED } from '@/lib/utils/format'
import { toast } from 'sonner'
import { JOB_STATUS_LABEL, JOB_STATUS_COLOR, PAYMENT_STATUS_COLOR } from '@/types'

type Customer = {
  id: string
  name: string
  phone: string
  email?: string
  company_name?: string
  is_fleet: boolean
  notes?: string
  created_at: string
}

type Vehicle = {
  id: string
  plate_number: string
  make: string
  model: string
  year?: number
  color?: string
  vin?: string
}

type JobCard = {
  id: string
  job_number: string
  status: string
  job_type: string
  date_in: string
  date_out?: string
  total: number
  payment_status: string
  vehicle?: { plate_number: string; make: string; model: string }
}

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'receptionist'
  const canMerge = role === 'admin' || role === 'supervisor'

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)

  // Edit customer
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Customer>>({})
  const [saving, setSaving] = useState(false)

  // Add vehicle
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', make: '', model: '', year: '', color: '', vin: '' })
  const [savingVehicle, setSavingVehicle] = useState(false)

  // Edit vehicle
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [vehicleEditForm, setVehicleEditForm] = useState<{ plate_number: string; make: string; model: string; year: string; color: string; vin: string }>({
    plate_number: '', make: '', model: '', year: '', color: '', vin: '',
  })
  const [savingVehicleEdit, setSavingVehicleEdit] = useState(false)

  // Merge
  const [showMerge, setShowMerge] = useState(false)
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeResults, setMergeResults] = useState<Customer[]>([])
  const [mergeTarget, setMergeTarget] = useState<Customer | null>(null)
  const [merging, setMerging] = useState(false)
  const [mergeSearching, setMergeSearching] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${id}`)
      if (!res.ok) throw new Error('Not found')
      const d = await res.json()
      setCustomer(d.customer)
      setVehicles(d.vehicles ?? [])
      setJobCards(d.jobCards ?? [])
    } catch {
      toast.error('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // ── Customer edit ──────────────────────────────────────────────────────────
  function startEdit() {
    if (!customer) return
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      company_name: customer.company_name ?? '',
      is_fleet: customer.is_fleet,
      notes: customer.notes ?? '',
    })
    setEditing(true)
  }

  async function handleSaveCustomer() {
    if (!editForm.name?.trim()) { toast.error('Name is required'); return }
    if (!editForm.phone?.trim()) { toast.error('Phone is required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setCustomer(d.customer)
      setEditing(false)
      toast.success('Customer updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // ── Add vehicle ────────────────────────────────────────────────────────────
  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault()
    setSavingVehicle(true)
    try {
      const res = await fetch(`/api/customers/${id}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setVehicles(vs => [d.vehicle, ...vs])
      setShowAddVehicle(false)
      setVehicleForm({ plate_number: '', make: '', model: '', year: '', color: '', vin: '' })
      toast.success('Vehicle added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add vehicle')
    } finally {
      setSavingVehicle(false)
    }
  }

  // ── Edit vehicle ───────────────────────────────────────────────────────────
  function startEditVehicle(v: Vehicle) {
    setEditingVehicle(v.id)
    setVehicleEditForm({
      plate_number: v.plate_number,
      make: v.make,
      model: v.model,
      year: v.year?.toString() ?? '',
      color: v.color ?? '',
      vin: v.vin ?? '',
    })
  }

  async function handleSaveVehicle(vehicleId: string) {
    setSavingVehicleEdit(true)
    try {
      const res = await fetch(`/api/customers/${id}/vehicles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, ...vehicleEditForm }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setVehicles(vs => vs.map(v => v.id === vehicleId ? d.vehicle : v))
      setEditingVehicle(null)
      toast.success('Vehicle updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update vehicle')
    } finally {
      setSavingVehicleEdit(false)
    }
  }

  // ── Merge search ───────────────────────────────────────────────────────────
  const doMergeSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setMergeResults([]); return }
    setMergeSearching(true)
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`)
      const d = await res.json()
      setMergeResults((d.customers ?? []).filter((c: Customer) => c.id !== id))
    } catch { /* silent */ }
    finally { setMergeSearching(false) }
  }, [id])

  useEffect(() => {
    if (!mergeTarget) {
      const t = setTimeout(() => doMergeSearch(mergeSearch), 300)
      return () => clearTimeout(t)
    }
  }, [mergeSearch, mergeTarget, doMergeSearch])

  async function handleMerge() {
    if (!mergeTarget) return
    setMerging(true)
    try {
      const res = await fetch('/api/customers/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: id, targetId: mergeTarget.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(d.message)
      window.location.href = `/workshop/customers/${mergeTarget.id}`
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Merge failed')
      setMerging(false)
    }
  }

  const inputCls = 'input-base w-full'

  // ── Loading / Not Found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
        <Header title="Customer" subtitle="" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
        <Header title="Customer" subtitle="" />
        <div className="flex flex-col items-center gap-3 py-32 text-center">
          <User className="h-10 w-10 text-gray-200 dark:text-white/10" />
          <p className="text-sm text-gray-400">Customer not found</p>
          <Link href="/workshop/customers" className="btn-primary mt-2">Back to Customers</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header
        title={customer.name}
        subtitle={
          customer.is_fleet
            ? 'Fleet / Corporate Account'
            : customer.company_name || `Customer since ${formatDate(customer.created_at)}`
        }
      />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Back */}
        <Link
          href="/workshop/customers"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-white/40 dark:hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Customers
        </Link>

        {/* ── Customer Info ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <h2 className="section-title">Customer Info</h2>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={handleSaveCustomer} disabled={saving} className="btn-primary gap-1.5 text-xs py-1.5 px-3">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
              </div>
            ) : (
              <button onClick={startEdit} className="btn-ghost gap-1.5 text-xs py-1.5 px-3">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name <span className="text-brand">*</span></label>
                <input
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="label">Phone <span className="text-brand">*</span></label>
                <input
                  type="tel"
                  value={editForm.phone ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="customer@email.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="label">Company</label>
                <input
                  value={editForm.company_name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Company LLC"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Notes</label>
                <textarea
                  value={editForm.notes ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className={cn(inputCls, 'resize-none')}
                  placeholder="Internal notes…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-white/60">
                  <input
                    type="checkbox"
                    checked={editForm.is_fleet ?? false}
                    onChange={e => setEditForm(f => ({ ...f, is_fleet: e.target.checked }))}
                    className="h-4 w-4 accent-brand rounded"
                  />
                  Fleet / Corporate Account
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow icon={<User className="h-4 w-4" />} label="Name" value={customer.name} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
              {customer.email && <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email} />}
              {customer.company_name && <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company" value={customer.company_name} />}
              <InfoRow
                icon={<Star className="h-4 w-4" />}
                label="Account Type"
                value={customer.is_fleet ? 'Fleet / Corporate' : 'Individual'}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Customer Since"
                value={formatDate(customer.created_at)}
              />
              {customer.notes && (
                <div className="sm:col-span-2 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg text-sm text-gray-600 dark:text-white/50 leading-relaxed">
                  {customer.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Vehicles ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <h2 className="section-title flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-400 dark:text-white/30" />
              Vehicles
              <span className="text-gray-400 dark:text-white/30 font-normal text-sm">({vehicles.length})</span>
            </h2>
            <button
              onClick={() => { setShowAddVehicle(v => !v); setEditingVehicle(null) }}
              className="btn-ghost gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Vehicle
            </button>
          </div>

          {/* Add vehicle form */}
          {showAddVehicle && (
            <form onSubmit={handleAddVehicle} className="rounded-xl border border-brand/20 bg-brand/[0.03] p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-white/70">New Vehicle</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Plate <span className="text-brand">*</span></label>
                  <input
                    value={vehicleForm.plate_number}
                    onChange={e => setVehicleForm(f => ({ ...f, plate_number: e.target.value }))}
                    placeholder="DXB 12345"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="label">Make <span className="text-brand">*</span></label>
                  <input
                    value={vehicleForm.make}
                    onChange={e => setVehicleForm(f => ({ ...f, make: e.target.value }))}
                    placeholder="Toyota"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="label">Model <span className="text-brand">*</span></label>
                  <input
                    value={vehicleForm.model}
                    onChange={e => setVehicleForm(f => ({ ...f, model: e.target.value }))}
                    placeholder="Camry"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="label">Year</label>
                  <input
                    type="number"
                    value={vehicleForm.year}
                    onChange={e => setVehicleForm(f => ({ ...f, year: e.target.value }))}
                    placeholder="2022"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="label">Color</label>
                  <input
                    value={vehicleForm.color}
                    onChange={e => setVehicleForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="White"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="label">VIN</label>
                  <input
                    value={vehicleForm.vin}
                    onChange={e => setVehicleForm(f => ({ ...f, vin: e.target.value }))}
                    placeholder="1HGBH41J…"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingVehicle} className="btn-primary gap-1.5 text-xs">
                  {savingVehicle ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Add Vehicle
                </button>
                <button type="button" onClick={() => setShowAddVehicle(false)} className="btn-ghost text-xs">Cancel</button>
              </div>
            </form>
          )}

          {/* Vehicle list */}
          {vehicles.length === 0 && !showAddVehicle ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Car className="h-8 w-8 text-gray-200 dark:text-white/10" />
              <p className="text-sm text-gray-400 dark:text-white/30">No vehicles yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map(v => (
                <div key={v.id} className="rounded-xl border border-gray-100 dark:border-white/[0.06] p-4">
                  {editingVehicle === v.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="label">Plate</label>
                          <input value={vehicleEditForm.plate_number} onChange={e => setVehicleEditForm(f => ({ ...f, plate_number: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="label">Make</label>
                          <input value={vehicleEditForm.make} onChange={e => setVehicleEditForm(f => ({ ...f, make: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="label">Model</label>
                          <input value={vehicleEditForm.model} onChange={e => setVehicleEditForm(f => ({ ...f, model: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="label">Year</label>
                          <input type="number" value={vehicleEditForm.year} onChange={e => setVehicleEditForm(f => ({ ...f, year: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="label">Color</label>
                          <input value={vehicleEditForm.color} onChange={e => setVehicleEditForm(f => ({ ...f, color: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className="label">VIN</label>
                          <input value={vehicleEditForm.vin} onChange={e => setVehicleEditForm(f => ({ ...f, vin: e.target.value }))} className={inputCls} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveVehicle(v.id)} disabled={savingVehicleEdit} className="btn-primary gap-1.5 text-xs">
                          {savingVehicleEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save
                        </button>
                        <button onClick={() => setEditingVehicle(null)} className="btn-ghost text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                          <Car className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{v.plate_number}</p>
                          <p className="text-xs text-gray-400 dark:text-white/40">
                            {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                            {v.color ? ` · ${v.color}` : ''}
                          </p>
                          {v.vin && (
                            <p className="text-[11px] text-gray-300 dark:text-white/20 font-mono mt-0.5">VIN: {v.vin}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startEditVehicle(v)}
                        className="btn-ghost text-xs py-1 px-2.5 shrink-0 gap-1"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Job Cards ── */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <h2 className="section-title flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-400 dark:text-white/30" />
              Job Cards
              <span className="text-gray-400 dark:text-white/30 font-normal text-sm">({jobCards.length})</span>
            </h2>
            <Link
              href={`/workshop/job-cards/new?customerId=${customer.id}`}
              className="btn-ghost gap-1.5 text-xs py-1.5 px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              New Job Card
            </Link>
          </div>

          {jobCards.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ClipboardList className="h-8 w-8 text-gray-200 dark:text-white/10" />
              <p className="text-sm text-gray-400 dark:text-white/30">No job cards yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobCards.map(j => (
                <Link
                  key={j.id}
                  href={`/workshop/job-cards/${j.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-white/[0.06] p-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{j.job_number}</span>
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                        JOB_STATUS_COLOR[j.status as keyof typeof JOB_STATUS_COLOR] ?? 'bg-gray-100 text-gray-500',
                      )}>
                        {JOB_STATUS_LABEL[j.status as keyof typeof JOB_STATUS_LABEL] ?? j.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {j.vehicle && (
                        <span className="text-xs text-gray-400 dark:text-white/40">
                          {j.vehicle.plate_number} · {j.vehicle.make} {j.vehicle.model}
                        </span>
                      )}
                      <span className="text-xs text-gray-300 dark:text-white/20">{formatDate(j.date_in)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatAED(j.total)}</p>
                    <p className={cn(
                      'text-xs font-medium capitalize',
                      PAYMENT_STATUS_COLOR[j.payment_status as keyof typeof PAYMENT_STATUS_COLOR] ?? 'text-gray-400',
                    )}>
                      {j.payment_status}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-white/20 group-hover:text-gray-500 dark:group-hover:text-white/50 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Merge Customers (admin/supervisor only) ── */}
        {canMerge && (
          <div className="card border border-red-500/10">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-white/[0.06] pb-3">
              <div>
                <h2 className="section-title flex items-center gap-2 text-red-500 dark:text-red-400">
                  <GitMerge className="h-4 w-4" />
                  Merge Customer
                </h2>
                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                  Combine this customer's vehicles and job cards into another account.
                </p>
              </div>
              {!showMerge && (
                <button
                  onClick={() => setShowMerge(true)}
                  className="btn-ghost text-xs py-1.5 px-3 shrink-0 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 gap-1.5"
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  Start Merge
                </button>
              )}
            </div>

            {showMerge && (
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    All vehicles and job cards from <strong>{customer.name}</strong> will move to the target account.
                    This account will be permanently deleted. This action cannot be undone.
                  </p>
                </div>

                <div>
                  <label className="label mb-1.5">Target customer — merge INTO this account</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      value={mergeSearch}
                      onChange={e => { setMergeSearch(e.target.value); setMergeTarget(null) }}
                      placeholder="Search by name or phone…"
                      className="input-base pl-9 w-full"
                    />
                    {mergeSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                {mergeResults.length > 0 && !mergeTarget && (
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden max-h-48 overflow-y-auto">
                    {mergeResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setMergeTarget(c); setMergeSearch(c.name); setMergeResults([]) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-50 dark:border-white/[0.04] last:border-0"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 dark:text-white/40">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {mergeTarget && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.08]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-sm">
                      {mergeTarget.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{mergeTarget.name}</p>
                      <p className="text-xs text-gray-400 dark:text-white/40">{mergeTarget.phone}</p>
                    </div>
                    <button
                      onClick={() => { setMergeTarget(null); setMergeSearch('') }}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleMerge}
                    disabled={!mergeTarget || merging}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors',
                      'bg-red-500 hover:bg-red-600',
                      (!mergeTarget || merging) && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {merging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />}
                    Merge & Delete This Account
                  </button>
                  <button
                    onClick={() => { setShowMerge(false); setMergeTarget(null); setMergeSearch(''); setMergeResults([]) }}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-gray-300 dark:text-white/20 shrink-0">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400 dark:text-white/30 uppercase tracking-wider font-medium leading-none mb-1">{label}</p>
        <p className="text-sm text-gray-700 dark:text-white/70 font-medium">{value}</p>
      </div>
    </div>
  )
}

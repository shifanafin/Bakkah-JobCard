'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Phone,
  Car,
  Clock,
  RefreshCw,
  ChevronRight,
  Trash2,
  Pencil,
  Save,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type Filter = 'all' | 'new' | 'converted'

interface Enquiry {
  id: string
  name: string
  phone: string
  vehicle_plate: string | null
  vehicle_make: string | null
  vehicle_model: string | null
  service_type: string
  remarks: string | null
  job_number: string | null
  job_card_id: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function EnquiriesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role ?? ''
  const canDelete = role === 'admin' || role === 'supervisor'
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/enquiries?filter=${filter}`)
      if (!res.ok) throw new Error('Failed to load')
      setEnquiries(await res.json())
    } catch {
      toast.error('Failed to load enquiries')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function markRead(id: string) {
    setMarking(id)
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      })
      if (!res.ok) throw new Error('Failed')
      setEnquiries(prev =>
        prev.map(e => (e.id === id ? { ...e, is_read: true } : e)),
      )
    } catch {
      toast.error('Failed to mark as read')
    } finally {
      setMarking(null)
    }
  }

  async function convertToJobCard(id: string) {
    setConverting(id)
    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'POST' })
      const data = await res.json()

      if (res.status === 409) {
        // Already converted — just navigate
        toast.info('Already converted to job card')
        router.push(`/workshop/job-cards/${data.job_card_id}`)
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Conversion failed')

      toast.success(`Job card ${data.job_number} created`)
      router.push(`/workshop/job-cards/${data.job_card_id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setConverting(null)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/enquiries/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to delete'); return }
      setEnquiries(prev => prev.filter(e => e.id !== deleteTarget.id))
      toast.success('Enquiry deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function saveEdit(id: string, fields: Partial<Enquiry>) {
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', fields }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed to save')
      setEnquiries(prev => prev.map(e => (e.id === id ? { ...e, ...d.enquiry } : e)))
      setEditingId(null)
      toast.success('Enquiry updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingEdit(false)
    }
  }

  const newCount = enquiries.filter(e => !e.is_read).length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-[#C9A227]" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Website Enquiries
          </h1>
          {newCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C9A227] px-1.5 text-[10px] font-bold text-black">
              {newCount > 99 ? '99+' : newCount}
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-white/40 dark:hover:bg-white/[0.06] transition"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/[0.06] px-6 shrink-0">
        {(['all', 'new', 'converted'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              filter === f
                ? 'border-[#C9A227] text-[#C9A227]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/70',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 dark:text-white/30">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-10 w-10 text-gray-200 dark:text-white/10 mb-3" />
            <p className="text-sm text-gray-400 dark:text-white/30">
              {filter === 'new' ? 'No new enquiries' : 'No enquiries yet'}
            </p>
          </div>
        ) : (
          enquiries.map(e => <EnquiryCard
            key={e.id}
            enquiry={e}
            isConverting={converting === e.id}
            isMarking={marking === e.id}
            canDelete={canDelete}
            isEditing={editingId === e.id}
            savingEdit={savingEdit}
            onMarkRead={() => markRead(e.id)}
            onConvert={() => convertToJobCard(e.id)}
            onViewJobCard={() => router.push(`/workshop/job-cards/${e.job_card_id}`)}
            onDelete={() => setDeleteTarget(e)}
            onStartEdit={() => setEditingId(e.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={fields => saveEdit(e.id, fields)}
          />)
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this enquiry?"
        message={deleteTarget ? `This will permanently delete the enquiry from ${deleteTarget.name}.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function EnquiryCard({
  enquiry: e,
  isConverting,
  isMarking,
  canDelete,
  isEditing,
  savingEdit,
  onMarkRead,
  onConvert,
  onViewJobCard,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  enquiry: Enquiry
  isConverting: boolean
  isMarking: boolean
  canDelete: boolean
  isEditing: boolean
  savingEdit: boolean
  onMarkRead: () => void
  onConvert: () => void
  onViewJobCard: () => void
  onDelete: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (fields: Partial<Enquiry>) => void
}) {
  const isConverted = !!e.job_card_id
  const isNew = !e.is_read

  const [form, setForm] = useState({
    name: e.name,
    phone: e.phone,
    vehicle_plate: e.vehicle_plate ?? '',
    vehicle_make: e.vehicle_make ?? '',
    vehicle_model: e.vehicle_model ?? '',
    service_type: e.service_type,
    remarks: e.remarks ?? '',
  })

  if (isEditing) {
    const inputCls = 'input-base w-full text-sm'
    return (
      <div className="rounded-xl border border-brand/30 bg-brand/[0.03] p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input value={form.name} onChange={ev => setForm(f => ({ ...f, name: ev.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={form.phone} onChange={ev => setForm(f => ({ ...f, phone: ev.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="label">Vehicle Plate</label>
            <input value={form.vehicle_plate} onChange={ev => setForm(f => ({ ...f, vehicle_plate: ev.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="label">Service Type</label>
            <input value={form.service_type} onChange={ev => setForm(f => ({ ...f, service_type: ev.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="label">Vehicle Make</label>
            <input value={form.vehicle_make} onChange={ev => setForm(f => ({ ...f, vehicle_make: ev.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="label">Vehicle Model</label>
            <input value={form.vehicle_model} onChange={ev => setForm(f => ({ ...f, vehicle_model: ev.target.value }))} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Remarks</label>
            <textarea value={form.remarks} onChange={ev => setForm(f => ({ ...f, remarks: ev.target.value }))} rows={2} className={cn(inputCls, 'resize-none')} />
          </div>
        </div>
        <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={() => onSaveEdit(form)}
            disabled={savingEdit}
            className="flex items-center gap-1.5 rounded-lg bg-[#C9A227] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#b8911f] transition disabled:opacity-50"
          >
            {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
          <button onClick={onCancelEdit} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        isNew && !isConverted
          ? 'border-[#C9A227]/40 bg-[#C9A227]/5 dark:bg-[#C9A227]/[0.04]'
          : 'border-gray-200 bg-white dark:border-white/[0.06] dark:bg-surface-900',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Status dot */}
        <div className="mt-1 shrink-0">
          {isConverted ? (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          ) : isNew ? (
            <span className="flex h-2 w-2 rounded-full bg-[#C9A227] animate-pulse" />
          ) : (
            <span className="flex h-2 w-2 rounded-full bg-gray-300 dark:bg-white/20" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">{e.name}</span>
            {isConverted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ClipboardList className="h-2.5 w-2.5" />
                {e.job_number ?? 'Converted'}
              </span>
            )}
            {isNew && !isConverted && (
              <span className="rounded-full bg-[#C9A227]/15 px-2 py-0.5 text-[10px] font-bold text-[#C9A227] uppercase tracking-wide">
                New
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-white/40 mb-2">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {e.phone}
            </span>
            {e.vehicle_plate && (
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {e.vehicle_plate}
                {e.vehicle_make && ` · ${e.vehicle_make} ${e.vehicle_model ?? ''}`.trim()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(e.created_at)}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-white/70 font-medium">{e.service_type}</p>
          {e.remarks && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-white/40 line-clamp-2">
              &ldquo;{e.remarks}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/[0.04]">
        {isConverted ? (
          <button
            onClick={onViewJobCard}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.10] transition"
          >
            Open Job Card
            <ChevronRight className="h-3 w-3" />
          </button>
        ) : (
          <>
            {isNew && (
              <button
                onClick={onMarkRead}
                disabled={isMarking}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {isMarking ? 'Marking…' : 'Mark Read'}
              </button>
            )}
            <button
              onClick={onConvert}
              disabled={isConverting}
              className="flex items-center gap-1.5 rounded-lg bg-[#C9A227] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#b8911f] transition disabled:opacity-50"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {isConverting ? 'Creating…' : 'Create Job Card'}
            </button>
            <button
              onClick={onStartEdit}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

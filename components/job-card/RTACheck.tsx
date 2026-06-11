'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Shield, Car, Gauge, CreditCard,
  AlertCircle, Edit3, Save, X, Info, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'

type Fine = {
  id: string
  date: string
  location: string
  description: string
  amount_aed: number
  status: 'paid' | 'unpaid'
  source: 'moi' | 'dubai_police' | 'rta'
}

type RTARecord = {
  id: string
  job_card_id: string
  plate_number: string
  emirate: string
  data_source: string
  fines_count: number
  fines_total_aed: number
  fines: Fine[]
  salik_tag_number?: string
  salik_balance_aed?: number
  salik_transactions?: { date: string; gate: string; amount_aed: number }[]
  mulkiya_expiry?: string
  mulkiya_status?: string
  registration_number?: string
  owner_name?: string
  insurance_expiry?: string
  insurance_status?: string
  insurance_company?: string
  inspection_expiry?: string
  inspection_status?: string
  inspection_center?: string
  include_in_invoice: boolean
  notes?: string
  checked_at: string
}

type ManualForm = {
  fines_count: string
  fines_total_aed: string
  salik_balance_aed: string
  salik_tag_number: string
  mulkiya_expiry: string
  mulkiya_status: string
  owner_name: string
  insurance_expiry: string
  insurance_status: string
  insurance_company: string
  inspection_expiry: string
  inspection_status: string
  inspection_center: string
  notes: string
}

const SOURCE_LABEL: Record<string, string> = {
  manual:            'Manual Entry',
  moi_api:           'MOI API',
  dubai_police_api:  'Dubai Police API',
  rta_api:           'RTA API',
  partial:           'Mixed Sources',
  unavailable:       'Not Available',
}

const STATUS_BADGE = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  expired:  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  valid:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  pass:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  fail:     'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  due:      'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  unknown:  'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/40',
  unpaid:   'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  paid:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
}

function fmtDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isExpiringSoon(dateStr?: string, days = 30) {
  if (!dateStr) return false
  const diff = new Date(dateStr).getTime() - Date.now()
  return diff > 0 && diff < days * 86_400_000
}

function isExpired(dateStr?: string) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export default function RTACheck({ jobCardId, plateNumber, emirate = 'Dubai' }: {
  jobCardId: string
  plateNumber: string
  emirate?: string
}) {
  const [record, setRecord] = useState<RTARecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showFines, setShowFines] = useState(false)
  const [showSalik, setShowSalik] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apisConfigured, setApisConfigured] = useState<boolean | null>(null)

  const [form, setForm] = useState<ManualForm>({
    fines_count: '0', fines_total_aed: '0',
    salik_balance_aed: '', salik_tag_number: '',
    mulkiya_expiry: '', mulkiya_status: 'active',
    owner_name: '', insurance_expiry: '', insurance_status: 'valid',
    insurance_company: '', inspection_expiry: '', inspection_status: 'pass',
    inspection_center: '', notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rta/check?job_card_id=${jobCardId}`)
      const json = await res.json()
      if (json.data) {
        setRecord(json.data)
        setExpanded(true)
        populateForm(json.data)
      }

      // Check if APIs are configured
      const cfgRes = await fetch('/api/rta/config')
      if (cfgRes.ok) {
        const cfg = await cfgRes.json()
        setApisConfigured(cfg.any_configured)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [jobCardId])

  useEffect(() => { load() }, [load])

  function populateForm(r: RTARecord) {
    setForm({
      fines_count:       String(r.fines_count ?? 0),
      fines_total_aed:   String(r.fines_total_aed ?? 0),
      salik_balance_aed: r.salik_balance_aed != null ? String(r.salik_balance_aed) : '',
      salik_tag_number:  r.salik_tag_number ?? '',
      mulkiya_expiry:    r.mulkiya_expiry ?? '',
      mulkiya_status:    r.mulkiya_status ?? 'active',
      owner_name:        r.owner_name ?? '',
      insurance_expiry:  r.insurance_expiry ?? '',
      insurance_status:  r.insurance_status ?? 'valid',
      insurance_company: r.insurance_company ?? '',
      inspection_expiry: r.inspection_expiry ?? '',
      inspection_status: r.inspection_status ?? 'pass',
      inspection_center: r.inspection_center ?? '',
      notes:             r.notes ?? '',
    })
  }

  async function handleAPIFetch() {
    setFetching(true)
    try {
      const res = await fetch('/api/rta/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: jobCardId, plate_number: plateNumber, emirate }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRecord(json.data)
      populateForm(json.data)
      setExpanded(true)
      toast.success('RTA vehicle check complete')
    } catch (err) {
      toast.error('RTA check failed: ' + String(err))
    } finally { setFetching(false) }
  }

  async function handleManualSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/rta/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_card_id:      jobCardId,
          plate_number:     plateNumber,
          emirate,
          manual:           true,
          fines_count:      parseInt(form.fines_count) || 0,
          fines_total_aed:  parseFloat(form.fines_total_aed) || 0,
          salik_balance_aed: form.salik_balance_aed ? parseFloat(form.salik_balance_aed) : null,
          salik_tag_number: form.salik_tag_number || null,
          mulkiya_expiry:   form.mulkiya_expiry || null,
          mulkiya_status:   form.mulkiya_status,
          owner_name:       form.owner_name || null,
          insurance_expiry: form.insurance_expiry || null,
          insurance_status: form.insurance_status,
          insurance_company: form.insurance_company || null,
          inspection_expiry: form.inspection_expiry || null,
          inspection_status: form.inspection_status,
          inspection_center: form.inspection_center || null,
          include_in_invoice: record?.include_in_invoice ?? true,
          notes:            form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRecord(json.data)
      setExpanded(true)
      setShowManual(false)
      toast.success('RTA details saved')
    } catch (err) {
      toast.error('Save failed: ' + String(err))
    } finally { setSaving(false) }
  }

  async function toggleInvoice() {
    if (!record) return
    const next = !record.include_in_invoice
    try {
      await fetch('/api/rta/check', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_card_id: jobCardId, include_in_invoice: next }),
      })
      setRecord(r => r ? { ...r, include_in_invoice: next } : r)
      toast.success(next ? 'RTA details will appear on invoice' : 'RTA details hidden from invoice')
    } catch { toast.error('Update failed') }
  }

  if (loading) return (
    <div className="card">
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-white/30">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading RTA data…
      </div>
    </div>
  )

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">UAE RTA Check</h3>
            {record && (
              <p className="text-[10px] text-gray-400 dark:text-white/30">
                Last checked {fmtDate(record.checked_at)} · {SOURCE_LABEL[record.data_source] ?? record.data_source}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record && (
            <button
              onClick={toggleInvoice}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                record.include_in_invoice
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40'
              )}
            >
              {record.include_in_invoice ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {record.include_in_invoice ? 'On Invoice' : 'Hidden'}
            </button>
          )}
          <button
            onClick={() => setShowManual(v => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
          >
            <Edit3 className="h-3 w-3" /> Manual
          </button>
          {apisConfigured && (
            <button
              onClick={handleAPIFetch}
              disabled={fetching}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-black shadow-[0_2px_8px_rgba(107,122,40,0.2)] hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              {fetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {fetching ? 'Checking…' : 'Auto-Check'}
            </button>
          )}
        </div>
      </div>

      {/* No API + no record state */}
      {!record && !showManual && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02] p-5 text-center">
          <div className="mb-2 flex justify-center">
            <Info className="h-8 w-8 text-gray-300 dark:text-white/20" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-white/60 mb-1">No RTA data yet</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mb-4 max-w-xs mx-auto">
            {apisConfigured
              ? 'Click Auto-Check to fetch fines, Salik balance, and registration details from UAE government systems.'
              : 'Configure your RTA API keys in Settings to enable auto-check, or enter details manually.'}
          </p>
          <button
            onClick={() => setShowManual(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" /> Enter Details Manually
          </button>
        </div>
      )}

      {/* Manual entry form */}
      {showManual && (
        <div className="rounded-xl border border-brand/20 bg-brand-50/30 dark:bg-brand/[0.05] p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Manual RTA Entry</h4>
            <button onClick={() => setShowManual(false)} className="text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Fines */}
            <div>
              <label className="label">Traffic Fines Count</label>
              <input type="number" min="0" value={form.fines_count} onChange={e => setForm(f => ({ ...f, fines_count: e.target.value }))} className="input-base" placeholder="0" />
            </div>
            <div>
              <label className="label">Total Fines (AED)</label>
              <input type="number" min="0" step="0.01" value={form.fines_total_aed} onChange={e => setForm(f => ({ ...f, fines_total_aed: e.target.value }))} className="input-base" placeholder="0.00" />
            </div>
            {/* Salik */}
            <div>
              <label className="label">Salik Tag Number</label>
              <input value={form.salik_tag_number} onChange={e => setForm(f => ({ ...f, salik_tag_number: e.target.value }))} className="input-base" placeholder="e.g. 80000XXXXX" />
            </div>
            <div>
              <label className="label">Salik Balance (AED)</label>
              <input type="number" step="0.01" value={form.salik_balance_aed} onChange={e => setForm(f => ({ ...f, salik_balance_aed: e.target.value }))} className="input-base" placeholder="e.g. 45.75" />
            </div>
            {/* Registration */}
            <div>
              <label className="label">Mulkiya Expiry</label>
              <input type="date" value={form.mulkiya_expiry} onChange={e => setForm(f => ({ ...f, mulkiya_expiry: e.target.value }))} className="input-base" />
            </div>
            <div>
              <label className="label">Registration Status</label>
              <select value={form.mulkiya_status} onChange={e => setForm(f => ({ ...f, mulkiya_status: e.target.value }))} className="input-base">
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="label">Owner Name</label>
              <input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="input-base" placeholder="Vehicle owner" />
            </div>
            {/* Insurance */}
            <div>
              <label className="label">Insurance Expiry</label>
              <input type="date" value={form.insurance_expiry} onChange={e => setForm(f => ({ ...f, insurance_expiry: e.target.value }))} className="input-base" />
            </div>
            <div>
              <label className="label">Insurance Status</label>
              <select value={form.insurance_status} onChange={e => setForm(f => ({ ...f, insurance_status: e.target.value }))} className="input-base">
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="label">Insurance Company</label>
              <input value={form.insurance_company} onChange={e => setForm(f => ({ ...f, insurance_company: e.target.value }))} className="input-base" placeholder="e.g. AXA, RSA, Oman" />
            </div>
            {/* Inspection */}
            <div>
              <label className="label">Inspection Expiry</label>
              <input type="date" value={form.inspection_expiry} onChange={e => setForm(f => ({ ...f, inspection_expiry: e.target.value }))} className="input-base" />
            </div>
            <div>
              <label className="label">Inspection Status</label>
              <select value={form.inspection_status} onChange={e => setForm(f => ({ ...f, inspection_status: e.target.value }))} className="input-base">
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="due">Due</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base resize-none min-h-[60px]" placeholder="Any additional notes…" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowManual(false)} className="btn-ghost text-xs px-3 py-2">Cancel</button>
            <button onClick={handleManualSave} disabled={saving} className="btn-primary text-xs px-4 py-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Details
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {record && !showManual && (
        <div className="space-y-3">
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Fines */}
            <div className={cn('rounded-xl border p-3 text-center', record.fines_total_aed > 0 ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10')}>
              <div className="flex justify-center mb-1">
                {record.fines_total_aed > 0 ? <AlertTriangle className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <p className={cn('text-base font-black tabular-nums', record.fines_total_aed > 0 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400')}>
                {record.fines_total_aed > 0 ? `AED ${record.fines_total_aed.toFixed(0)}` : 'No Fines'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5">
                {record.fines_count > 0 ? `${record.fines_count} violation${record.fines_count !== 1 ? 's' : ''}` : 'Traffic Fines'}
              </p>
            </div>

            {/* Salik */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 p-3 text-center">
              <div className="flex justify-center mb-1">
                <Gauge className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-base font-black text-blue-700 dark:text-blue-300 tabular-nums">
                {record.salik_balance_aed != null ? `AED ${record.salik_balance_aed.toFixed(2)}` : '—'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5">Salik Balance</p>
            </div>

            {/* Registration */}
            <div className={cn('rounded-xl border p-3 text-center',
              record.mulkiya_status === 'active' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' :
              record.mulkiya_status === 'expired' ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10' :
              'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]'
            )}>
              <div className="flex justify-center mb-1">
                <Car className={cn('h-5 w-5',
                  record.mulkiya_status === 'active' ? 'text-emerald-500' :
                  record.mulkiya_status === 'expired' ? 'text-red-500' : 'text-gray-400'
                )} />
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">{record.mulkiya_status ?? '—'}</p>
              <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5">
                {record.mulkiya_expiry ? `Exp: ${fmtDate(record.mulkiya_expiry)}` : 'Mulkiya'}
              </p>
            </div>

            {/* Insurance */}
            <div className={cn('rounded-xl border p-3 text-center',
              record.insurance_status === 'valid' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10' :
              record.insurance_status === 'expired' ? 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10' :
              'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]'
            )}>
              <div className="flex justify-center mb-1">
                <Shield className={cn('h-5 w-5',
                  record.insurance_status === 'valid' ? 'text-emerald-500' :
                  record.insurance_status === 'expired' ? 'text-red-500' : 'text-gray-400'
                )} />
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white capitalize">{record.insurance_status ?? '—'}</p>
              <p className="text-[10px] text-gray-500 dark:text-white/40 mt-0.5">
                {record.insurance_expiry ? `Exp: ${fmtDate(record.insurance_expiry)}` : 'Insurance'}
              </p>
            </div>
          </div>

          {/* Expiry warnings */}
          {(isExpiringSoon(record.mulkiya_expiry) || isExpired(record.mulkiya_expiry) ||
            isExpiringSoon(record.insurance_expiry) || isExpired(record.insurance_expiry) ||
            isExpiringSoon(record.inspection_expiry) || isExpired(record.inspection_expiry)) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Attention Required</p>
              </div>
              {isExpired(record.mulkiya_expiry) && <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Mulkiya (registration) has expired on {fmtDate(record.mulkiya_expiry)}</p>}
              {isExpiringSoon(record.mulkiya_expiry) && !isExpired(record.mulkiya_expiry) && <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Mulkiya expiring soon: {fmtDate(record.mulkiya_expiry)}</p>}
              {isExpired(record.insurance_expiry) && <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Insurance expired on {fmtDate(record.insurance_expiry)}</p>}
              {isExpiringSoon(record.insurance_expiry) && !isExpired(record.insurance_expiry) && <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Insurance expiring soon: {fmtDate(record.insurance_expiry)}</p>}
              {isExpired(record.inspection_expiry) && <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Vehicle inspection overdue since {fmtDate(record.inspection_expiry)}</p>}
              {isExpiringSoon(record.inspection_expiry) && !isExpired(record.inspection_expiry) && <p className="text-xs text-amber-700 dark:text-amber-400">⚠ Inspection due: {fmtDate(record.inspection_expiry)}</p>}
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            Full Details
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {expanded && (
            <div className="space-y-3 pt-1">
              {/* Vehicle Registration details */}
              <DetailBlock title="Vehicle Registration (Mulkiya)" icon={<Car className="h-3.5 w-3.5" />}>
                <Row label="Status">
                  <Badge status={record.mulkiya_status ?? 'unknown'} />
                </Row>
                <Row label="Expiry Date">{fmtDate(record.mulkiya_expiry)}</Row>
                {record.registration_number && <Row label="Registration #">{record.registration_number}</Row>}
                {record.owner_name && <Row label="Owner">{record.owner_name}</Row>}
              </DetailBlock>

              {/* Insurance */}
              <DetailBlock title="Insurance" icon={<Shield className="h-3.5 w-3.5" />}>
                <Row label="Status"><Badge status={record.insurance_status ?? 'unknown'} /></Row>
                <Row label="Expiry Date">{fmtDate(record.insurance_expiry)}</Row>
                {record.insurance_company && <Row label="Company">{record.insurance_company}</Row>}
              </DetailBlock>

              {/* Inspection */}
              <DetailBlock title="Technical Inspection" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                <Row label="Status"><Badge status={record.inspection_status ?? 'unknown'} /></Row>
                <Row label="Expiry Date">{fmtDate(record.inspection_expiry)}</Row>
                {record.inspection_center && <Row label="Center">{record.inspection_center}</Row>}
              </DetailBlock>

              {/* Salik */}
              <DetailBlock title="Salik (Toll)" icon={<Gauge className="h-3.5 w-3.5" />}>
                {record.salik_tag_number && <Row label="Tag Number">{record.salik_tag_number}</Row>}
                <Row label="Balance">
                  {record.salik_balance_aed != null ? `AED ${record.salik_balance_aed.toFixed(2)}` : '—'}
                </Row>
                {record.salik_transactions && record.salik_transactions.length > 0 && (
                  <div className="mt-2">
                    <button onClick={() => setShowSalik(v => !v)} className="flex items-center gap-1 text-[10px] text-brand hover:text-brand/80 transition-colors">
                      {showSalik ? 'Hide' : 'Show'} transactions ({record.salik_transactions.length})
                      {showSalik ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showSalik && (
                      <div className="mt-2 space-y-1.5">
                        {record.salik_transactions.map((t, i) => (
                          <div key={i} className="flex justify-between text-[10px] text-gray-500 dark:text-white/40">
                            <span>{t.gate}</span>
                            <span>{fmtDate(t.date)}</span>
                            <span className="tabular-nums font-semibold">AED {t.amount_aed.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </DetailBlock>

              {/* Traffic Fines list */}
              {record.fines && record.fines.length > 0 && (
                <DetailBlock title={`Traffic Fines (${record.fines_count})`} icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />}>
                  <Row label="Total Unpaid">
                    <span className="font-bold text-red-600 dark:text-red-400">
                      AED {record.fines_total_aed.toFixed(2)}
                    </span>
                  </Row>
                  <button onClick={() => setShowFines(v => !v)} className="flex items-center gap-1 text-[10px] text-brand hover:text-brand/80 transition-colors mt-1">
                    {showFines ? 'Hide' : 'View'} fine details
                    {showFines ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showFines && (
                    <div className="mt-2 space-y-2">
                      {record.fines.map((f, i) => (
                        <div key={i} className={cn('rounded-lg border p-2.5 text-xs', f.status === 'unpaid' ? 'border-red-100 bg-red-50/50 dark:border-red-500/15 dark:bg-red-500/5' : 'border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]')}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-gray-800 dark:text-white/80">{f.description}</span>
                            <Badge status={f.status} />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 dark:text-white/30">
                            <span>{f.location} · {fmtDate(f.date)}</span>
                            <span className="font-bold text-gray-700 dark:text-white/60">AED {f.amount_aed.toFixed(2)}</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-300 dark:text-white/20 mt-0.5 block">
                            {f.source === 'moi' ? 'MOI' : f.source === 'dubai_police' ? 'Dubai Police' : 'RTA'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </DetailBlock>
              )}

              {record.notes && (
                <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-1">Notes</p>
                  <p className="text-xs text-gray-600 dark:text-white/60">{record.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function DetailBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-gray-400 dark:text-white/30">{icon}</span>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">{title}</h4>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-400 dark:text-white/40">{label}</span>
      <span className="text-gray-700 dark:text-white/70 font-medium">{children}</span>
    </div>
  )
}

function Badge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', STATUS_BADGE[status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.unknown)}>
      {status}
    </span>
  )
}

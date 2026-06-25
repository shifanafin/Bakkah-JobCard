'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { getJobCard } from '@/lib/queries'
import { type JobCard } from '@/types'
import { ArrowLeft, Loader2, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

function Field({ label, required, error, children, full }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; full?: boolean
}) {
  return (
    <div className={cn(full && 'sm:col-span-2')}>
      <label className="label">
        {label}
        {required && <span className="text-brand ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default function EditJobCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [job, setJob] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [jobTypes, setJobTypes] = useState<{ id: string; name: string }[]>([])

  const [cust, setCust] = useState({ name: '', phone: '', email: '', company_name: '' })
  const [veh, setVeh] = useState({ plate_number: '', make: '', model: '', year: '', color: '', vin: '' })
  const [wo, setWo] = useState({ job_type: '', date_in: '', date_out: '', mileage_in: '', customer_complaint: '', work_instructions: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    getJobCard(id)
      .then(data => {
        setJob(data)
        setCust({
          name: data.customer?.name ?? '',
          phone: data.customer?.phone ?? '',
          email: data.customer?.email ?? '',
          company_name: data.customer?.company_name ?? '',
        })
        setVeh({
          plate_number: data.vehicle?.plate_number ?? '',
          make: data.vehicle?.make ?? '',
          model: data.vehicle?.model ?? '',
          year: data.vehicle?.year ? String(data.vehicle.year) : '',
          color: data.vehicle?.color ?? '',
          vin: data.vehicle?.vin ?? '',
        })
        setWo({
          job_type: data.job_type ?? '',
          date_in: data.date_in ?? '',
          date_out: data.date_out ?? '',
          mileage_in: data.mileage_in ? String(data.mileage_in) : '',
          customer_complaint: data.customer_complaint ?? '',
          work_instructions: data.work_instructions ?? '',
        })
      })
      .catch(() => toast.error('Failed to load job card'))
      .finally(() => setLoading(false))

    Promise.all([
      fetch('/api/job-types').then(r => r.json()).catch(() => ({})),
      fetch('/api/services').then(r => r.json()).catch(() => ({})),
    ]).then(([jt, sv]) => {
      const jtList: { id: string; name: string }[] = jt.job_types ?? []
      const svList: { id: string; name: string }[] = (sv.services ?? []).map(
        (s: { id: string; name: string }) => ({ id: `svc-${s.id}`, name: s.name })
      )
      const seen = new Set(jtList.map(x => x.name.toLowerCase()))
      setJobTypes([...jtList, ...svList.filter(s => !seen.has(s.name.toLowerCase()))])
    })
  }, [id])

  function validate() {
    const e: Record<string, string> = {}
    if (!cust.name.trim()) e.name = 'Name is required'
    if (!cust.phone.trim()) e.phone = 'Phone is required'
    if (!veh.plate_number.trim()) e.plate_number = 'Plate number is required'
    if (!veh.make.trim()) e.make = 'Make is required'
    if (!veh.model.trim()) e.model = 'Model is required'
    if (!wo.job_type) e.job_type = 'Job type is required'
    if (!wo.date_in) e.date_in = 'Date in is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: cust.name.trim(),
            phone: cust.phone.trim(),
            email: cust.email.trim() || null,
            company_name: cust.company_name.trim() || null,
          },
          vehicle: {
            plate_number: veh.plate_number.trim().toUpperCase(),
            make: veh.make.trim(),
            model: veh.model.trim(),
            year: veh.year ? Number(veh.year) : null,
            color: veh.color.trim() || null,
            vin: veh.vin.trim() || null,
          },
          job_type: wo.job_type,
          date_in: wo.date_in,
          date_out: wo.date_out || null,
          mileage_in: wo.mileage_in ? Number(wo.mileage_in) : null,
          customer_complaint: wo.customer_complaint.trim() || null,
          work_instructions: wo.work_instructions.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Update failed')
      toast.success('Job card updated')
      router.push(`/workshop/job-cards/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-surface-900">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  )

  if (!job) return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-3 dark:bg-surface-900">
      <p className="text-gray-400 dark:text-white/50">Job card not found</p>
      <Link href="/workshop/job-cards" className="btn-ghost">Back to list</Link>
    </div>
  )

  if (job.status === 'delivered') return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 gap-3 dark:bg-surface-900">
      <p className="text-gray-400 dark:text-white/50">This job has been delivered and cannot be edited.</p>
      <Link href={`/workshop/job-cards/${id}`} className="btn-ghost">Back to Job Card</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title={`Edit ${job.job_number}`} subtitle={`${job.vehicle?.plate_number} · ${job.vehicle?.make} ${job.vehicle?.model}`} />

      <div className="p-4 space-y-5 lg:p-6 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href={`/workshop/job-cards/${id}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-white/40 dark:hover:text-white/70">
            <ArrowLeft className="h-4 w-4" /> Back to Job Card
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>

        {/* Customer */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-gray-100 pb-3 dark:border-white/[0.06]">Customer</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name}>
              <input value={cust.name} onChange={e => setCust(p => ({ ...p, name: e.target.value }))}
                className="input-base" placeholder="Customer name" />
            </Field>
            <Field label="Phone" required error={errors.phone}>
              <input value={cust.phone} onChange={e => setCust(p => ({ ...p, phone: e.target.value }))}
                className="input-base" placeholder="+971 XX XXX XXXX" />
            </Field>
            <Field label="Email">
              <input value={cust.email} onChange={e => setCust(p => ({ ...p, email: e.target.value }))}
                className="input-base" placeholder="email@example.com" type="email" />
            </Field>
            <Field label="Company">
              <input value={cust.company_name} onChange={e => setCust(p => ({ ...p, company_name: e.target.value }))}
                className="input-base" placeholder="Company name (optional)" />
            </Field>
          </div>
        </div>

        {/* Vehicle */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-gray-100 pb-3 dark:border-white/[0.06]">Vehicle</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Plate Number" required error={errors.plate_number}>
              <input value={veh.plate_number} onChange={e => setVeh(p => ({ ...p, plate_number: e.target.value.toUpperCase() }))}
                className="input-base font-mono tracking-wider uppercase" placeholder="A 12345" />
            </Field>
            <Field label="Make" required error={errors.make}>
              <input value={veh.make} onChange={e => setVeh(p => ({ ...p, make: e.target.value }))}
                className="input-base" placeholder="Toyota" />
            </Field>
            <Field label="Model" required error={errors.model}>
              <input value={veh.model} onChange={e => setVeh(p => ({ ...p, model: e.target.value }))}
                className="input-base" placeholder="Camry" />
            </Field>
            <Field label="Year">
              <input value={veh.year} onChange={e => setVeh(p => ({ ...p, year: e.target.value }))}
                className="input-base" placeholder="2021" type="number" min="1900" max="2100" />
            </Field>
            <Field label="Color">
              <input value={veh.color} onChange={e => setVeh(p => ({ ...p, color: e.target.value }))}
                className="input-base" placeholder="White" />
            </Field>
            <Field label="VIN">
              <input value={veh.vin} onChange={e => setVeh(p => ({ ...p, vin: e.target.value }))}
                className="input-base font-mono" placeholder="VIN number" />
            </Field>
          </div>
        </div>

        {/* Work Order */}
        <div className="card space-y-4">
          <h2 className="section-title border-b border-gray-100 pb-3 dark:border-white/[0.06]">Work Order</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Job Type" required error={errors.job_type}>
              <select value={wo.job_type} onChange={e => setWo(p => ({ ...p, job_type: e.target.value }))}
                className="input-base appearance-none">
                <option value="">— Select —</option>
                {jobTypes.map(jt => (
                  <option key={jt.id} value={jt.name} className="dark:bg-zinc-900">{jt.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Mileage In (km)">
              <input value={wo.mileage_in} onChange={e => setWo(p => ({ ...p, mileage_in: e.target.value }))}
                className="input-base" placeholder="e.g. 45000" type="number" min="0" />
            </Field>
            <Field label="Date In" required error={errors.date_in}>
              <input value={wo.date_in} onChange={e => setWo(p => ({ ...p, date_in: e.target.value }))}
                className="input-base" type="date" />
            </Field>
            <Field label="Expected Date Out">
              <input value={wo.date_out} onChange={e => setWo(p => ({ ...p, date_out: e.target.value }))}
                className="input-base" type="date" />
            </Field>
            <Field label="Customer Complaint" full>
              <textarea value={wo.customer_complaint} onChange={e => setWo(p => ({ ...p, customer_complaint: e.target.value }))}
                className="input-base min-h-[80px] resize-y" placeholder="Describe the issue..." rows={3} />
            </Field>
            <Field label="Work Instructions" full>
              <textarea value={wo.work_instructions} onChange={e => setWo(p => ({ ...p, work_instructions: e.target.value }))}
                className="input-base min-h-[80px] resize-y" placeholder="Internal instructions..." rows={3} />
            </Field>
          </div>
        </div>

        {/* Bottom save */}
        <div className="flex justify-end gap-2 pb-6">
          <Link href={`/workshop/job-cards/${id}`} className="btn-ghost">Cancel</Link>
          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

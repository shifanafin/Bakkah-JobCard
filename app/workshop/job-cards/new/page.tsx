'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { createJobCard, getTechnicians } from '@/lib/queries'
import { JOB_TYPE_LABEL, type JobType } from '@/types'
import { ArrowLeft, Car, User, Wrench, CheckCircle, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const JOB_TYPES: JobType[] = ['service', 'inspection', 'detailing', 'repair', 'rta_check', 'valuation', 'other']

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-white/[0.06]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
          <Icon className="h-3.5 w-3.5 text-brand" />
        </div>
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function Field({ label, required, children, full }: { label: string; required?: boolean; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn(full && 'sm:col-span-2')}>
      <label className="label">{label}{required && <span className="ml-0.5 text-brand">*</span>}</label>
      {children}
    </div>
  )
}

export default function NewJobCardPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [technicians, setTechnicians] = useState<{ id: string; name: string; role: string }[]>([])
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '', customer_company: '', is_fleet: false,
    plate_number: '', make: '', model: '', year: '', color: '', vin: '',
    job_type: 'service' as JobType, date_in: today, date_out: '', mileage_in: '',
    customer_complaint: '', work_instructions: '', technician_id: '',
  })

  useEffect(() => { getTechnicians().then(setTechnicians).catch(console.error) }, [])

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name || !form.customer_phone || !form.plate_number || !form.make || !form.model) {
      toast.error('Please fill in all required fields')
      return
    }
    startTransition(async () => {
      try {
        const jc = await createJobCard({
          ...form,
          year: form.year ? parseInt(form.year) : undefined,
          mileage_in: form.mileage_in ? parseInt(form.mileage_in) : undefined,
          technician_id: form.technician_id || undefined,
        })
        toast.success(`Job card ${jc.job_number} created!`)
        router.push(`/workshop/job-cards/${jc.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create job card')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="New Job Card" subtitle="Vehicle check-in" />
      <div className="mx-auto max-w-2xl p-6">
        <Link href="/workshop/job-cards" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-white/40 dark:hover:text-white/70">
          <ArrowLeft className="h-4 w-4" /> Back to Job Cards
        </Link>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section icon={User} title="Customer Details">
            <Field label="Full Name" required><input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Mohammed Al Rashid" className="input-base" /></Field>
            <Field label="Phone Number" required><input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="+971 50 123 4567" className="input-base" /></Field>
            <Field label="Email Address"><input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="customer@email.com" className="input-base" /></Field>
            <Field label="Company (fleet clients)"><input value={form.customer_company} onChange={e => set('customer_company', e.target.value)} placeholder="Al Futtaim Logistics LLC" className="input-base" /></Field>
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-white/60">
                <input type="checkbox" checked={form.is_fleet} onChange={e => set('is_fleet', e.target.checked)} className="h-4 w-4 accent-brand rounded" />
                Fleet / Corporate Account (B2B)
              </label>
            </div>
          </Section>

          <Section icon={Car} title="Vehicle Details">
            <Field label="Plate Number" required>
              <input value={form.plate_number} onChange={e => set('plate_number', e.target.value.toUpperCase())} placeholder="A 12345" className="input-base font-mono uppercase tracking-widest" />
            </Field>
            <Field label="Color"><input value={form.color} onChange={e => set('color', e.target.value)} placeholder="White" className="input-base" /></Field>
            <Field label="Make" required><input value={form.make} onChange={e => set('make', e.target.value)} placeholder="Toyota" className="input-base" /></Field>
            <Field label="Model" required><input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Land Cruiser" className="input-base" /></Field>
            <Field label="Year"><input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2023" min={1990} max={2027} className="input-base" /></Field>
            <Field label="Mileage In (km)"><input type="number" value={form.mileage_in} onChange={e => set('mileage_in', e.target.value)} placeholder="45000" className="input-base" /></Field>
            <Field label="Chassis / VIN" full><input value={form.vin} onChange={e => set('vin', e.target.value.toUpperCase())} placeholder="JT3HN87R..." className="input-base font-mono uppercase" /></Field>
          </Section>

          <Section icon={Wrench} title="Job Details">
            <Field label="Job Type">
              <div className="relative">
                <select value={form.job_type} onChange={e => set('job_type', e.target.value)} className="input-base appearance-none pr-8">
                  {JOB_TYPES.map(t => <option key={t} value={t} className="dark:bg-zinc-900">{JOB_TYPE_LABEL[t]}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              </div>
            </Field>
            <Field label="Assign Technician">
              <div className="relative">
                <select value={form.technician_id} onChange={e => set('technician_id', e.target.value)} className="input-base appearance-none pr-8">
                  <option value="" className="dark:bg-zinc-900">— Unassigned —</option>
                  {technicians.map(t => <option key={t.id} value={t.id} className="dark:bg-zinc-900">{t.name} ({t.role})</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
              </div>
            </Field>
            <Field label="Date In"><input type="date" value={form.date_in} onChange={e => set('date_in', e.target.value)} className="input-base" /></Field>
            <Field label="Expected Delivery"><input type="date" value={form.date_out} onChange={e => set('date_out', e.target.value)} min={form.date_in} className="input-base" /></Field>
            <Field label="Customer Complaint / Request" full>
              <textarea value={form.customer_complaint} onChange={e => set('customer_complaint', e.target.value)} placeholder="What the customer says needs attention..." rows={3} className="input-base resize-none" />
            </Field>
            <Field label="Work Instructions (internal)" full>
              <textarea value={form.work_instructions} onChange={e => set('work_instructions', e.target.value)} placeholder="Technical notes for the technician..." rows={2} className="input-base resize-none" />
            </Field>
          </Section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/workshop/job-cards" className="btn-ghost">Cancel</Link>
            <button type="submit" disabled={isPending} className="btn-primary px-6">
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><CheckCircle className="h-4 w-4" /> Create Job Card</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

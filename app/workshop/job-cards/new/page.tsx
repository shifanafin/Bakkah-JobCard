'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { createJobCard, getTechnicians } from '@/lib/queries'
import { JOB_TYPE_LABEL, type JobType } from '@/types'
import { ArrowLeft, Car, User, Wrench, CheckCircle, Loader2, ChevronDown, Phone, AlertCircle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

const JOB_TYPES: JobType[] = ['service', 'inspection', 'detailing', 'repair', 'rta_check', 'valuation', 'other']

// ─── Phone helpers ────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw
  // +971XXXXXXXXX → already international
  if (digits.startsWith('971') && digits.length === 12) return `+${digits}`
  // 0XXXXXXXXX → local UAE format
  if (digits.startsWith('0') && digits.length === 10) return `+971${digits.slice(1)}`
  // 9-digit number starting with valid UAE prefix (5x, 4x, 2x, 6x, 3x, 7x)
  if (digits.length === 9 && /^[2-9]/.test(digits)) return `+971${digits}`
  return raw
}

function validatePhone(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Phone number is required'
  const normalized = normalizePhone(trimmed)
  // Must resolve to +971 followed by 9 digits
  const digits = normalized.replace(/\D/g, '')
  if (!/^971\d{9}$/.test(digits)) {
    return 'Enter a valid UAE number: +971 5X XXX XXXX or 05X XXX XXXX'
  }
  return ''
}

function formatPhoneDisplay(raw: string): string {
  const normalized = normalizePhone(raw.trim())
  const digits = normalized.replace(/\D/g, '')
  if (/^971\d{9}$/.test(digits)) {
    // +971 5X XXX XXXX
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  return raw
}

// ─── Validation rules ─────────────────────────────────────────────────────────

type FormState = {
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_company: string
  is_fleet: boolean
  plate_number: string
  make: string
  model: string
  year: string
  color: string
  vin: string
  job_type: JobType
  date_in: string
  date_out: string
  mileage_in: string
  customer_complaint: string
  work_instructions: string
  technician_id: string
}

function validateForm(f: FormState): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!f.customer_name.trim()) {
    errors.customer_name = 'Customer name is required'
  } else if (f.customer_name.trim().length < 2) {
    errors.customer_name = 'Name must be at least 2 characters'
  }

  const phoneErr = validatePhone(f.customer_phone)
  if (phoneErr) errors.customer_phone = phoneErr

  if (f.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.customer_email.trim())) {
    errors.customer_email = 'Enter a valid email address'
  }

  if (!f.plate_number.trim()) {
    errors.plate_number = 'Plate number is required'
  } else if (f.plate_number.trim().length < 2) {
    errors.plate_number = 'Enter a valid plate number'
  }

  if (!f.make.trim()) errors.make = 'Vehicle make is required'
  if (!f.model.trim()) errors.model = 'Vehicle model is required'

  if (f.year) {
    const y = parseInt(f.year)
    if (isNaN(y) || y < 1990 || y > new Date().getFullYear() + 2) {
      errors.year = `Year must be between 1990 and ${new Date().getFullYear() + 2}`
    }
  }

  if (f.mileage_in) {
    const m = parseInt(f.mileage_in)
    if (isNaN(m) || m < 0 || m > 9999999) {
      errors.mileage_in = 'Enter a valid mileage (0 – 9,999,999 km)'
    }
  }

  if (!f.date_in) errors.date_in = 'Check-in date is required'

  if (f.date_out && f.date_in && f.date_out < f.date_in) {
    errors.date_out = 'Delivery date must be on or after check-in date'
  }

  return errors
}

// ─── UI sub-components ────────────────────────────────────────────────────────

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

function Field({
  label, required, children, full, error,
}: {
  label: string; required?: boolean; children: React.ReactNode; full?: boolean; error?: string
}) {
  return (
    <div className={cn(full && 'sm:col-span-2')}>
      <label className="label">
        {label}
        {required && <span className="ltr:ml-0.5 rtl:mr-0.5 text-brand">*</span>}
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

function PhoneField({
  value, onChange, error,
}: {
  value: string; onChange: (v: string) => void; error?: string
}) {
  const [touched, setTouched] = useState(false)
  const phoneErr = touched ? validatePhone(value) : error
  const digits = normalizePhone(value.trim()).replace(/\D/g, '')
  const isValid = /^971\d{9}$/.test(digits)
  const showPreview = value.trim() && isValid

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  function handleBlur() {
    setTouched(true)
    if (value.trim() && isValid) {
      onChange(formatPhoneDisplay(value))
    }
  }

  return (
    <div>
      <label className="label">
        Phone Number <span className="ltr:ml-0.5 rtl:mr-0.5 text-brand">*</span>
      </label>
      <div className="relative">
        <Phone className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/30 pointer-events-none" />
        <input
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="+971 50 123 4567 or 050 123 4567"
          type="tel"
          inputMode="tel"
          className={cn(
            'input-base w-full ltr:pl-9 rtl:pr-9 ltr:pr-9 rtl:pl-9',
            touched && phoneErr && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
            touched && !phoneErr && value.trim() && 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20',
          )}
        />
        {touched && value.trim() && (
          <div className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2">
            {isValid
              ? <Check className="h-4 w-4 text-emerald-500" />
              : <AlertCircle className="h-4 w-4 text-red-400" />
            }
          </div>
        )}
      </div>
      {showPreview && (
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Check className="h-3 w-3" /> Saved as: {formatPhoneDisplay(value)}
        </p>
      )}
      {touched && phoneErr && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3 shrink-0" /> {phoneErr}
        </p>
      )}
      {!touched && !error && (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-white/30">
          Accepted: <span className="font-mono">+971 5X XXX XXXX</span> or <span className="font-mono">05X XXX XXXX</span>
        </p>
      )}
      {!touched && error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewJobCardPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [technicians, setTechnicians] = useState<{ id: string; name: string; role: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState<FormState>({
    customer_name: '', customer_phone: '', customer_email: '', customer_company: '', is_fleet: false,
    plate_number: '', make: '', model: '', year: '', color: '', vin: '',
    job_type: 'service', date_in: today, date_out: '', mileage_in: '',
    customer_complaint: '', work_instructions: '', technician_id: '',
  })

  useEffect(() => { getTechnicians().then(setTechnicians).catch(console.error) }, [])

  function set(k: keyof FormState, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
    // Clear the error for this field as soon as the user edits it
    if (submitted && errors[k]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[k]
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)

    // Normalize phone before validation
    const normalizedPhone = normalizePhone(form.customer_phone.trim())
    const normalizedForm = { ...form, customer_phone: normalizedPhone }
    setForm(normalizedForm)

    const errs = validateForm(normalizedForm)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector('[data-error]')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      toast.error('Please fix the highlighted errors')
      return
    }

    setErrors({})
    startTransition(async () => {
      try {
        const jc = await createJobCard({
          ...normalizedForm,
          year: normalizedForm.year ? parseInt(normalizedForm.year) : undefined,
          mileage_in: normalizedForm.mileage_in ? parseInt(normalizedForm.mileage_in) : undefined,
          technician_id: normalizedForm.technician_id || undefined,
        })
        toast.success(`Job card ${jc.job_number} created!`)
        router.push(`/workshop/job-cards/${jc.id}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create job card')
      }
    })
  }

  const e = errors

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-900">
      <Header title="New Job Card" subtitle="Vehicle check-in" />
      <div className="mx-auto max-w-4xl p-4 lg:p-6">

        <div className="mb-4">
          <Link href="/workshop/job-cards" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-white/40 dark:hover:text-white/70 w-fit">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to Job Cards
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ── Customer Details ─────────────────────────────── */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <User className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Customer Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Field label="Full Name" required error={e.customer_name}>
                <input
                  value={form.customer_name}
                  onChange={ev => set('customer_name', ev.target.value)}
                  onBlur={() => submitted && setErrors(prev => ({ ...prev, ...validateForm({ ...form }) }))}
                  placeholder="Mohammed Al Rashid"
                  data-error={e.customer_name ? true : undefined}
                  className={cn('input-base w-full', e.customer_name && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <PhoneField
                value={form.customer_phone}
                onChange={v => set('customer_phone', v)}
                error={e.customer_phone}
              />

              <Field label="Email Address" error={e.customer_email}>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={ev => set('customer_email', ev.target.value)}
                  placeholder="customer@email.com"
                  className={cn('input-base w-full', e.customer_email && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <Field label="Company (fleet clients)">
                <input
                  value={form.customer_company}
                  onChange={ev => set('customer_company', ev.target.value)}
                  placeholder="Al Futtaim Logistics LLC"
                  className="input-base w-full"
                />
              </Field>

              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-white/60">
                  <input type="checkbox" checked={form.is_fleet} onChange={ev => set('is_fleet', ev.target.checked)} className="h-4 w-4 accent-brand rounded" />
                  Fleet / Corporate Account (B2B)
                </label>
              </div>

            </div>
          </div>

          {/* ── Vehicle Details ──────────────────────────────── */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Car className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Vehicle Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Field label="Plate Number" required error={e.plate_number}>
                <input
                  value={form.plate_number}
                  onChange={ev => set('plate_number', ev.target.value.toUpperCase())}
                  placeholder="A 12345 or ABC 1234"
                  data-error={e.plate_number ? true : undefined}
                  className={cn('input-base w-full font-mono uppercase tracking-widest', e.plate_number && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <Field label="Color">
                <input value={form.color} onChange={ev => set('color', ev.target.value)} placeholder="White" className="input-base w-full" />
              </Field>

              <Field label="Make" required error={e.make}>
                <input
                  value={form.make}
                  onChange={ev => set('make', ev.target.value)}
                  placeholder="Toyota"
                  data-error={e.make ? true : undefined}
                  className={cn('input-base w-full', e.make && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <Field label="Model" required error={e.model}>
                <input
                  value={form.model}
                  onChange={ev => set('model', ev.target.value)}
                  placeholder="Land Cruiser"
                  data-error={e.model ? true : undefined}
                  className={cn('input-base w-full', e.model && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <Field label="Year" error={e.year}>
                <input
                  type="number"
                  value={form.year}
                  onChange={ev => set('year', ev.target.value)}
                  placeholder={String(new Date().getFullYear())}
                  min={1990}
                  max={new Date().getFullYear() + 2}
                  className={cn('input-base w-full', e.year && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <Field label="Mileage In (km)" error={e.mileage_in}>
                <input
                  type="number"
                  value={form.mileage_in}
                  onChange={ev => set('mileage_in', ev.target.value)}
                  placeholder="45000"
                  min={0}
                  className={cn('input-base w-full', e.mileage_in && 'border-red-400 focus:border-red-400 focus:ring-red-400/20')}
                />
              </Field>

              <Field label="Chassis / VIN" full>
                <input
                  value={form.vin}
                  onChange={ev => set('vin', ev.target.value.toUpperCase())}
                  placeholder="JT3HN87R..."
                  className="input-base w-full font-mono uppercase"
                />
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/30">17-character vehicle identification number (optional)</p>
              </Field>

            </div>
          </div>

          {/* ── Job Details ──────────────────────────────────── */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-white/[0.06]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15">
                <Wrench className="h-3.5 w-3.5 text-brand" />
              </div>
              <h2 className="section-title">Job Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Field label="Job Type">
                <div className="relative">
                  <select value={form.job_type} onChange={ev => set('job_type', ev.target.value)} className="input-base appearance-none w-full ltr:pr-8 rtl:pl-8">
                    {JOB_TYPES.map(t => <option key={t} value={t} className="dark:bg-zinc-900">{JOB_TYPE_LABEL[t]}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute ltr:right-3 rtl:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
                </div>
              </Field>

              <Field label="Assign Technician">
                <div className="relative">
                  <select value={form.technician_id} onChange={ev => set('technician_id', ev.target.value)} className="input-base appearance-none w-full ltr:pr-8 rtl:pl-8">
                    <option value="" className="dark:bg-zinc-900">— Unassigned —</option>
                    {technicians.map(t => <option key={t.id} value={t.id} className="dark:bg-zinc-900">{t.name} ({t.role})</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute ltr:right-3 rtl:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/30" />
                </div>
              </Field>

              <Field label="Date In" required error={e.date_in}>
                <input
                  type="date"
                  value={form.date_in}
                  onChange={ev => set('date_in', ev.target.value)}
                  className={cn('input-base w-full', e.date_in && 'border-red-400')}
                />
              </Field>

              <Field label="Expected Delivery" error={e.date_out}>
                <input
                  type="date"
                  value={form.date_out}
                  onChange={ev => set('date_out', ev.target.value)}
                  min={form.date_in}
                  className={cn('input-base w-full', e.date_out && 'border-red-400')}
                />
                {!e.date_out && form.date_in && (
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-white/30">Must be on or after check-in date</p>
                )}
              </Field>

              <Field label="Customer Complaint / Request" full>
                <textarea
                  value={form.customer_complaint}
                  onChange={ev => set('customer_complaint', ev.target.value)}
                  placeholder="What the customer says needs attention..."
                  rows={3}
                  className="input-base resize-none w-full"
                />
              </Field>

              <Field label="Work Instructions (internal)" full>
                <textarea
                  value={form.work_instructions}
                  onChange={ev => set('work_instructions', ev.target.value)}
                  placeholder="Technical notes for the technician..."
                  rows={2}
                  className="input-base resize-none w-full"
                />
              </Field>

            </div>
          </div>

          {/* ── Error summary ────────────────────────────────── */}
          {submitted && Object.keys(errors).length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Please fix the following errors:</p>
                  <ul className="mt-1 space-y-0.5">
                    {Object.values(errors).map((msg, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">• {msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

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

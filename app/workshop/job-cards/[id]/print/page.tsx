'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { JOB_STATUS_LABEL, JOB_TYPE_LABEL } from '@/types'
import { Printer, X } from 'lucide-react'

type PrintJob = {
  id: string
  job_number: string
  status: string
  job_type: string
  date_in: string
  date_out?: string
  mileage_in?: number
  mileage_out?: number
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  payment_status: string
  payment_method?: string
  customer_complaint?: string
  work_instructions?: string
  internal_notes?: string
  customer?: { name: string; phone?: string; email?: string; company_name?: string; emirates_id?: string }
  vehicle?: { plate_number: string; make: string; model: string; year?: number; color?: string; vin?: string }
  technician?: { name: string }
  services?: { id: string; description: string; quantity: number; unit_price: number; total_price: number; completed: boolean }[]
  parts?: { id: string; part_name: string; part_number?: string; quantity: number; unit_price: number; total_price: number }[]
}

function fmt(n: number) { return `AED ${n.toFixed(2)}` }
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PrintJobCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [job, setJob] = useState<PrintJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('job_cards')
      .select('*, customer:customers(*), vehicle:vehicles(*), technician:technicians(name), services:job_card_services(*), parts:job_card_parts(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setJob(data as PrintJob); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!loading && job) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [loading, job])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#C9A227] border-t-transparent" />
          <p className="text-sm text-gray-500">Preparing job card…</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return <div className="flex h-screen items-center justify-center"><p className="text-gray-500">Job card not found</p></div>
  }

  const services = job.services ?? []
  const parts = job.parts ?? []

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          thead { display: table-header-group; }
        }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; margin: 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
      `}</style>

      {/* Action bar — hidden on print */}
      <div className="no-print fixed top-0 inset-x-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur border-b border-gray-200 px-6 py-3 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">Job Card: <span className="text-[#C9A227] font-mono">{job.job_number}</span></p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-bold text-black hover:bg-[#d4b22e] transition-colors"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div style={{ paddingTop: '60px', maxWidth: '210mm', margin: '0 auto', padding: '60px 16px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #C9A227', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.12em', color: '#1b2009' }}>BAKKAH</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.18em', color: '#C9A227', fontWeight: 700, textTransform: 'uppercase' }}>PREMIUM AUTO CARE</div>
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#555', lineHeight: '1.6' }}>
              Al Qusais Industrial Area, Dubai, UAE<br />
              +971 54 588 6999 · info@bakkah.ae
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#C9A227', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              {job.job_number}
            </div>
            <div style={{ marginTop: '4px', display: 'inline-block', background: '#f5f0e0', border: '1px solid #C9A227', borderRadius: '4px', padding: '2px 10px', fontSize: '10px', fontWeight: '700', color: '#7a5c00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              JOB CARD
            </div>
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#555' }}>
              Date In: <strong>{fmtDate(job.date_in)}</strong><br />
              {job.date_out && <>Due: <strong>{fmtDate(job.date_out)}</strong><br /></>}
              Status: <strong style={{ color: '#1b2009' }}>{JOB_STATUS_LABEL[job.status as keyof typeof JOB_STATUS_LABEL] ?? job.status}</strong>
            </div>
          </div>
        </div>

        {/* Info grid — Customer / Vehicle / Job */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {/* Customer */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '5px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>Customer</div>
            <div style={{ padding: '8px 10px', fontSize: '11px', lineHeight: '1.7', color: '#222' }}>
              <strong>{job.customer?.name ?? '—'}</strong><br />
              {job.customer?.phone && <>{job.customer.phone}<br /></>}
              {job.customer?.email && <span style={{ color: '#555' }}>{job.customer.email}<br /></span>}
              {job.customer?.company_name && <span style={{ color: '#555' }}>{job.customer.company_name}</span>}
            </div>
          </div>

          {/* Vehicle */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '5px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>Vehicle</div>
            <div style={{ padding: '8px 10px', fontSize: '11px', lineHeight: '1.7', color: '#222' }}>
              <strong style={{ fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{job.vehicle?.plate_number ?? '—'}</strong><br />
              {job.vehicle?.make} {job.vehicle?.model} {job.vehicle?.year}<br />
              {job.vehicle?.color && <span style={{ color: '#555' }}>Color: {job.vehicle.color}<br /></span>}
              {job.vehicle?.vin && <span style={{ color: '#777', fontSize: '9px' }}>VIN: {job.vehicle.vin}</span>}
            </div>
          </div>

          {/* Job Info */}
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '5px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>Job Details</div>
            <div style={{ padding: '8px 10px', fontSize: '11px', lineHeight: '1.7', color: '#222' }}>
              Type: <strong>{JOB_TYPE_LABEL[job.job_type] ?? job.job_type}</strong><br />
              {job.mileage_in && <>Mileage: <strong>{job.mileage_in.toLocaleString()} km</strong><br /></>}
              {job.technician?.name && <>Technician: <strong>{job.technician.name}</strong><br /></>}
              Payment: <strong style={{ textTransform: 'capitalize' }}>{job.payment_status}</strong>
              {job.payment_method && <> ({job.payment_method})</>}
            </div>
          </div>
        </div>

        {/* Customer Complaint */}
        {job.customer_complaint && (
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '4px' }}>Customer Complaint / Request</div>
            <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6' }}>{job.customer_complaint}</div>
          </div>
        )}

        {/* Work Instructions */}
        {job.work_instructions && (
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '4px' }}>Work Instructions</div>
            <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6' }}>{job.work_instructions}</div>
          </div>
        )}

        {/* Services Table */}
        {services.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1b2009', marginBottom: '5px', borderBottom: '2px solid #C9A227', paddingBottom: '3px' }}>
              Services &amp; Labour
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Description</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Total</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Done?</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td>{s.description}</td>
                    <td style={{ textAlign: 'center' }}>{s.quantity}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{s.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>{s.total_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{s.completed ? '✓' : '○'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Parts Table */}
        {parts.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1b2009', marginBottom: '5px', borderBottom: '2px solid #C9A227', paddingBottom: '3px' }}>
              Parts &amp; Materials
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Part Name</th>
                  <th style={{ width: '16%' }}>Ref / Code</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '17%', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ width: '17%', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {parts.map(p => (
                  <tr key={p.id}>
                    <td>{p.part_name}</td>
                    <td style={{ color: '#666', fontSize: '10px', fontFamily: 'monospace' }}>{p.part_number ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{p.quantity}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{p.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>{p.total_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <table style={{ width: '260px' }}>
            <tbody>
              <tr>
                <td style={{ border: 'none', padding: '3px 8px', color: '#555' }}>Subtotal</td>
                <td style={{ border: 'none', padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{job.subtotal.toFixed(2)} AED</td>
              </tr>
              {job.discount > 0 && (
                <tr>
                  <td style={{ border: 'none', padding: '3px 8px', color: '#555' }}>Discount</td>
                  <td style={{ border: 'none', padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#e44' }}>−{job.discount.toFixed(2)} AED</td>
                </tr>
              )}
              <tr>
                <td style={{ border: 'none', padding: '3px 8px', color: '#555' }}>VAT (5%)</td>
                <td style={{ border: 'none', padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{job.vat_amount.toFixed(2)} AED</td>
              </tr>
              <tr>
                <td style={{ borderTop: '2px solid #C9A227', padding: '6px 8px', fontWeight: '800', fontSize: '13px' }}>TOTAL</td>
                <td style={{ borderTop: '2px solid #C9A227', padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '800', fontSize: '14px', color: '#1b2009' }}>{job.total.toFixed(2)} AED</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Internal Notes */}
        {job.internal_notes && (
          <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', background: '#fafafa' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '4px' }}>Internal Notes (Staff Only)</div>
            <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.6' }}>{job.internal_notes}</div>
          </div>
        )}

        {/* Signature Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '14px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '24px' }}>Customer Signature</div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#555' }}>Name &amp; Date</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '24px' }}>Authorised Staff</div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#555' }}>Name &amp; Date</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '8px', textAlign: 'center', fontSize: '9px', color: '#888' }}>
          Bakkah Premium Auto Care · Al Qusais Industrial Area, Dubai, UAE · +971 54 588 6999 · info@bakkah.ae<br />
          Generated: {new Date().toLocaleString('en-AE')} · {job.job_number}
        </div>
      </div>
    </>
  )
}

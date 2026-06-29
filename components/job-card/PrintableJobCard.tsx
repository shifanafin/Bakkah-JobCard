'use client'

import { type JobCard, JOB_STATUS_LABEL, JOB_TYPE_LABEL } from '@/types'

function fmtDate(s?: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtNum(n?: number | null) {
  return (n ?? 0).toFixed(2)
}

export default function PrintableJobCard({ job }: { job: JobCard }) {
  const services = job.services ?? []
  const parts = job.parts ?? []
  const computedSubtotal = [...services.map(s => s.total_price), ...parts.map(p => p.total_price)].reduce((a, b) => a + b, 0)
  const discount = job.discount || 0
  // Use computed if > 0, otherwise fall back to stored value synced from invoice
  const subtotal = computedSubtotal > 0 ? computedSubtotal : (job.subtotal || 0)
  const vatBase = Math.max(0, subtotal - discount)
  const vat = computedSubtotal > 0 ? parseFloat((vatBase * 0.05).toFixed(2)) : (job.vat_amount || 0)
  const total = computedSubtotal > 0 ? parseFloat((vatBase + vat).toFixed(2)) : (job.total || 0)

  const payColor = job.payment_status === 'paid' ? '#166534' : job.payment_status === 'partial' ? '#92400e' : '#991b1b'

  return (
    <div
      className="bakkah-print-view"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', color: '#111', background: '#fff', padding: '0' }}
    >
      <style>{`
        @media screen { .bakkah-print-view { display: none !important; } }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body * { visibility: hidden; }
          .bakkah-print-view, .bakkah-print-view * { visibility: visible; }
          .bakkah-print-view {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            visibility: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 5px 8px; text-align: left; }
          th { background-color: #f5f5f5 !important; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
        }
      `}</style>

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
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#555', lineHeight: '1.7' }}>
            Date In: <strong>{fmtDate(job.date_in)}</strong><br />
            {job.date_out && <>Due: <strong>{fmtDate(job.date_out)}</strong><br /></>}
            {job.date_delivered && <>Delivered: <strong>{fmtDate(job.date_delivered)}</strong><br /></>}
            Status: <strong style={{ color: '#1b2009' }}>{JOB_STATUS_LABEL[job.status as keyof typeof JOB_STATUS_LABEL] ?? job.status}</strong>
          </div>
        </div>
      </div>

      {/* Info grid */}
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

        {/* Job Details */}
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', padding: '5px 10px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555' }}>Job Details</div>
          <div style={{ padding: '8px 10px', fontSize: '11px', lineHeight: '1.7', color: '#222' }}>
            Type: <strong>{JOB_TYPE_LABEL[job.job_type] ?? job.job_type}</strong><br />
            {job.mileage_in != null && <>Mileage In: <strong>{job.mileage_in.toLocaleString()} km</strong><br /></>}
            {job.mileage_out != null && <>Mileage Out: <strong>{(job.mileage_out as number).toLocaleString()} km</strong><br /></>}
            {job.technician?.name && <>Technician: <strong>{job.technician.name}</strong><br /></>}
            Payment:{' '}
            <strong style={{ textTransform: 'capitalize', color: payColor }}>{job.payment_status}</strong>
            {job.payment_method && <> · {(job.payment_method as string).replace(/_/g, ' ')}</>}
          </div>
        </div>
      </div>

      {/* Customer Complaint */}
      {job.customer_complaint && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '4px' }}>Customer Complaint / Request</div>
          <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{job.customer_complaint}</div>
        </div>
      )}

      {/* Work Instructions */}
      {job.work_instructions && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '4px' }}>Work Instructions</div>
          <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{job.work_instructions}</div>
        </div>
      )}

      {/* Services Table */}
      {services.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1b2009', marginBottom: '5px', borderBottom: '2px solid #C9A227', paddingBottom: '3px' }}>
            Services &amp; Labour
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '42%', border: '1px solid #ddd', padding: '5px 8px', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ width: '10%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ width: '18%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Unit Price</th>
                <th style={{ width: '18%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Total</th>
                <th style={{ width: '12%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Done</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{s.description}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center' }}>{s.quantity}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(s.unit_price)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmtNum(s.total_price)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center' }}>{s.completed ? '✓' : '○'}</td>
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
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '38%', border: '1px solid #ddd', padding: '5px 8px', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Part Name</th>
                <th style={{ width: '16%', border: '1px solid #ddd', padding: '5px 8px', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Ref / Code</th>
                <th style={{ width: '10%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ width: '18%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Unit Price</th>
                <th style={{ width: '18%', border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', background: '#f5f5f5', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(p => (
                <tr key={p.id}>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>{p.part_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', color: '#666', fontSize: '10px', fontFamily: 'monospace' }}>{p.part_number ?? '—'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center' }}>{p.quantity}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(p.unit_price)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmtNum(p.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <table style={{ width: '260px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ border: 'none', padding: '3px 8px', color: '#555' }}>Subtotal</td>
              <td style={{ border: 'none', padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(subtotal)} AED</td>
            </tr>
            {discount > 0 && (
              <tr>
                <td style={{ border: 'none', padding: '3px 8px', color: '#555' }}>Discount</td>
                <td style={{ border: 'none', padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#e44' }}>−{fmtNum(discount)} AED</td>
              </tr>
            )}
            <tr>
              <td style={{ border: 'none', padding: '3px 8px', color: '#555' }}>VAT (5%)</td>
              <td style={{ border: 'none', padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{fmtNum(vat)} AED</td>
            </tr>
            <tr>
              <td style={{ borderTop: '2px solid #C9A227', padding: '6px 8px', fontWeight: '800', fontSize: '13px' }}>TOTAL</td>
              <td style={{ borderTop: '2px solid #C9A227', padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '800', fontSize: '14px', color: '#1b2009' }}>{fmtNum(total)} AED</td>
            </tr>
            <tr>
              <td colSpan={2} style={{ border: 'none', padding: '4px 8px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: payColor, textTransform: 'capitalize' }}>
                {job.payment_status}{job.payment_method ? ` — ${(job.payment_method as string).replace(/_/g, ' ')}` : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Internal Notes */}
      {job.internal_notes && (
        <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', background: '#fafafa' }}>
          <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '4px' }}>Internal Notes</div>
          <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{job.internal_notes}</div>
        </div>
      )}

      {/* Signature Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '14px' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '30px' }}>Customer Signature</div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#555' }}>Name &amp; Date</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: '30px' }}>Authorised Staff</div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontSize: '10px', color: '#555' }}>Name &amp; Date</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '14px', borderTop: '1px solid #e0e0e0', paddingTop: '8px', textAlign: 'center', fontSize: '9px', color: '#888' }}>
        Bakkah Premium Auto Care · Al Qusais Industrial Area, Dubai, UAE · +971 54 588 6999 · info@bakkah.ae<br />
        Printed: {new Date().toLocaleString('en-AE')} · {job.job_number}
      </div>
    </div>
  )
}

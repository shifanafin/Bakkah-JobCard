import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

type ImportRow = {
  customer_name: string
  customer_phone: string
  plate_number: string
  make: string
  model: string
  year?: string | number
  job_type: string
  date_in: string
  customer_complaint?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor' && role !== 'receptionist')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { rows }: { rows: ImportRow[] } = await req.json()
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    const sb = createServiceClient()
    const results: { row: number; job_number?: string; error?: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        if (!r.customer_name?.trim()) throw new Error('Customer name is required')
        if (!r.customer_phone?.trim()) throw new Error('Customer phone is required')
        if (!r.plate_number?.trim()) throw new Error('Plate number is required')
        if (!r.make?.trim()) throw new Error('Vehicle make is required')
        if (!r.model?.trim()) throw new Error('Vehicle model is required')
        if (!r.job_type?.trim()) throw new Error('Job type is required')
        if (!r.date_in?.trim()) throw new Error('Date In is required')

        // Upsert customer
        let customerId: string
        const { data: ec } = await sb.from('customers').select('id').eq('phone', r.customer_phone.trim()).maybeSingle()
        if (ec) {
          customerId = ec.id
          await sb.from('customers').update({ name: r.customer_name.trim() }).eq('id', customerId)
        } else {
          const { data: nc, error: ncErr } = await sb.from('customers').insert({
            name: r.customer_name.trim(),
            phone: r.customer_phone.trim(),
            is_fleet: false,
          }).select('id').single()
          if (ncErr) throw new Error(`Customer: ${ncErr.message}`)
          customerId = nc.id
        }

        // Upsert vehicle
        let vehicleId: string
        const plate = r.plate_number.toUpperCase().trim()
        const { data: ev } = await sb.from('vehicles').select('id').eq('plate_number', plate).maybeSingle()
        if (ev) {
          vehicleId = ev.id
          await sb.from('vehicles').update({ make: r.make.trim(), model: r.model.trim(), ...(r.year ? { year: parseInt(String(r.year)) } : {}) }).eq('id', vehicleId)
        } else {
          const { data: nv, error: nvErr } = await sb.from('vehicles').insert({
            customer_id: customerId,
            plate_number: plate,
            make: r.make.trim(),
            model: r.model.trim(),
            year: r.year ? parseInt(String(r.year)) : null,
          }).select('id').single()
          if (nvErr) throw new Error(`Vehicle: ${nvErr.message}`)
          vehicleId = nv.id
        }

        // Create job card
        const { data: jc, error: jcErr } = await sb.from('job_cards').insert({
          customer_id: customerId,
          vehicle_id: vehicleId,
          job_type: r.job_type.trim(),
          date_in: r.date_in.trim(),
          customer_complaint: r.customer_complaint?.trim() || null,
          status: 'received',
        }).select('id, job_number').single()
        if (jcErr) throw new Error(`Job card: ${jcErr.message}`)

        await sb.from('job_card_history').insert({ job_card_id: jc.id, new_status: 'received', notes: 'Imported via bulk import' })

        results.push({ row: i + 1, job_number: jc.job_number })
      } catch (err) {
        results.push({ row: i + 1, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    const created = results.filter(r => r.job_number).length
    const failed = results.filter(r => r.error).length
    return NextResponse.json({ created, failed, results })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

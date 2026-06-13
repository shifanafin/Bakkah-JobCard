import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'
import { headers } from 'next/headers'

export async function GET() {
  const session = await getServerSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session || (role !== 'admin' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const sb = createServiceClient()

  const [qtRes, pfRes, tiRes] = await Promise.all([
    sb.from('quotations')
      .select('id, quotation_number, status, subtotal, discount, vat_amount, total, created_at, updated_at, job_card_id, job_card:job_cards(job_number, status, customer:customers(name, phone))')
      .order('created_at', { ascending: false })
      .limit(200),
    sb.from('proforma_invoices')
      .select('id, proforma_number, subtotal, discount, vat_amount, total, invoice_date, created_at, job_card_id, job_card:job_cards(job_number, status, customer:customers(name, phone))')
      .order('created_at', { ascending: false })
      .limit(200),
    sb.from('tax_invoices')
      .select('id, invoice_number, status, subtotal, discount, vat_amount, total, invoice_date, created_at, job_card_id, job_card:job_cards(job_number, status, customer:customers(name, phone))')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  return NextResponse.json({
    quotations: qtRes.data ?? [],
    proformas: pfRes.data ?? [],
    taxInvoices: tiRes.data ?? [],
  })
}

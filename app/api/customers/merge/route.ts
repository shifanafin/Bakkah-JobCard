import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getServerSession } from '@/lib/server-session'

// POST /api/customers/merge
// Merges sourceId INTO targetId: moves all vehicles + job cards, then deletes source.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const role = session?.user?.role
    if (!session || (role !== 'admin' && role !== 'supervisor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { sourceId, targetId } = await req.json()
    if (!sourceId || !targetId) return NextResponse.json({ error: 'sourceId and targetId required' }, { status: 400 })
    if (sourceId === targetId) return NextResponse.json({ error: 'Cannot merge a customer with themselves' }, { status: 400 })

    const sb = createServiceClient()

    // Verify both customers exist
    const [src, tgt] = await Promise.all([
      sb.from('customers').select('id, name').eq('id', sourceId).single(),
      sb.from('customers').select('id, name').eq('id', targetId).single(),
    ])
    if (src.error || !src.data) return NextResponse.json({ error: 'Source customer not found' }, { status: 404 })
    if (tgt.error || !tgt.data) return NextResponse.json({ error: 'Target customer not found' }, { status: 404 })

    // Move vehicles
    await sb.from('vehicles').update({ customer_id: targetId }).eq('customer_id', sourceId)

    // Move job cards
    await sb.from('job_cards').update({ customer_id: targetId }).eq('customer_id', sourceId)

    // Delete source customer (vehicles + job_cards already moved, cascade won't hurt)
    await sb.from('customers').delete().eq('id', sourceId)

    return NextResponse.json({
      success: true,
      message: `Merged "${src.data.name}" into "${tgt.data.name}"`,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Merge failed' }, { status: 500 })
  }
}

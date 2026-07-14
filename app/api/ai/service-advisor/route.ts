import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-session'
import { getServiceAdvisorSuggestion } from '@/lib/ai/service-advisor'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const body = await req.json()
    const complaint = String(body.complaint ?? '').trim()
    if (!complaint) return NextResponse.json({ error: 'Complaint is required' }, { status: 400 })

    const suggestion = await getServiceAdvisorSuggestion({
      complaint,
      vehicle: body.vehicle,
    })

    if (!suggestion) {
      return NextResponse.json(
        { error: 'AI Service Advisor is not available right now. Enter the checklist manually.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ suggestion })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  const moiConfigured = !!(process.env.RTA_MOI_API_KEY && process.env.RTA_MOI_BASE_URL)
  const dpConfigured  = !!(process.env.RTA_DP_CLIENT_ID && process.env.RTA_DP_CLIENT_SECRET && process.env.RTA_DP_BASE_URL)
  const rtaConfigured = !!(process.env.RTA_API_KEY && process.env.RTA_BASE_URL)

  return NextResponse.json({
    moi_configured:          moiConfigured,
    dubai_police_configured: dpConfigured,
    rta_configured:          rtaConfigured,
    any_configured:          moiConfigured || dpConfigured || rtaConfigured,
    sources: {
      moi:          moiConfigured ? 'configured' : 'not_configured',
      dubai_police: dpConfigured  ? 'configured' : 'not_configured',
      rta:          rtaConfigured ? 'configured' : 'not_configured',
    },
  })
}

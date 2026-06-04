import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME!, api_key: process.env.CLOUDINARY_API_KEY!, api_secret: process.env.CLOUDINARY_API_SECRET! })

export async function POST(req: NextRequest) {
  try {
    const { public_id } = await req.json()
    if (!public_id) return NextResponse.json({ error: 'No public_id' }, { status: 400 })
    await cloudinary.uploader.destroy(public_id)
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Delete failed' }, { status: 500 }) }
}

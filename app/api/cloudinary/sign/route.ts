import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME!, api_key: process.env.CLOUDINARY_API_KEY!, api_secret: process.env.CLOUDINARY_API_SECRET! })

export async function POST(req: NextRequest) {
  try {
    const { folder } = await req.json()
    const timestamp = Math.round(Date.now() / 1000)
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET!)
    return NextResponse.json({ signature, timestamp, api_key: process.env.CLOUDINARY_API_KEY!, cloud_name: process.env.CLOUDINARY_CLOUD_NAME! })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

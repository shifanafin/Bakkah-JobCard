import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server-session'
import { extractDocumentFields, type DocumentType } from '@/lib/ai/document-ocr'

const VALID_TYPES: DocumentType[] = ['emirates_id', 'mulkiya', 'insurance', 'receipt', 'vin_plate', 'other']

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const body = await req.json()
    const documentType = body.documentType as DocumentType
    const imageDataUrl = String(body.imageDataUrl ?? '')

    if (!VALID_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid documentType' }, { status: 400 })
    }

    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ error: 'imageDataUrl must be a base64 image data URL' }, { status: 400 })
    }
    const [, mimeType, imageBase64] = match

    const result = await extractDocumentFields({ documentType, imageBase64, mimeType })

    if (!result) {
      return NextResponse.json(
        { error: 'AI document scan is not available right now. Enter the details manually.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

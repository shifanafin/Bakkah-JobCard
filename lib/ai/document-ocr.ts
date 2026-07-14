import { getGeminiClient, GEMINI_MODEL, Type } from '@/lib/ai/gemini'

export type DocumentType = 'emirates_id' | 'mulkiya' | 'insurance' | 'receipt' | 'vin_plate' | 'other'

export type DocumentOcrInput = {
  documentType: DocumentType
  /** Raw image bytes, base64-encoded (no data: prefix) */
  imageBase64: string
  /** e.g. "image/jpeg" */
  mimeType: string
}

export type DocumentOcrResult = {
  document_type: string
  fields: { key: string; value: string }[]
  raw_text: string
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    document_type: { type: Type.STRING },
    fields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['key', 'value'],
      },
    },
    raw_text: { type: Type.STRING },
  },
  required: ['document_type', 'fields', 'raw_text'],
}

const FIELD_HINTS: Record<DocumentType, string> = {
  emirates_id:
    'Extract: Full Name, Emirates ID Number (format 784-YYYY-XXXXXXX-X), Nationality, Date of Birth, Expiry Date, Sex.',
  mulkiya:
    'This is a UAE vehicle registration card (Mulkiya). Extract: Plate Number, Plate Code/Emirate, VIN/Chassis Number, Make, Model, Year, Color, Owner Name, Registration Expiry Date, Insurance Expiry Date if shown.',
  insurance:
    'Extract: Policy Number, Insurer Name, Vehicle Plate Number, Coverage Type, Start Date, Expiry Date.',
  receipt:
    'This is a supplier receipt or invoice. Extract: Vendor Name, Date, Total Amount, VAT Amount if shown, Invoice/Receipt Number, and list each line item as its own field (e.g. "Item 1", "Item 2").',
  vin_plate: 'Extract: VIN (17 characters), Plate Number if visible, Make, Model.',
  other: 'Extract every clearly readable label/value pair on the document.',
}

/** Returns null when AI isn't configured or the call/parse fails — never throws. */
export async function extractDocumentFields(
  input: DocumentOcrInput
): Promise<DocumentOcrResult | null> {
  const ai = getGeminiClient()
  if (!ai) return null

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'You are an OCR and data-extraction assistant for a UAE automotive workshop. ' +
                `Document type hint: ${input.documentType}. ${FIELD_HINTS[input.documentType]} ` +
                'If a field is not visible or not applicable, omit it rather than guessing. ' +
                'Also return the full raw text you can read from the image.',
            },
            { inlineData: { data: input.imageBase64, mimeType: input.mimeType } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const text = response.text
    if (!text) return null
    return JSON.parse(text) as DocumentOcrResult
  } catch (err) {
    console.error('[ai/document-ocr] extraction failed:', err)
    return null
  }
}

import { GoogleGenAI, Type } from '@google/genai'

/**
 * Model used for all AI features. Flash is multimodal (text + vision + OCR) and cheapest.
 * Uses Google's rolling "latest" alias rather than a pinned version — pinned Flash versions
 * get deprecated for new API projects on a schedule outside our control.
 */
export const GEMINI_MODEL = 'gemini-flash-latest'

let client: GoogleGenAI | null = null

/** Returns null (never throws) when GEMINI_API_KEY isn't configured, so callers can degrade gracefully. */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  if (!client) client = new GoogleGenAI({ apiKey })
  return client
}

export { Type }

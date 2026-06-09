const CACHE_VERSION = 'v1'
const BATCH_SIZE = 100 // Google Translate supports up to 128 strings per request

type FlatEntry = { path: string; text: string }

function flatten(obj: unknown, prefix = ''): FlatEntry[] {
  const result: FlatEntry[] = []
  if (typeof obj !== 'object' || obj === null) return result
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    const val = (obj as Record<string, unknown>)[key]
    if (typeof val === 'string') {
      result.push({ path, text: val })
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'string') {
          result.push({ path: `${path}.${i}`, text: item })
        } else {
          flatten(item, `${path}.${i}`).forEach(e => result.push(e))
        }
      })
    } else {
      flatten(val, path).forEach(e => result.push(e))
    }
  }
  return result
}

function setByPath(obj: Record<string, unknown>, path: string, value: string) {
  const parts = path.split('.')
  let curr = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (typeof curr[p] !== 'object' || curr[p] === null) curr[p] = {}
    curr = curr[p] as Record<string, unknown>
  }
  curr[parts[parts.length - 1]] = value
}

async function translateBatch(texts: string[], target: string): Promise<string[]> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target }),
  })
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`)
  const data = await res.json() as { translations: string[] }
  return data.translations
}

export async function getAITranslations(enObj: unknown, lang: string): Promise<unknown> {
  if (lang === 'en') return enObj

  const cacheKey = `ai_t_${lang}_${CACHE_VERSION}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  const entries = flatten(enObj)
  const result = JSON.parse(JSON.stringify(enObj)) as Record<string, unknown>

  // Send in batches of BATCH_SIZE (Google supports 128/request)
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    const translated = await translateBatch(batch.map(e => e.text), lang)
    batch.forEach((entry, idx) => setByPath(result, entry.path, translated[idx] ?? entry.text))
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result))
  } catch {}

  return result
}

export function clearTranslationCache() {
  const langs = ['ar', 'hi', 'ur', 'ta', 'fr']
  langs.forEach(lang => localStorage.removeItem(`ai_t_${lang}_${CACHE_VERSION}`))
}

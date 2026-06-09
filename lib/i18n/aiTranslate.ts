const CACHE_VERSION = 'v1'
const SEP = ' ||| '

const LANG_CODES: Record<string, string> = {
  ar: 'ar',
  hi: 'hi',
  ur: 'ur',
  ta: 'ta',
  fr: 'fr',
}

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

async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  const joined = texts.join(SEP)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(joined)}&langpair=en|${targetLang}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.responseStatus === 200) {
      const parts = (data.responseData.translatedText as string).split(SEP)
      if (parts.length === texts.length) return parts.map(p => p.trim())
    }
  } catch {}
  return texts
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
  const langCode = LANG_CODES[lang] ?? lang

  // Batch strings keeping each batch under 400 chars to respect API limits
  const batches: FlatEntry[][] = []
  let current: FlatEntry[] = []
  let len = 0

  for (const entry of entries) {
    const add = entry.text.length + SEP.length
    if (len + add > 400 && current.length > 0) {
      batches.push(current)
      current = []
      len = 0
    }
    current.push(entry)
    len += add
  }
  if (current.length > 0) batches.push(current)

  for (const batch of batches) {
    const translated = await translateBatch(batch.map(e => e.text), langCode)
    batch.forEach((entry, i) => setByPath(result, entry.path, translated[i] ?? entry.text))
    await new Promise(r => setTimeout(r, 120))
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result))
  } catch {}

  return result
}

export function clearTranslationCache() {
  Object.keys(LANG_CODES).forEach(lang => {
    localStorage.removeItem(`ai_t_${lang}_${CACHE_VERSION}`)
  })
}

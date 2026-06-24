// Persistence for the paint collection (localStorage with in-memory fallback).

const KEY = 'learn-watercolor:paints'
let memoryFallback = null

export function storageAvailable() {
  try {
    const t = '__lw_test__'
    localStorage.setItem(t, '1')
    localStorage.removeItem(t)
    return true
  } catch {
    return false
  }
}

export function loadPaints() {
  if (memoryFallback) return memoryFallback
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePaints(paints) {
  try {
    localStorage.setItem(KEY, JSON.stringify(paints))
  } catch {
    memoryFallback = paints
  }
}

export function exportPaints(paints) {
  const blob = new Blob([JSON.stringify(paints, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'koleksi-cat-air.json'
  a.click()
  URL.revokeObjectURL(url)
}

// Parse + validate an imported JSON string. Returns { paints } or throws.
export function parseImported(text) {
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('Format tidak valid: harus berupa daftar cat.')
  return data
    .filter((p) => p && typeof p.hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.hex))
    .map((p) => ({
      id: p.id || cryptoId(),
      brand: String(p.brand || '').slice(0, 60),
      name: String(p.name || 'Tanpa nama').slice(0, 60),
      hex: p.hex.toLowerCase(),
    }))
}

export function cryptoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'p_' + Math.abs(hashString(String(loadPaints().length) + navigatorSeed())).toString(36)
}

function navigatorSeed() {
  return (globalThis.performance?.now?.() ?? 0).toString()
}

function hashString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

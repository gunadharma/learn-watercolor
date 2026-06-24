// Central app state with a tiny pub/sub. UI modules subscribe and re-render.
import { loadPaints, savePaints, cryptoId } from './storage.js'

const listeners = new Set()

export const state = {
  paints: loadPaints(),
  activeTab: 'paints',
  analysis: null, // { imageDataUrl, palette: [{...recipe}], sketchDataUrl, steps }
  analyzing: false,
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notify() {
  for (const fn of listeners) fn(state)
}

export function setTab(tab) {
  state.activeTab = tab
  notify()
}

export function addPaint({ brand, name, hex }) {
  state.paints.push({ id: cryptoId(), brand: brand.trim(), name: name.trim(), hex: hex.toLowerCase() })
  persist()
}

export function updatePaint(id, patch) {
  const p = state.paints.find((x) => x.id === id)
  if (p) Object.assign(p, patch)
  persist()
}

export function removePaint(id) {
  state.paints = state.paints.filter((p) => p.id !== id)
  persist()
}

export function setPaints(paints) {
  state.paints = paints
  persist()
}

export function setAnalysis(analysis) {
  state.analysis = analysis
  state.analyzing = false
  notify()
}

export function setAnalyzing(v) {
  state.analyzing = v
  notify()
}

function persist() {
  savePaints(state.paints)
  notify()
}

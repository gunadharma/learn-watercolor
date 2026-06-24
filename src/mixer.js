// Subtractive watercolor mixing model + recipe search.
import { rgbToLinear, linearToRgb, rgbToLab, deltaE2000, rgbToHex } from './color.js'

const EPS = 1e-4
const WATER_LEVELS = [0, 0.2, 0.4, 0.6]
const RATIO_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

// Weighted geometric mean of linear reflectances (Beer-Lambert approximation):
// mixed = Π Ri^wi. Mixes darken realistically. weights need not be normalized.
export function mixReflectance(linears, weights) {
  const total = weights.reduce((s, w) => s + w, 0) || 1
  const out = [0, 0, 0]
  for (let ch = 0; ch < 3; ch++) {
    let acc = 0
    for (let i = 0; i < linears.length; i++) {
      const r = Math.max(linears[i][ch], EPS)
      acc += (weights[i] / total) * Math.log(r)
    }
    out[ch] = Math.exp(acc)
  }
  return out
}

// Diluting with water lightens toward paper white (linear 1.0).
export function applyWater(linear, water) {
  return linear.map((c) => c + (1 - c) * water)
}

// Predict the resulting 0..255 rgb of mixing the given paints (rgb) at weights, then
// diluting by `water` (0..1).
export function predictMix(paintRgbs, weights, water) {
  const linears = paintRgbs.map(rgbToLinear)
  const mixed = applyWater(mixReflectance(linears, weights), water)
  return linearToRgb(mixed)
}

export function classifyQuality(deltaE) {
  if (deltaE < 10) return 'good'
  if (deltaE < 25) return 'fair'
  return 'poor'
}

// Find the best recipe (1 or 2 paints + water) approximating targetRgb.
// paints: [{ id, brand, name, hex, rgb }]. Returns a recipe object or null.
export function findRecipe(targetRgb, paints) {
  if (!paints || paints.length === 0) return null
  const targetLab = rgbToLab(targetRgb)
  let best = null

  const consider = (paintEntries, weights, water) => {
    const rgbs = paintEntries.map((p) => p.rgb)
    const resultRgb = predictMix(rgbs, weights, water)
    const dE = deltaE2000(targetLab, rgbToLab(resultRgb))
    if (!best || dE < best.deltaE) {
      const total = weights.reduce((s, w) => s + w, 0)
      best = {
        paints: paintEntries.map((p, i) => ({
          paintId: p.id,
          ratio: Math.round((weights[i] / total) * 100),
        })),
        water,
        resultHex: rgbToHex(resultRgb),
        deltaE: dE,
        quality: classifyQuality(dE),
      }
    }
  }

  // Single paints
  for (const p of paints) {
    for (const w of WATER_LEVELS) consider([p], [1], w)
  }

  // Pairs
  for (let i = 0; i < paints.length; i++) {
    for (let j = i + 1; j < paints.length; j++) {
      for (const r of RATIO_STEPS) {
        for (const w of WATER_LEVELS) {
          consider([paints[i], paints[j]], [r, 1 - r], w)
        }
      }
    }
  }

  return best
}

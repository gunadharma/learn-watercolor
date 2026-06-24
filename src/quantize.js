// Perceptual color quantization (median-cut in CIELAB) with automatic palette
// sizing: over-segment, merge perceptually-similar colors, drop negligible ones,
// then recompute coverage weights. Produces a natural, image-driven palette.
import { rgbToLab, rgbToLinear, linearToRgb, deltaE2000 } from './color.js'

const DEFAULTS = { maxColors: 12, minColors: 4, mergeDeltaE: 9, minWeight: 0.02 }

// Fixed-count quantization (kept for direct use/tests).
// Returns palette entries { rgb, lab, weight }, sorted by weight desc.
export function quantize(rgbPixels, count) {
  const entries = toEntries(rgbPixels)
  if (entries.length === 0) return []
  const total = entries.length
  return medianCut(entries, count)
    .map((box) => summarize(box.entries, total))
    .sort((a, b) => b.weight - a.weight)
}

// Automatic palette sizing driven by the image's actual color complexity.
export function quantizeAuto(rgbPixels, opts = {}) {
  const { maxColors, minColors, mergeDeltaE, minWeight } = { ...DEFAULTS, ...opts }
  const entries = toEntries(rgbPixels)
  if (entries.length === 0) return []
  const total = entries.length

  // 1. Over-segment perceptually.
  let centers = medianCut(entries, maxColors).map((box) => summarize(box.entries, total))

  // 2. Merge colors that are perceptually too close to be separate paints.
  centers = mergeSimilar(centers, mergeDeltaE)

  // 3. Drop negligible colors, but keep at least minColors.
  centers.sort((a, b) => b.weight - a.weight)
  const kept = centers.filter((c, i) => c.weight >= minWeight || i < minColors).slice(0, maxColors)

  // 4. Recompute coverage by assigning every sample to its nearest final color.
  return recomputeWeights(kept, entries)
}

function toEntries(rgbPixels) {
  return (rgbPixels || []).filter(Boolean).map((rgb) => ({ rgb, lab: rgbToLab(rgb) }))
}

function medianCut(entries, count) {
  let boxes = [makeBox(entries)]
  while (boxes.length < count) {
    boxes.sort((a, b) => b.range - a.range)
    const box = boxes.shift()
    if (!box || box.entries.length < 2 || box.range === 0) {
      if (box) boxes.push(box)
      break
    }
    const [a, b] = splitBox(box)
    boxes.push(a, b)
  }
  return boxes
}

function makeBox(entries) {
  const box = { entries }
  computeRange(box)
  return box
}

// Range measured in Lab so splits follow perceived color, not raw RGB.
function computeRange(box) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const e of box.entries) {
    for (let c = 0; c < 3; c++) {
      if (e.lab[c] < min[c]) min[c] = e.lab[c]
      if (e.lab[c] > max[c]) max[c] = e.lab[c]
    }
  }
  const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  box.longest = ranges.indexOf(Math.max(...ranges))
  box.range = Math.max(...ranges)
}

function splitBox(box) {
  const ch = box.longest
  const sorted = [...box.entries].sort((p, q) => p.lab[ch] - q.lab[ch])
  const mid = Math.floor(sorted.length / 2)
  return [makeBox(sorted.slice(0, mid)), makeBox(sorted.slice(mid))]
}

function summarize(entries, total) {
  const rgb = averageLinear(entries)
  return { rgb, lab: rgbToLab(rgb), weight: entries.length / total }
}

// Average in linear-light RGB (physically correct), output sRGB.
function averageLinear(entries) {
  const sum = [0, 0, 0]
  for (const e of entries) {
    const lin = rgbToLinear(e.rgb)
    sum[0] += lin[0]
    sum[1] += lin[1]
    sum[2] += lin[2]
  }
  const n = entries.length
  return linearToRgb([sum[0] / n, sum[1] / n, sum[2] / n])
}

function mergeSimilar(centers, threshold) {
  let list = centers.map((c) => ({ ...c }))
  while (list.length > 1) {
    let bestI = -1
    let bestJ = -1
    let bestD = threshold
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const d = deltaE2000(list[i].lab, list[j].lab)
        if (d < bestD) {
          bestD = d
          bestI = i
          bestJ = j
        }
      }
    }
    if (bestI < 0) break
    const a = list[bestI]
    const b = list[bestJ]
    const wsum = a.weight + b.weight
    const la = rgbToLinear(a.rgb)
    const lb = rgbToLinear(b.rgb)
    const rgb = linearToRgb([0, 1, 2].map((c) => (la[c] * a.weight + lb[c] * b.weight) / wsum))
    const merged = { rgb, lab: rgbToLab(rgb), weight: wsum }
    list = list.filter((_, k) => k !== bestI && k !== bestJ)
    list.push(merged)
  }
  return list
}

function recomputeWeights(centers, entries) {
  if (centers.length === 0) return []
  const counts = new Array(centers.length).fill(0)
  for (const e of entries) {
    let best = 0
    let bd = Infinity
    for (let k = 0; k < centers.length; k++) {
      const d = labDist2(e.lab, centers[k].lab)
      if (d < bd) {
        bd = d
        best = k
      }
    }
    counts[best]++
  }
  const total = entries.length
  return centers
    .map((c, k) => ({ rgb: c.rgb, lab: c.lab, weight: counts[k] / total }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight)
}

function labDist2(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

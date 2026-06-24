// Build a light-to-dark, cumulative step-by-step painting tutorial from a photo.
import { luminance } from './color.js'

// Group palette indices into ordered steps, lightest first.
// Returns an array of groups; each group is an array of palette indices.
export function groupByLuminance(palette, maxSteps) {
  const order = palette
    .map((c, i) => ({ i, lum: luminance(c.rgb) }))
    .sort((a, b) => b.lum - a.lum) // lightest first
    .map((e) => e.i)
  const steps = Math.max(1, Math.min(maxSteps, order.length))
  const groups = Array.from({ length: steps }, () => [])
  order.forEach((idx, n) => {
    const g = Math.floor((n / order.length) * steps)
    groups[Math.min(g, steps - 1)].push(idx)
  })
  return groups.filter((g) => g.length > 0)
}

// Assign each pixel to the nearest palette color (squared RGB distance, fast).
export function assignPixels(imageData, palette) {
  const { data } = imageData
  const n = data.length / 4
  const assignment = new Int16Array(n)
  for (let p = 0; p < n; p++) {
    const o = p * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    let best = 0
    let bestD = Infinity
    for (let k = 0; k < palette.length; k++) {
      const [pr, pg, pb] = palette[k].rgb
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
      if (d < bestD) {
        bestD = d
        best = k
      }
    }
    assignment[p] = best
  }
  return assignment
}

function paintCanvas(w, h, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const out = ctx.createImageData(w, h)
  draw(out.data)
  ctx.putImageData(out, 0, 0)
  return canvas
}

// Cumulative render: palette colors in `includedSet` are painted; others = paper white.
function renderCumulative(imageData, assignment, palette, includedSet) {
  const { width: w, height: h } = imageData
  return paintCanvas(w, h, (out) => {
    for (let p = 0; p < assignment.length; p++) {
      const o = p * 4
      const idx = assignment[p]
      if (includedSet.has(idx)) {
        const [r, g, b] = palette[idx].rgb
        out[o] = r
        out[o + 1] = g
        out[o + 2] = b
      } else {
        out[o] = out[o + 1] = out[o + 2] = 255
      }
      out[o + 3] = 255
    }
  })
}

// Highlight only the pixels painted in this step over a faded base.
function renderMask(imageData, assignment, palette, stepSet) {
  const { width: w, height: h } = imageData
  return paintCanvas(w, h, (out) => {
    for (let p = 0; p < assignment.length; p++) {
      const o = p * 4
      if (stepSet.has(assignment[p])) {
        const [r, g, b] = palette[assignment[p]].rgb
        out[o] = r
        out[o + 1] = g
        out[o + 2] = b
      } else {
        // faint gray so the user sees where the highlight sits in the composition
        out[o] = out[o + 1] = out[o + 2] = 238
      }
      out[o + 3] = 255
    }
  })
}

// Build the layer steps (caller prepends the sketch step).
// palette entries are expected to carry an optional `recipe`.
export function buildLayerSteps(imageData, palette, maxSteps = 5) {
  const assignment = assignPixels(imageData, palette)
  const groups = groupByLuminance(palette, maxSteps)
  const included = new Set()
  const steps = []
  groups.forEach((group, gi) => {
    group.forEach((idx) => included.add(idx))
    const stepSet = new Set(group)
    const colors = group.map((idx) => palette[idx])
    steps.push({
      index: gi + 1,
      kind: 'layer',
      title: `Layer ${gi + 1} — ${describeTone(gi, groups.length)}`,
      instruction: buildInstruction(gi, groups.length, colors),
      imageDataUrl: renderCumulative(imageData, assignment, palette, new Set(included)).toDataURL('image/png'),
      maskDataUrl: renderMask(imageData, assignment, palette, stepSet).toDataURL('image/png'),
      colors,
    })
  })
  return steps
}

function describeTone(gi, total) {
  if (gi === 0) return 'wash paling terang'
  if (gi === total - 1) return 'detail & bayangan tergelap'
  return 'membangun mid-tone'
}

function buildInstruction(gi, total, colors) {
  const names = colors.length
  if (gi === 0) {
    return `Mulai dari area paling terang. Encerkan cat dengan banyak air untuk wash tipis, lalu tutup area besar dengan ${names} warna ini. Biarkan kering sebelum lanjut.`
  }
  if (gi === total - 1) {
    return `Langkah terakhir: tambahkan ${names} warna tergelap untuk bayangan dan detail. Gunakan air lebih sedikit agar pigmen lebih pekat. Bangun bertahap — mudah menambah, sulit mengurangi.`
  }
  return `Setelah layer sebelumnya kering, tambahkan ${names} warna mid-tone ini di atasnya untuk membangun bentuk dan kedalaman.`
}

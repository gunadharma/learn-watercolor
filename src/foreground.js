// Separate the subject from the background so analysis covers the object only.
//
// Heuristic (no AI, fully client-side): the background usually touches the image
// border. We sample the border, find its dominant colors, then flood-fill inward
// from the edges through pixels matching those background colors. Everything the
// flood reaches is background; the rest is the subject. Interior areas that happen
// to share the background color but are enclosed by the subject stay foreground
// because the flood can't reach them.
//
// If no separable background is found (e.g. a full-bleed texture or gradient), we
// fall back to treating the whole image as foreground.
import { quantize } from './quantize.js'

export function foregroundMask(imageData, opts = {}) {
  const { borderFrac = 0.06, colorThreshold = 52, minForegroundFrac = 0.1 } = opts
  const { width: w, height: h, data } = imageData
  const n = w * h

  // 1. Collect border pixels and find dominant background colors.
  const bw = Math.max(1, Math.round(Math.min(w, h) * borderFrac))
  const borderPx = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < bw || y < bw || x >= w - bw || y >= h - bw) {
        const o = (y * w + x) * 4
        borderPx.push([data[o], data[o + 1], data[o + 2]])
      }
    }
  }
  if (borderPx.length === 0) return filled(n)
  const sampleStep = Math.max(1, Math.ceil(borderPx.length / 5000))
  const bgColors = quantize(borderPx.filter((_, i) => i % sampleStep === 0), 3).map((c) => c.rgb)
  const thr2 = colorThreshold * colorThreshold

  const isBgColor = (o) => {
    for (const c of bgColors) {
      const dr = data[o] - c[0]
      const dg = data[o + 1] - c[1]
      const db = data[o + 2] - c[2]
      if (dr * dr + dg * dg + db * db <= thr2) return true
    }
    return false
  }

  // 2. Flood-fill background inward from the border.
  const bg = new Uint8Array(n)
  const queue = []
  const seed = (x, y) => {
    const i = y * w + x
    if (!bg[i] && isBgColor(i * 4)) {
      bg[i] = 1
      queue.push(i)
    }
  }
  for (let x = 0; x < w; x++) {
    seed(x, 0)
    seed(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    seed(0, y)
    seed(w - 1, y)
  }
  let head = 0
  while (head < queue.length) {
    const i = queue[head++]
    const x = i % w
    const y = (i - x) / w
    visit(x - 1, y)
    visit(x + 1, y)
    visit(x, y - 1)
    visit(x, y + 1)
  }
  function visit(nx, ny) {
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return
    const ni = ny * w + nx
    if (bg[ni]) return
    if (isBgColor(ni * 4)) {
      bg[ni] = 1
      queue.push(ni)
    }
  }

  // 3. Foreground = everything not reached. Fall back if too little remains.
  const fg = new Uint8Array(n)
  let fgCount = 0
  for (let i = 0; i < n; i++) {
    fg[i] = bg[i] ? 0 : 1
    fgCount += fg[i]
  }
  if (fgCount < n * minForegroundFrac) return filled(n)
  return fg
}

function filled(n) {
  return new Uint8Array(n).fill(1)
}

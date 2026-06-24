// Median-cut color quantization.
import { rgbToLab } from './color.js'

// pixels: flat Uint8ClampedArray-like RGBA or array of [r,g,b].
// Returns up to `count` palette entries: { rgb, lab, weight } where weight is the
// fraction of sampled pixels assigned to that color (sums to ~1).
export function quantize(rgbPixels, count) {
  const pixels = rgbPixels.filter(Boolean)
  if (pixels.length === 0) return []

  let boxes = [makeBox(pixels)]
  while (boxes.length < count) {
    // Split the box with the largest color range.
    boxes.sort((a, b) => b.range - a.range)
    const box = boxes.shift()
    if (!box || box.pixels.length < 2 || box.range === 0) {
      if (box) boxes.push(box)
      break
    }
    const [a, b] = splitBox(box)
    boxes.push(a, b)
  }

  const totalPixels = pixels.length
  return boxes
    .map((box) => {
      const rgb = averageColor(box.pixels)
      return { rgb, lab: rgbToLab(rgb), weight: box.pixels.length / totalPixels }
    })
    .sort((a, b) => b.weight - a.weight)
}

function makeBox(pixels) {
  const box = { pixels }
  computeRange(box)
  return box
}

function channelExtents(pixels) {
  const min = [255, 255, 255]
  const max = [0, 0, 0]
  for (const p of pixels) {
    for (let c = 0; c < 3; c++) {
      if (p[c] < min[c]) min[c] = p[c]
      if (p[c] > max[c]) max[c] = p[c]
    }
  }
  return { min, max }
}

function computeRange(box) {
  const { min, max } = channelExtents(box.pixels)
  const ranges = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  box.longest = ranges.indexOf(Math.max(...ranges))
  box.range = Math.max(...ranges)
}

function splitBox(box) {
  const ch = box.longest
  const sorted = [...box.pixels].sort((p, q) => p[ch] - q[ch])
  const mid = Math.floor(sorted.length / 2)
  return [makeBox(sorted.slice(0, mid)), makeBox(sorted.slice(mid))]
}

function averageColor(pixels) {
  const sum = [0, 0, 0]
  for (const p of pixels) {
    sum[0] += p[0]
    sum[1] += p[1]
    sum[2] += p[2]
  }
  const n = pixels.length
  return [Math.round(sum[0] / n), Math.round(sum[1] / n), Math.round(sum[2] / n)]
}

import { describe, it, expect } from 'vitest'
import { foregroundMask } from './foreground.js'

// Build a synthetic RGBA image: a `border`-colored frame around a `fill`-colored center.
function frameImage(w, h, frameRgb, fillRgb, inset = 2) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      const isBorder = x < inset || y < inset || x >= w - inset || y >= h - inset
      const c = isBorder ? frameRgb : fillRgb
      data[o] = c[0]
      data[o + 1] = c[1]
      data[o + 2] = c[2]
      data[o + 3] = 255
    }
  }
  return { width: w, height: h, data }
}

describe('foregroundMask', () => {
  it('keeps the subject and drops the border background', () => {
    const w = 16
    const h = 16
    const img = frameImage(w, h, [240, 240, 240], [200, 30, 30], 3)
    const mask = foregroundMask(img)
    // center pixel is subject
    expect(mask[(8 * w + 8)]).toBe(1)
    // corner pixel is background
    expect(mask[0]).toBe(0)
    // some pixels were removed but the subject survives
    const fg = mask.reduce((s, v) => s + v, 0)
    expect(fg).toBeGreaterThan(0)
    expect(fg).toBeLessThan(w * h)
  })

  it('falls back to full image when there is no separable background', () => {
    const w = 16
    const h = 16
    // uniform image: border colors match everything -> all flooded -> fallback
    const img = frameImage(w, h, [128, 128, 128], [128, 128, 128], 3)
    const mask = foregroundMask(img)
    expect(mask.reduce((s, v) => s + v, 0)).toBe(w * h)
  })
})

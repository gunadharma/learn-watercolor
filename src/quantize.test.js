import { describe, it, expect } from 'vitest'
import { quantize, quantizeAuto } from './quantize.js'
import { deltaE2000, rgbToLab } from './color.js'

function makePixels(colors, perColor) {
  const out = []
  for (const c of colors) for (let i = 0; i < perColor; i++) out.push([...c])
  return out
}

describe('quantize (fixed count)', () => {
  it('returns at most the requested count', () => {
    const pixels = makePixels([[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0]], 50)
    const palette = quantize(pixels, 4)
    expect(palette.length).toBeLessThanOrEqual(4)
    expect(palette.length).toBeGreaterThan(0)
  })

  it('weights sum to ~1', () => {
    const pixels = makePixels([[200, 10, 10], [10, 200, 10], [10, 10, 200]], 30)
    const sum = quantize(pixels, 3).reduce((s, p) => s + p.weight, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it('handles empty input', () => {
    expect(quantize([], 4)).toEqual([])
  })
})

describe('quantizeAuto', () => {
  it('weights sum to ~1', () => {
    const pixels = makePixels([[240, 240, 240], [20, 20, 20], [180, 60, 60]], 40)
    const sum = quantizeAuto(pixels).reduce((s, p) => s + p.weight, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it('merges perceptually-similar colors into fewer entries', () => {
    // Two near-identical blues + one distinct yellow -> should collapse to ~2.
    const pixels = makePixels([[40, 70, 160], [42, 72, 163], [230, 220, 40]], 60)
    const palette = quantizeAuto(pixels, { minColors: 1 })
    expect(palette.length).toBeLessThanOrEqual(2)
  })

  it('keeps clearly distinct colors separate', () => {
    const pixels = makePixels([[245, 245, 245], [10, 10, 10], [200, 30, 30], [30, 30, 200]], 50)
    const palette = quantizeAuto(pixels, { minColors: 1 })
    expect(palette.length).toBeGreaterThanOrEqual(3)
    // every pair is perceptually far apart
    for (let i = 0; i < palette.length; i++)
      for (let j = i + 1; j < palette.length; j++)
        expect(deltaE2000(rgbToLab(palette[i].rgb), rgbToLab(palette[j].rgb))).toBeGreaterThan(9)
  })

  it('handles empty input', () => {
    expect(quantizeAuto([])).toEqual([])
  })
})

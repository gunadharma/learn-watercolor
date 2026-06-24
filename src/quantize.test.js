import { describe, it, expect } from 'vitest'
import { quantize } from './quantize.js'

function makePixels(colors, perColor) {
  const out = []
  for (const c of colors) for (let i = 0; i < perColor; i++) out.push([...c])
  return out
}

describe('quantize', () => {
  it('returns at most the requested count', () => {
    const pixels = makePixels(
      [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
      ],
      50,
    )
    const palette = quantize(pixels, 4)
    expect(palette.length).toBeLessThanOrEqual(4)
    expect(palette.length).toBeGreaterThan(0)
  })

  it('weights sum to ~1', () => {
    const pixels = makePixels(
      [
        [200, 10, 10],
        [10, 200, 10],
        [10, 10, 200],
      ],
      30,
    )
    const palette = quantize(pixels, 3)
    const sum = palette.reduce((s, p) => s + p.weight, 0)
    expect(sum).toBeCloseTo(1, 5)
  })

  it('separates distinct clusters', () => {
    const pixels = makePixels(
      [
        [250, 250, 250],
        [5, 5, 5],
      ],
      40,
    )
    const palette = quantize(pixels, 2)
    expect(palette.length).toBe(2)
    const lums = palette.map((p) => p.rgb[0]).sort((a, b) => a - b)
    expect(lums[0]).toBeLessThan(50)
    expect(lums[1]).toBeGreaterThan(200)
  })

  it('handles empty input', () => {
    expect(quantize([], 4)).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  rgbToHex,
  rgbToLab,
  deltaE2000,
  luminance,
  srgbToLinear,
  linearToSrgb,
} from './color.js'

describe('hex <-> rgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff8800')).toEqual([255, 136, 0])
  })
  it('parses 3-digit hex', () => {
    expect(hexToRgb('#f80')).toEqual([255, 136, 0])
  })
  it('rejects invalid hex', () => {
    expect(hexToRgb('nope')).toBeNull()
  })
  it('round-trips', () => {
    expect(rgbToHex(hexToRgb('#3a7bd5'))).toBe('#3a7bd5')
  })
})

describe('srgb linear round-trip', () => {
  it('inverts', () => {
    for (const c of [0, 0.1, 0.5, 0.9, 1]) {
      expect(linearToSrgb(srgbToLinear(c))).toBeCloseTo(c, 5)
    }
  })
})

describe('rgbToLab', () => {
  it('white is L≈100, a≈0, b≈0', () => {
    const [L, a, b] = rgbToLab([255, 255, 255])
    expect(L).toBeCloseTo(100, 1)
    expect(a).toBeCloseTo(0, 1)
    expect(b).toBeCloseTo(0, 1)
  })
  it('black is L≈0', () => {
    expect(rgbToLab([0, 0, 0])[0]).toBeCloseTo(0, 1)
  })
})

describe('deltaE2000', () => {
  it('is zero for identical colors', () => {
    const lab = rgbToLab([120, 60, 200])
    expect(deltaE2000(lab, lab)).toBeCloseTo(0, 6)
  })
  it('is larger for more different colors', () => {
    const base = rgbToLab([100, 100, 100])
    const near = deltaE2000(base, rgbToLab([110, 100, 100]))
    const far = deltaE2000(base, rgbToLab([255, 0, 0]))
    expect(far).toBeGreaterThan(near)
  })
})

describe('luminance', () => {
  it('white > gray > black', () => {
    expect(luminance([255, 255, 255])).toBeGreaterThan(luminance([128, 128, 128]))
    expect(luminance([128, 128, 128])).toBeGreaterThan(luminance([0, 0, 0]))
  })
})

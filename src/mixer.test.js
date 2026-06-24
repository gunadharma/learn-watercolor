import { describe, it, expect } from 'vitest'
import { mixReflectance, applyWater, predictMix, findRecipe, classifyQuality } from './mixer.js'
import { rgbToLinear, luminance } from './color.js'

describe('mixReflectance', () => {
  it('mixing two colors darkens (subtractive)', () => {
    const blue = rgbToLinear([40, 60, 200])
    const yellow = rgbToLinear([230, 220, 40])
    const mix = mixReflectance([blue, yellow], [1, 1])
    // Geometric mean is <= arithmetic mean per channel -> darker.
    for (let c = 0; c < 3; c++) {
      expect(mix[c]).toBeLessThanOrEqual((blue[c] + yellow[c]) / 2 + 1e-9)
    }
  })
})

describe('applyWater', () => {
  it('water lightens toward white', () => {
    const dark = [0.1, 0.1, 0.1]
    const diluted = applyWater(dark, 0.5)
    diluted.forEach((c, i) => expect(c).toBeGreaterThan(dark[i]))
  })
  it('water=0 is a no-op', () => {
    expect(applyWater([0.2, 0.3, 0.4], 0)).toEqual([0.2, 0.3, 0.4])
  })
})

describe('predictMix', () => {
  it('a single paint with no water returns roughly itself', () => {
    const out = predictMix([[120, 80, 200]], [1], 0)
    out.forEach((c, i) => expect(Math.abs(c - [120, 80, 200][i])).toBeLessThanOrEqual(2))
  })
  it('more water yields a lighter result', () => {
    const dry = predictMix([[40, 40, 40]], [1], 0)
    const wet = predictMix([[40, 40, 40]], [1], 0.6)
    expect(luminance(wet)).toBeGreaterThan(luminance(dry))
  })
})

describe('classifyQuality', () => {
  it('buckets by deltaE', () => {
    expect(classifyQuality(5)).toBe('good')
    expect(classifyQuality(15)).toBe('fair')
    expect(classifyQuality(40)).toBe('poor')
  })
})

describe('findRecipe', () => {
  const paints = [
    { id: 'a', brand: 'X', name: 'Ultramarine', hex: '#2845a0', rgb: [40, 69, 160] },
    { id: 'b', brand: 'X', name: 'Lemon Yellow', hex: '#e6dc28', rgb: [230, 220, 40] },
    { id: 'c', brand: 'X', name: 'Crimson', hex: '#a01535', rgb: [160, 21, 53] },
  ]
  it('returns null with no paints', () => {
    expect(findRecipe([100, 100, 100], [])).toBeNull()
  })
  it('matches an owned paint nearly exactly', () => {
    const recipe = findRecipe([40, 69, 160], paints)
    expect(recipe.quality).toBe('good')
    expect(recipe.deltaE).toBeLessThan(10)
    expect(recipe.paints[0].paintId).toBe('a')
  })
  it('ratios sum to 100', () => {
    const recipe = findRecipe([120, 120, 90], paints)
    const sum = recipe.paints.reduce((s, p) => s + p.ratio, 0)
    expect(sum).toBe(100)
  })
})

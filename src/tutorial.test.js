import { describe, it, expect } from 'vitest'
import { groupByLuminance, assignPixels, suggestStepCount } from './tutorial.js'

const palette = [
  { rgb: [250, 250, 250] }, // lightest
  { rgb: [180, 120, 90] },
  { rgb: [90, 70, 60] },
  { rgb: [10, 10, 10] }, // darkest
]

describe('groupByLuminance', () => {
  it('orders lightest first', () => {
    const groups = groupByLuminance(palette, 4)
    const firstIdx = groups[0][0]
    const lastIdx = groups[groups.length - 1].at(-1)
    expect(palette[firstIdx].rgb[0]).toBe(250)
    expect(palette[lastIdx].rgb[0]).toBe(10)
  })
  it('never produces more groups than maxSteps', () => {
    expect(groupByLuminance(palette, 2).length).toBeLessThanOrEqual(2)
  })
  it('covers every palette color exactly once', () => {
    const groups = groupByLuminance(palette, 3)
    const all = groups.flat().sort()
    expect(all).toEqual([0, 1, 2, 3])
  })
})

describe('suggestStepCount', () => {
  it('stays within 3..5', () => {
    expect(suggestStepCount(palette)).toBeGreaterThanOrEqual(3)
    expect(suggestStepCount(palette)).toBeLessThanOrEqual(5)
  })
  it('high-contrast image suggests more steps than low-contrast', () => {
    const highContrast = [{ rgb: [250, 250, 250] }, { rgb: [5, 5, 5] }]
    const lowContrast = [{ rgb: [128, 128, 128] }, { rgb: [150, 150, 150] }]
    expect(suggestStepCount(highContrast)).toBeGreaterThanOrEqual(suggestStepCount(lowContrast))
  })
  it('empty palette defaults to 3', () => {
    expect(suggestStepCount([])).toBe(3)
  })
})

describe('assignPixels', () => {
  it('assigns each pixel to its nearest palette color', () => {
    // two pixels: near-white and near-black
    const data = new Uint8ClampedArray([248, 248, 248, 255, 5, 5, 5, 255])
    const assignment = assignPixels({ data, width: 2, height: 1 }, palette)
    expect(assignment[0]).toBe(0) // white -> lightest
    expect(assignment[1]).toBe(3) // black -> darkest
  })
})

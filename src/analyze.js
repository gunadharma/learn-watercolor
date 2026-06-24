// Orchestrates a full analysis: photo -> palette + recipes + tutorial steps.
import { imageToCanvas, getImageData, pixelsFrom, sketchCanvas } from './image.js'
import { quantize } from './quantize.js'
import { findRecipe } from './mixer.js'
import { buildLayerSteps } from './tutorial.js'
import { rgbToHex } from './color.js'

// img: HTMLImageElement, paints: owned paints, paletteSize, maxSteps.
export function analyzeImage(img, paints, { paletteSize = 8, maxSteps = 5 } = {}) {
  const canvas = imageToCanvas(img)
  const imageData = getImageData(canvas)

  // Sample pixels for quantization speed on large images.
  const sampleStep = Math.max(1, Math.round((canvas.width * canvas.height) / 60000))
  const palette = quantize(pixelsFrom(imageData, sampleStep), paletteSize).map((c) => ({
    ...c,
    hex: rgbToHex(c.rgb),
    recipe: findRecipe(c.rgb, withRgb(paints)),
  }))

  const sketchDataUrl = sketchCanvas(imageData).toDataURL('image/png')
  const steps = buildLayerSteps(imageData, palette, maxSteps)

  return {
    imageDataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    palette,
    sketchDataUrl,
    steps,
  }
}

// Attach parsed rgb to each paint for the mixer.
function withRgb(paints) {
  return paints.map((p) => ({ ...p, rgb: hexToRgbSafe(p.hex) })).filter((p) => p.rgb)
}

function hexToRgbSafe(hex) {
  const h = String(hex).replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

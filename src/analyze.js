// Orchestrates a full analysis: photo -> palette + recipes + tutorial steps.
import { imageToCanvas, getImageData, pixelsFrom, sketchCanvas, cutoutCanvas } from './image.js'
import { quantizeAuto } from './quantize.js'
import { findRecipe } from './mixer.js'
import { buildLayerSteps, suggestStepCount } from './tutorial.js'
import { foregroundMask } from './foreground.js'
import { rgbToHex } from './color.js'

// img: HTMLImageElement, paints: owned paints. Palette size and step count are
// derived automatically. Analysis is limited to the subject (background removed).
export function analyzeImage(img, paints) {
  const canvas = imageToCanvas(img)
  const imageData = getImageData(canvas)

  // Isolate the subject so palette/recipes/tutorial ignore the background.
  const mask = foregroundMask(imageData)

  // Sample foreground pixels for quantization speed on large images.
  const sampleStep = Math.max(1, Math.round((canvas.width * canvas.height) / 60000))
  const ownedPaints = withRgb(paints)
  const palette = quantizeAuto(pixelsFrom(imageData, sampleStep, mask)).map((c) => ({
    ...c,
    hex: rgbToHex(c.rgb),
    recipe: findRecipe(c.rgb, ownedPaints),
  }))

  const sketchDataUrl = sketchCanvas(imageData, mask).toDataURL('image/png')
  const steps = buildLayerSteps(imageData, palette, suggestStepCount(palette), mask)

  return {
    imageDataUrl: canvas.toDataURL('image/png'),
    objectDataUrl: cutoutCanvas(imageData, mask).toDataURL('image/png'),
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

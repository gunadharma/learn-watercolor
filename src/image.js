// Browser-side image loading and pixel processing (Canvas API).

export const MAX_DIM = 700

// Load a File into an HTMLImageElement.
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, dll).'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    // Keep the object URL alive — callers reuse img.src for the on-screen preview and
    // revoke it themselves when replacing the image.
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal memuat gambar.'))
    }
    img.src = url
  })
}

// Draw an image onto a fresh canvas, downscaled so the longest side <= maxDim.
export function imageToCanvas(img, maxDim = MAX_DIM) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

export function getImageData(canvas) {
  return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
}

// Extract [r,g,b] pixels, optionally sampling every `step` pixels for speed.
// If `mask` is given, only foreground pixels (mask[pixelIndex] truthy) are kept.
export function pixelsFrom(imageData, step = 1, mask = null) {
  const { data } = imageData
  const out = []
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] < 128) continue // skip transparent
    if (mask && !mask[i >> 2]) continue // skip background
    out.push([data[i], data[i + 1], data[i + 2]])
  }
  return out
}

// Render the original image with the background replaced by paper white.
export function cutoutCanvas(imageData, mask) {
  const { width: w, height: h, data } = imageData
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const out = ctx.createImageData(w, h)
  for (let p = 0; p < w * h; p++) {
    const o = p * 4
    if (!mask || mask[p]) {
      out.data[o] = data[o]
      out.data[o + 1] = data[o + 1]
      out.data[o + 2] = data[o + 2]
    } else {
      out.data[o] = out.data[o + 1] = out.data[o + 2] = 255
    }
    out.data[o + 3] = 255
  }
  ctx.putImageData(out, 0, 0)
  return canvas
}

// Sobel edge magnitude -> a white canvas with dark outlines (the "sketch").
// If `mask` is given, background pixels are left as blank paper.
export function sketchCanvas(imageData, mask = null, threshold = 0.18) {
  const { width: w, height: h, data } = imageData
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    gray[i] = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255
  }
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')
  const odata = octx.createImageData(w, h)
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sx = 0
      let sy = 0
      let k = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.min(w - 1, Math.max(0, x + dx))
          const py = Math.min(h - 1, Math.max(0, y + dy))
          const v = gray[py * w + px]
          sx += v * gx[k]
          sy += v * gy[k]
          k++
        }
      }
      const o = (y * w + x) * 4
      const inBg = mask && !mask[y * w + x]
      const mag = inBg ? 0 : Math.hypot(sx, sy)
      const edge = mag > threshold ? 1 : 0
      // Dark line on white paper, softened by magnitude.
      const tone = edge ? Math.max(40, 255 - Math.min(255, mag * 320)) : 255
      odata.data[o] = tone
      odata.data[o + 1] = tone
      odata.data[o + 2] = tone
      odata.data[o + 3] = 255
    }
  }
  octx.putImageData(odata, 0, 0)
  return out
}

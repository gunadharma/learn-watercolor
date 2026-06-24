// Color conversions and perceptual distance.
// All RGB values here are 0..255 unless noted as "linear" (0..1).

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const num = parseInt(h, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function rgbToHex([r, g, b]) {
  const to2 = (v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')
  return '#' + to2(r) + to2(g) + to2(b)
}

// sRGB channel (0..1) -> linear (0..1)
export function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

// linear (0..1) -> sRGB channel (0..1)
export function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

export function rgbToLinear([r, g, b]) {
  return [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)]
}

export function linearToRgb([r, g, b]) {
  return [
    clamp(Math.round(linearToSrgb(r) * 255), 0, 255),
    clamp(Math.round(linearToSrgb(g) * 255), 0, 255),
    clamp(Math.round(linearToSrgb(b) * 255), 0, 255),
  ]
}

// Relative luminance (0..1) from 0..255 rgb.
export function luminance([r, g, b]) {
  const [lr, lg, lb] = rgbToLinear([r, g, b])
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

const D65 = { Xn: 0.95047, Yn: 1.0, Zn: 1.08883 }

export function rgbToXyz([r, g, b]) {
  const [lr, lg, lb] = rgbToLinear([r, g, b])
  return [
    lr * 0.4124 + lg * 0.3576 + lb * 0.1805,
    lr * 0.2126 + lg * 0.7152 + lb * 0.0722,
    lr * 0.0193 + lg * 0.1192 + lb * 0.9505,
  ]
}

function fLab(t) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
}

export function rgbToLab(rgb) {
  const [x, y, z] = rgbToXyz(rgb)
  const fx = fLab(x / D65.Xn)
  const fy = fLab(y / D65.Yn)
  const fz = fLab(z / D65.Zn)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

// CIEDE2000 color difference between two Lab colors.
export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1
  const [L2, a2, b2] = lab2
  const rad = Math.PI / 180
  const deg = 180 / Math.PI

  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cbar = (C1 + C2) / 2
  const C7 = Math.pow(Cbar, 7)
  const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Math.pow(25, 7))))

  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1)
  const C2p = Math.hypot(a2p, b2)

  const h1p = hueAngle(b1, a1p)
  const h2p = hueAngle(b2, a2p)

  const dLp = L2 - L1
  const dCp = C2p - C1p

  let dhp = 0
  if (C1p * C2p !== 0) {
    let diff = h2p - h1p
    if (diff > 180) diff -= 360
    else if (diff < -180) diff += 360
    dhp = diff
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2)

  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let hbarp = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) {
      hbarp = h1p + h2p < 360 ? hbarp + 360 : hbarp - 360
    }
    hbarp /= 2
  }

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * rad) +
    0.24 * Math.cos(2 * hbarp * rad) +
    0.32 * Math.cos((3 * hbarp + 6) * rad) -
    0.2 * Math.cos((4 * hbarp - 63) * rad)

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2))
  const Cbarp7 = Math.pow(Cbarp, 7)
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)))
  const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2))
  const Sc = 1 + 0.045 * Cbarp
  const Sh = 1 + 0.015 * Cbarp * T
  const Rt = -Math.sin(2 * dTheta * rad) * Rc

  return Math.sqrt(
    Math.pow(dLp / Sl, 2) +
      Math.pow(dCp / Sc, 2) +
      Math.pow(dHp / Sh, 2) +
      Rt * (dCp / Sc) * (dHp / Sh),
  )

  function hueAngle(b, ap) {
    if (ap === 0 && b === 0) return 0
    let h = Math.atan2(b, ap) * deg
    if (h < 0) h += 360
    return h
  }
}

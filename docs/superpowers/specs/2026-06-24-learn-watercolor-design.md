# Learn Watercolor — Design Spec

**Date:** 2026-06-24
**Status:** Approved
**Deploy target:** GitHub Pages at `https://gunadharma.github.io/learn-watercolor/`
**Repo:** https://github.com/gunadharma/learn-watercolor.git

## Goal

A static web app that helps people learn watercolor painting. The user records the
watercolor paints they own, uploads a reference photo, and the app produces (a) a
color palette with mixing recipes built from the user's paints, and (b) a staged,
light-to-dark step-by-step painting tutorial generated from the photo.

All processing runs client-side in the browser (Canvas API). No backend.

## Tech stack

- **Vanilla JS + Vite** (ES modules)
- **Vitest** for unit tests of pure functions
- **localStorage** for persistence (with JSON export/import)
- **GitHub Actions** to build and deploy to GitHub Pages
- Vite `base: '/learn-watercolor/'`

## App structure

Single-page app with four tab sections sharing one central state object:

1. **Cat Air Saya** — manage paint collection
2. **Upload & Analisa** — upload photo, choose palette size, run analysis
3. **Palet & Resep** — extracted palette + mixing recipes
4. **Tutorial Langkah** — staged painting tutorial

### Module breakdown

| Module | Responsibility | Depends on |
|---|---|---|
| `src/state.js` | Central app state + pub/sub, derived from localStorage | storage |
| `src/storage.js` | localStorage read/write, JSON export/import, in-memory fallback | — |
| `src/color.js` | Color conversions (hex/RGB/linear-RGB/XYZ/Lab), ΔE distance | — |
| `src/mixer.js` | Subtractive mixing model + recipe search over user paints | color |
| `src/quantize.js` | Median-cut color quantization + coverage weights | color |
| `src/image.js` | Image load, downscale to canvas, pixel access, Sobel edges | — |
| `src/tutorial.js` | Build light→dark cumulative step layers + per-step masks | color, quantize, image |
| `src/ui/*.js` | One render module per tab, plus shared components | state, the above |
| `src/main.js` | App shell, tab routing, wires modules to UI | all |

Each unit is a focused module with pure-function cores where possible so it can be
tested independently of the DOM.

## Data model

```js
// Paint (user owns this)
{ id: string, brand: string, name: string, hex: string }

// PaletteColor (extracted from photo)
{ hex, rgb: [r,g,b], lab: [L,a,b], weight: number /* 0..1 coverage */, recipe }

// Recipe (how to mix a palette color from owned paints)
{
  paints: [{ paintId, ratio }],   // 1 or 2 entries, ratios sum to 100
  water: number,                  // 0..1 dilution toward paper white
  resultHex: string,              // predicted mixed color
  deltaE: number,                 // accuracy; lower is better
  quality: 'good' | 'fair' | 'poor'
}

// TutorialStep
{
  index: number,
  kind: 'sketch' | 'layer',
  title: string,
  instruction: string,
  imageDataUrl: string,           // cumulative "should look like this"
  maskDataUrl: string,            // highlight of area painted this step
  colors: PaletteColor[]          // palette colors applied this step (with recipes)
}
```

## Color matching engine (`color.js` + `mixer.js`)

- Convert all colors to **CIELAB**; use **CIEDE2000** ΔE for perceptual distance
  (fallback ΔE76 acceptable but CIEDE2000 preferred).
- **Subtractive mixing model:** mix in reflectance space. For paints with linear-RGB
  reflectance values `Ri` and weights `wi` (Σw=1), mixed reflectance per channel =
  weighted geometric mean `Π Ri^wi` (Beer–Lambert approximation → mixes darken
  realistically). Water dilution lerps reflectance toward paper white (1.0) by `water`.
- **Recipe search:** for each target palette color, evaluate:
  - every single paint, across water levels (0, 0.2, 0.4, 0.6);
  - every unordered pair of paints, ratio in steps of 10% (10/90 … 90/10), across the
    same water levels.
  Pick minimum ΔE. Classify quality: `good` ΔE<10, `fair` <25, `poor` otherwise.
  `poor` shows a "hard to reach with your collection" warning.

## Quantization (`quantize.js`)

- Median-cut on downscaled pixels → N palette colors (user picks 6–12, default 8).
- Each palette color carries `weight` = fraction of pixels assigned to it.

## Tutorial generation (`tutorial.js`)

- **Step 0 (sketch):** grayscale → Sobel edge magnitude → threshold → light outline
  on white. Acts as the pencil sketch reference.
- **Layer steps:** sort palette colors by luminance descending (lightest first), group
  into K steps (K ≈ min(palette size, 5)). Assign each pixel to its nearest palette
  color. For step k, render a cumulative image: pixels whose palette color belongs to
  steps 1..k are painted their palette color, the rest left as paper white. Produces the
  light-to-dark buildup.
- Each step also produces a **mask image** highlighting only the pixels newly painted in
  that step, and lists the recipes for the colors applied.
- Every step image is downloadable (canvas → PNG data URL).

## Error handling

- No paints yet when analyzing → block + guide user to "Cat Air Saya".
- Image > max dimension → auto-downscale before processing.
- Non-image file → inline error message.
- localStorage unavailable → in-memory fallback + non-blocking warning banner.

## Testing

Vitest unit tests for pure functions:
- `color.js`: hex↔rgb, rgb↔lab round-trips, ΔE sanity (identical=0, known pairs).
- `mixer.js`: subtractive mix darkens; white+water stays light; recipe search returns
  exact match when target equals an owned paint.
- `quantize.js`: returns requested count; weights sum to ~1.

DOM/UI verified manually.

## Deployment

- `vite.config.js` with `base: '/learn-watercolor/'`.
- `.github/workflows/deploy.yml`: on push to `main`, `npm ci && npm run build`, upload
  `dist/` artifact, deploy via `actions/deploy-pages`.
- `README.md`: local dev, test, build, and one-time GitHub Pages enablement steps.

## Out of scope (YAGNI)

- User accounts / cloud sync.
- Paint opacity/staining/granulation modeling (may revisit later).
- 3+ paint mixes (2 is enough and keeps search fast and recipes practical).
- AI-generated tutorial imagery.

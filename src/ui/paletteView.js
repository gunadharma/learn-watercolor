// "Palet & Resep" — extracted palette colors with mixing recipes.
import { setTab } from '../state.js'
import { escapeHtml, swatch, recipeHtml, emptyState } from './components.js'

export function renderPalette(s) {
  if (!s.analysis) {
    return `<section class="panel">${emptyState(
      '🎨',
      'Belum ada analisa',
      'Unggah dan analisa foto di tab <strong>Upload & Analisa</strong> untuk melihat palet warna dan resep campurannya.',
    )}<div class="center"><button class="btn" data-action="go-analyze">Ke Upload & Analisa</button></div></section>`
  }

  const { palette, imageDataUrl } = s.analysis
  const poor = palette.filter((c) => c.recipe && c.recipe.quality === 'poor').length

  const cards = palette
    .map(
      (c) => `
      <article class="color-card">
        <div class="color-card-head">
          ${swatch(c.hex, 48)}
          <div>
            <strong>${escapeHtml(c.hex)}</strong>
            <span class="muted">${Math.round(c.weight * 100)}% area gambar</span>
          </div>
        </div>
        ${recipeHtml(c.recipe, s.paints)}
      </article>`,
    )
    .join('')

  return `
    <section class="panel">
      <div class="panel-head"><div>
        <h2>Palet & Resep</h2>
        <p class="muted">${palette.length} warna kunci dari fotomu, beserta cara mencampurnya dari koleksimu.</p>
      </div>
      <button class="btn ghost" data-action="go-tutorial">Lihat Tutorial →</button>
      </div>

      <div class="palette-overview">
        <img class="ref-thumb" src="${imageDataUrl}" alt="Foto acuan">
        <div class="palette-strip">
          ${palette.map((c) => `<span class="strip-cell" style="--c:${c.hex}" title="${c.hex}"></span>`).join('')}
        </div>
      </div>

      ${poor > 0 ? `<div class="notice">⚠️ ${poor} warna sulit dicapai dengan koleksi cat saat ini. Pertimbangkan menambah cat baru untuk hasil lebih akurat.</div>` : ''}

      <div class="color-grid">${cards}</div>
    </section>`
}

export function bindPalette(root) {
  root.querySelector('[data-action="go-analyze"]')?.addEventListener('click', () => setTab('analyze'))
  root.querySelector('[data-action="go-tutorial"]')?.addEventListener('click', () => setTab('tutorial'))
}

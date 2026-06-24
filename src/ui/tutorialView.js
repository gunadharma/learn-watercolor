// "Tutorial Langkah" — staged light-to-dark painting guide.
import { setTab } from '../state.js'
import { escapeHtml, swatch, recipeHtml, emptyState } from './components.js'

export function renderTutorial(s) {
  if (!s.analysis) {
    return `<section class="panel">${emptyState(
      '🖌️',
      'Belum ada tutorial',
      'Analisa foto dulu untuk menghasilkan langkah-langkah melukis bertahap.',
    )}<div class="center"><button class="btn" data-action="go-analyze">Ke Upload & Analisa</button></div></section>`
  }

  const { sketchDataUrl, steps, imageDataUrl } = s.analysis

  const sketchCard = `
    <article class="step-card">
      <div class="step-num">0</div>
      <div class="step-body">
        <h3>Sketsa Awal</h3>
        <p>Mulai dengan menjiplak garis besar objek pakai pensil tipis. Gunakan gambar ini sebagai panduan kontur. Jangan tekan terlalu keras agar garis tidak terlihat setelah dicat.</p>
        <div class="step-images">
          <figure><img src="${sketchDataUrl}" alt="Sketsa"><figcaption>Panduan garis</figcaption></figure>
          <figure><img src="${imageDataUrl}" alt="Acuan"><figcaption>Foto acuan</figcaption></figure>
        </div>
        <a class="btn ghost small" href="${sketchDataUrl}" download="langkah-0-sketsa.png">⤓ Unduh sketsa</a>
      </div>
    </article>`

  const stepCards = steps
    .map(
      (step) => `
      <article class="step-card">
        <div class="step-num">${step.index}</div>
        <div class="step-body">
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.instruction)}</p>
          <div class="step-images">
            <figure><img src="${step.imageDataUrl}" alt="Hasil setelah langkah ${step.index}"><figcaption>Setelah langkah ini</figcaption></figure>
            <figure><img src="${step.maskDataUrl}" alt="Area dicat langkah ${step.index}"><figcaption>Area yang dicat sekarang</figcaption></figure>
          </div>
          <div class="step-colors">
            <span class="muted">Warna langkah ini:</span>
            ${step.colors.map((c) => colorChip(c, s.paints)).join('')}
          </div>
          <a class="btn ghost small" href="${step.imageDataUrl}" download="langkah-${step.index}.png">⤓ Unduh gambar langkah ${step.index}</a>
        </div>
      </article>`,
    )
    .join('')

  return `
    <section class="panel">
      <div class="panel-head"><div>
        <h2>Tutorial Langkah</h2>
        <p class="muted">Melukis dari terang ke gelap — teknik dasar cat air. Tunggu tiap layer kering sebelum lanjut.</p>
      </div>
      <button class="btn ghost" data-action="go-palette">← Palet & Resep</button>
      </div>
      <div class="steps">${sketchCard}${stepCards}</div>
    </section>`
}

function colorChip(c, paints) {
  const q = c.recipe ? c.recipe.quality : 'poor'
  return `
    <details class="color-chip">
      <summary>${swatch(c.hex, 22)} ${escapeHtml(c.hex)}</summary>
      ${recipeHtml(c.recipe, paints)}
    </details>`
}

export function bindTutorial(root) {
  root.querySelector('[data-action="go-analyze"]')?.addEventListener('click', () => setTab('analyze'))
  root.querySelector('[data-action="go-palette"]')?.addEventListener('click', () => setTab('palette'))
}

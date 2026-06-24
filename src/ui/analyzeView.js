// "Upload & Analisa" — pick a photo, choose palette size, run the analysis.
import { state, setAnalysis, setAnalyzing, setTab } from '../state.js'
import { loadImageFile } from '../image.js'
import { analyzeImage } from '../analyze.js'
import { emptyState } from './components.js'

let pendingImg = null
let previewUrl = null

export function renderAnalyze(s) {
  if (s.paints.length === 0) {
    return `<section class="panel">${emptyState(
      '🖼️',
      'Tambahkan cat air dulu',
      'Sebelum menganalisa foto, isi koleksi cat air kamu di tab <strong>Cat Air Saya</strong> agar aplikasi tahu warna apa yang bisa dicampur.',
    )}<div class="center"><button class="btn" data-action="go-paints">Ke Cat Air Saya</button></div></section>`
  }

  const preview = previewUrl
    ? `<img class="preview-img" src="${previewUrl}" alt="Pratinjau foto">`
    : `<div class="dropzone-inner"><div class="empty-icon">⬆️</div><p>Klik atau seret foto ke sini</p><span class="muted">JPG, PNG — wajah, pemandangan, masih lifes, apa saja</span></div>`

  return `
    <section class="panel">
      <div class="panel-head"><div>
        <h2>Upload & Analisa</h2>
        <p class="muted">Unggah foto acuan. Aplikasi akan mengekstrak palet warna dan menyusun langkah melukis.</p>
      </div></div>

      <label class="dropzone ${previewUrl ? 'has-img' : ''}">
        <input type="file" accept="image/*" data-action="file" hidden>
        ${preview}
      </label>

      <div class="controls">
        <label class="control">Jumlah warna palet
          <input type="range" min="6" max="12" value="8" data-action="palette-size">
          <output data-out="palette-size">8</output>
        </label>
        <label class="control">Jumlah langkah tutorial
          <input type="range" min="3" max="5" value="4" data-action="max-steps">
          <output data-out="max-steps">4</output>
        </label>
      </div>

      <div class="center">
        <button class="btn primary" data-action="analyze" ${pendingImg && !s.analyzing ? '' : 'disabled'}>
          ${s.analyzing ? 'Menganalisa…' : 'Analisa Foto'}
        </button>
      </div>
      ${s.analyzing ? '<p class="muted center">Memproses gambar & menghitung campuran warna…</p>' : ''}
    </section>`
}

export function bindAnalyze(root, onError) {
  root.querySelector('[data-action="go-paints"]')?.addEventListener('click', () => setTab('paints'))

  const fileInput = root.querySelector('[data-action="file"]')
  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      pendingImg = await loadImageFile(file)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      previewUrl = pendingImg.src
      rerenderLocal(root)
    } catch (err) {
      onError?.(err.message)
    }
  })

  for (const key of ['palette-size', 'max-steps']) {
    const slider = root.querySelector(`[data-action="${key}"]`)
    slider?.addEventListener('input', () => {
      root.querySelector(`[data-out="${key}"]`).textContent = slider.value
    })
  }

  root.querySelector('[data-action="analyze"]')?.addEventListener('click', () => {
    if (!pendingImg) return
    const paletteSize = +root.querySelector('[data-action="palette-size"]').value
    const maxSteps = +root.querySelector('[data-action="max-steps"]').value
    setAnalyzing(true)
    // Defer so the "Menganalisa…" state paints before the heavy synchronous work.
    setTimeout(() => {
      try {
        const analysis = analyzeImage(pendingImg, state.paints, { paletteSize, maxSteps })
        setAnalysis(analysis)
        setTab('palette')
      } catch (err) {
        setAnalyzing(false)
        onError?.(err.message || 'Gagal menganalisa gambar.')
      }
    }, 30)
  })
}

// Light local re-render after picking a file (avoids resetting unrelated state).
function rerenderLocal(root) {
  const enabled = pendingImg && !state.analyzing
  const btn = root.querySelector('[data-action="analyze"]')
  if (btn) btn.disabled = !enabled
  const zone = root.querySelector('.dropzone')
  if (zone && previewUrl) {
    zone.classList.add('has-img')
    zone.querySelector('.dropzone-inner')?.remove()
    if (!zone.querySelector('.preview-img')) {
      const img = document.createElement('img')
      img.className = 'preview-img'
      img.src = previewUrl
      zone.appendChild(img)
    } else {
      zone.querySelector('.preview-img').src = previewUrl
    }
  }
}

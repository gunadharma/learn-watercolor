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

      <p class="muted center auto-note">Jumlah warna palet & langkah tutorial ditentukan otomatis sesuai gambar.</p>

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

  root.querySelector('[data-action="analyze"]')?.addEventListener('click', () => {
    if (!pendingImg) return
    setAnalyzing(true)
    // Defer so the "Menganalisa…" state paints before the heavy synchronous work.
    setTimeout(() => {
      try {
        const analysis = analyzeImage(pendingImg, state.paints)
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

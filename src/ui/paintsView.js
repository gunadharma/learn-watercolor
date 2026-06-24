// "Cat Air Saya" — manage the watercolor collection.
import { addPaint, removePaint, setPaints, state } from '../state.js'
import { exportPaints, parseImported } from '../storage.js'
import { escapeHtml, swatch, emptyState } from './components.js'

export function renderPaints(s) {
  const list = s.paints.length
    ? `<ul class="paint-list">${s.paints.map(paintRow).join('')}</ul>`
    : emptyState('🎨', 'Belum ada cat air', 'Tambahkan cat air yang kamu punya di bawah ini. Data tersimpan di browsermu.')

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Cat Air Saya</h2>
          <p class="muted">Daftar cat air yang kamu miliki. Aplikasi memakai ini untuk menghitung campuran warna.</p>
        </div>
        <div class="head-actions">
          <button class="btn ghost" data-action="export" ${s.paints.length ? '' : 'disabled'}>Export</button>
          <label class="btn ghost">Import<input type="file" accept="application/json" data-action="import" hidden></label>
        </div>
      </div>

      <form class="paint-form" data-action="add-paint">
        <input name="brand" placeholder="Merk (mis. Winsor & Newton)" maxlength="60" autocomplete="off">
        <input name="name" placeholder="Nama warna (mis. Ultramarine)" maxlength="60" autocomplete="off" required>
        <input name="hex" type="color" value="#3a6ea5" title="Pilih warna">
        <button class="btn" type="submit">+ Tambah</button>
      </form>

      ${list}
      <p class="count muted">${s.paints.length} cat air tersimpan.</p>
    </section>`
}

function paintRow(p) {
  return `
    <li class="paint-row">
      ${swatch(p.hex, 36)}
      <div class="paint-info">
        <strong>${escapeHtml(p.name)}</strong>
        <span class="muted">${escapeHtml(p.brand || '—')} · ${escapeHtml(p.hex)}</span>
      </div>
      <button class="icon-btn" title="Hapus" data-action="remove" data-id="${p.id}">✕</button>
    </li>`
}

export function bindPaints(root, onError) {
  root.querySelector('[data-action="add-paint"]')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = e.currentTarget
    const name = f.name.value.trim()
    if (!name) return
    addPaint({ brand: f.brand.value, name, hex: f.hex.value })
    f.reset()
    f.hex.value = '#3a6ea5'
  })

  root.querySelectorAll('[data-action="remove"]').forEach((b) =>
    b.addEventListener('click', () => removePaint(b.dataset.id)),
  )

  root.querySelector('[data-action="export"]')?.addEventListener('click', () => exportPaints(state.paints))

  root.querySelector('[data-action="import"]')?.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const imported = parseImported(text)
      if (!imported.length) throw new Error('Tidak ada cat valid dalam file.')
      // Merge, avoiding duplicate ids.
      const existing = new Set(state.paints.map((p) => p.id))
      setPaints([...state.paints, ...imported.filter((p) => !existing.has(p.id))])
    } catch (err) {
      onError?.(err.message || 'Gagal mengimpor file.')
    }
    e.target.value = ''
  })
}

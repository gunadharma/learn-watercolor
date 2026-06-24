import './styles.css'
import { state, subscribe, setTab } from './state.js'
import { storageAvailable } from './storage.js'
import { renderPaints, bindPaints } from './ui/paintsView.js'
import { renderAnalyze, bindAnalyze } from './ui/analyzeView.js'
import { renderPalette, bindPalette } from './ui/paletteView.js'
import { renderTutorial, bindTutorial } from './ui/tutorialView.js'

const TABS = [
  { id: 'paints', label: 'Cat Air Saya', icon: '🎨' },
  { id: 'analyze', label: 'Upload & Analisa', icon: '🖼️' },
  { id: 'palette', label: 'Palet & Resep', icon: '🧪' },
  { id: 'tutorial', label: 'Tutorial Langkah', icon: '🖌️' },
]

const VIEWS = {
  paints: { render: renderPaints, bind: bindPaints },
  analyze: { render: renderAnalyze, bind: bindAnalyze },
  palette: { render: renderPalette, bind: bindPalette },
  tutorial: { render: renderTutorial, bind: bindTutorial },
}

const app = document.getElementById('app')
let errorMsg = ''

function showError(msg) {
  errorMsg = msg
  render(state)
  if (msg) setTimeout(() => { if (errorMsg === msg) { errorMsg = ''; render(state) } }, 5000)
}

function render(s) {
  const view = VIEWS[s.activeTab]

  app.innerHTML = `
    <header class="app-header">
      <div class="brand">
        <span class="logo">💧</span>
        <div><h1>Learn Watercolor</h1><p class="tagline">Belajar melukis cat air, langkah demi langkah</p></div>
      </div>
    </header>

    <nav class="tabs">
      ${TABS.map((t) => `
        <button class="tab ${s.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
          <span class="tab-icon">${t.icon}</span>${t.label}
        </button>`).join('')}
    </nav>

    ${!storageAvailable() ? '<div class="notice">⚠️ Penyimpanan browser tidak aktif — koleksi cat tidak akan tersimpan setelah ditutup.</div>' : ''}
    ${errorMsg ? `<div class="notice error">${errorMsg}</div>` : ''}

    <main class="content">${view.render(s)}</main>

    <footer class="app-footer">
      <p>Dibuat untuk belajar. Semua proses berjalan di browsermu — tidak ada data yang dikirim ke server.</p>
    </footer>`

  app.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => setTab(b.dataset.tab)),
  )
  const content = app.querySelector('.content')
  view.bind(content, showError)
}

subscribe(render)
render(state)

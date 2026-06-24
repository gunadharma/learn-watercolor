// Small shared UI helpers (no framework).

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

export function swatch(hex, size = 28) {
  return `<span class="swatch" style="--c:${escapeHtml(hex)};width:${size}px;height:${size}px"></span>`
}

const QUALITY_LABEL = {
  good: { text: 'Akurat', cls: 'good' },
  fair: { text: 'Cukup mirip', cls: 'fair' },
  poor: { text: 'Sulit dicapai', cls: 'poor' },
}

// Render a mixing recipe into HTML. `paints` is the full collection (to resolve names).
export function recipeHtml(recipe, paints) {
  if (!recipe) {
    return `<p class="muted">Belum bisa dihitung — tambahkan cat air dulu.</p>`
  }
  const byId = Object.fromEntries(paints.map((p) => [p.id, p]))
  const parts = recipe.paints
    .map((rp) => {
      const p = byId[rp.paintId]
      const label = p ? `${escapeHtml(p.name)}${p.brand ? ` <span class="muted">(${escapeHtml(p.brand)})</span>` : ''}` : 'Cat'
      return `<li>${swatch(p ? p.hex : '#ccc', 18)} <strong>${rp.ratio}%</strong> ${label}</li>`
    })
    .join('')
  const water = recipe.water > 0
    ? `<li class="water">💧 Encerkan dengan air (${Math.round(recipe.water * 100)}%)</li>`
    : `<li class="water">Pigmen pekat, sedikit air.</li>`
  const q = QUALITY_LABEL[recipe.quality]
  return `
    <div class="recipe">
      <ul class="recipe-parts">${parts}${water}</ul>
      <div class="recipe-meta">
        <span class="result-swatch">Hasil ${swatch(recipe.resultHex, 22)}</span>
        <span class="badge ${q.cls}">${q.text} (ΔE ${recipe.deltaE.toFixed(1)})</span>
      </div>
    </div>`
}

export function emptyState(icon, title, body) {
  return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${body}</p></div>`
}

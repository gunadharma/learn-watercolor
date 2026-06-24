# 💧 Learn Watercolor

Aplikasi web untuk **belajar melukis cat air**. Catat cat air yang kamu punya, unggah
foto yang ingin dilukis, lalu aplikasi akan:

1. **Mengekstrak palet warna** dari foto — jumlah warna ditentukan otomatis sesuai
   kompleksitas gambar.
2. **Menghitung resep campuran** — kombinasi 1–2 cat air milikmu (lengkap dengan rasio
   dan tingkat pengenceran air) untuk mencapai tiap warna.
3. **Menyusun tutorial melukis bertahap** dari terang ke gelap (jumlah langkah otomatis
   dari rentang tonal gambar), dengan gambar acuan dan highlight area di setiap langkah.

Cat air dicatat dengan memilih dari **grid swatch pigmen** cat air umum, bukan color
picker bebas — agar warna tetap realistis.

Semua proses berjalan **di browser** — tidak ada server, tidak ada data yang dikirim
ke mana pun. Koleksi cat tersimpan di `localStorage` dan bisa di-export/import sebagai JSON.

🔗 **Live demo:** https://gunadharma.github.io/learn-watercolor/

## Cara kerja

| Fitur | Teknik |
|---|---|
| Palet warna | Kuantisasi median-cut di ruang **CIELAB** (perseptual) + merge warna mirip (ΔE) + ukuran palet otomatis |
| Jumlah langkah | Otomatis dari rentang tonal palet (3–5 layer) |
| Pencocokan warna | Jarak persepsi CIEDE2000 di ruang warna CIELAB |
| Pencampuran cat | Model subtraktif (weighted geometric mean reflektansi, ala Beer–Lambert) + pengenceran air |
| Tutorial bertahap | Layer kumulatif terang→gelap + deteksi tepi Sobel untuk sketsa |

## Pengembangan lokal

Butuh Node.js 20+.

```bash
npm install      # pasang dependensi
npm run dev      # jalankan dev server (http://localhost:5173)
npm test         # jalankan unit test (Vitest)
npm run build    # build produksi ke dist/
npm run preview  # pratinjau hasil build
```

## Deploy ke GitHub Pages

Sudah ada workflow otomatis di `.github/workflows/deploy.yml`. Sekali setup:

1. Push repo ini ke `https://github.com/gunadharma/learn-watercolor.git` (branch `main`).
2. Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Setiap push ke `main` akan otomatis menjalankan test, build, dan deploy.

Vite dikonfigurasi dengan `base: '/learn-watercolor/'` saat build agar aset termuat
benar di URL GitHub Pages.

## Struktur

```
src/
  color.js        konversi warna + CIEDE2000
  mixer.js        model pencampuran subtraktif + pencarian resep
  quantize.js     kuantisasi warna perseptual + ukuran palet otomatis
  pigments.js     daftar warna pigmen cat air umum (grid swatch)
  image.js        muat & proses gambar (canvas, Sobel)
  tutorial.js     bangun langkah melukis bertahap
  analyze.js      orkestrasi: foto -> palet + resep + tutorial
  storage.js      localStorage + export/import
  state.js        state aplikasi + pub/sub
  main.js         shell aplikasi & routing tab
  ui/             tampilan tiap tab
docs/superpowers/specs/   dokumen desain
```

## Lisensi

MIT

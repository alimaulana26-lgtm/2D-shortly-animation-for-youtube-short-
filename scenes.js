/* ==========================================================
   SHORTLY - scenes.js (Tahap 4b: ekspresi disesuaikan dengan narasi)
   Naskah dan urutan adegan. Untuk video baru, cukup ubah file ini.

   Isi setiap adegan (yang bertanda * boleh dikosongkan):
   - teks      : subtitle di bawah layar
   - ucapan    : isi gelembung ucapan (null = tanpa gelembung).
                 Saat ada ucapan, karakter bergerak naik-turun halus seperti berbicara.
   - posisi *  : tempat karakter berdiri, 0 (kiri) - 100 (kanan)
   - jalanMs * : lama karakter berjalan ke posisi itu (milidetik)
   - durasi    : lama adegan (milidetik, 1000 = 1 detik)
   - pose *    : 'berdiri' | 'berjalan' | 'menunjuk' | 'menjelaskan' | 'bereaksi'
                 (saat berpindah tempat, pose otomatis 'berjalan')
   - ekspresi *: 'senang' | 'terkejut' | 'bingung' | 'berpikir' | 'serius'
   - kamera *  : 'lebar' | 'karakter' | 'wajah' | 'kartu' | 'toko'
                 atau { fokus:'kartu', zoom:1.7, ms:1000, ease:'linear' }
                 atau titik bebas { fokus:[60, 50], zoom:1.2 }
   - posisi di kiri/kanan: sprite berjalan menghadap KANAN. Berjalan ke kiri otomatis dicerminkan.
   - transisi *: 'masuk' | 'fade' | 'kilat' | 'keluar'  (boleh beberapa: ['fade','keluar'])
   - kartu *   : { label:'...', harga:'...', aksi:'pop' | 'sorot' | 'goyang' }
   - toko *    : 'sorot'

   ATURAN EKSPRESI (penting):
   Wajah pada gambar pose di lembar karakter itu tetap, jadi ekspresi harus cocok:
     berdiri      -> serius / netral
     berjalan     -> netral / senang
     menunjuk     -> senang
     menjelaskan  -> berpikir / serius / bingung
     bereaksi     -> senang
   'terkejut' dan 'bingung' hanya punya wajah close-up, jadi pakai kamera 'wajah'.
   Kalau ekspresi tidak cocok dengan pose, script.js memperbaikinya otomatis
   (ganti pose, atau pindah ke close-up) dan menulis peringatan di console browser.
   ========================================================== */
window.SHORTLY_NASKAH = {
  teksAwal: 'Kenapa harga barang bisa berbeda?',
  posisiAwal: 18,   // karakter masuk dari kiri lalu berjalan ke KANAN (sprite berjalan menghadap kanan)

  adegan: [
    // 1. Masuk sambil penasaran dengan pertanyaan di awal
    { teks: 'Kenapa harga barang bisa berbeda?', ucapan: null,
      posisi: 38, jalanMs: 1400, durasi: 1800,
      pose: 'menjelaskan', ekspresi: 'berpikir', transisi: 'masuk', kamera: 'lebar' },

    // 2. Harga Rp4.000 murah -> SENANG (melompat kecil)
    { teks: 'Kenapa harga barang bisa berbeda?', ucapan: 'Wah, murah juga!',
      posisi: 38, durasi: 2200, pose: 'bereaksi', ekspresi: 'senang',
      kamera: { fokus: [55, 50], zoom: 1.12, ms: 2200, ease: 'linear' },   // dorong pelan, kartu harga tetap utuh
      kartu: { aksi: 'pop' } },

    // 3. Menunjuk kartu harga -> SENANG
    { teks: 'Air mineral di toko ini cuma Rp4.000.', ucapan: null,
      posisi: 38, durasi: 2400, pose: 'menunjuk', ekspresi: 'senang',
      kamera: { fokus: [60, 50], zoom: 1.2, ms: 1000 },
      kartu: { aksi: 'sorot' } },

    // 4. Harga berubah jadi Rp8.000, karakter masih tenang (belum sadar)
    { teks: 'Di tempat lain, harganya bisa lebih tinggi.', ucapan: null,
      posisi: 38, durasi: 1500, pose: 'berdiri', ekspresi: 'serius',
      transisi: 'fade', kamera: { fokus: 'lebar', ms: 900 },
      kartu: { label: 'HARGA DI TEMPAT LAIN', harga: 'Rp8.000', aksi: 'goyang' } },

    // 5. "Lho, kok mahal?" -> TERKEJUT (close-up)
    { teks: 'Di tempat lain, harganya bisa lebih tinggi.', ucapan: 'Lho, kok mahal?',
      posisi: 38, durasi: 2100, ekspresi: 'terkejut',
      transisi: 'kilat', kamera: 'wajah' },

    // 6. Masih heran -> BINGUNG (close-up)
    { teks: 'Kenapa selisihnya bisa sejauh itu?', ucapan: null,
      posisi: 38, durasi: 1900, ekspresi: 'bingung', kamera: 'wajah' },

    // 7. Mulai mencari tahu -> BERPIKIR
    { teks: 'Hmm... pasti ada alasannya.', ucapan: null,
      posisi: 38, durasi: 1800, pose: 'menjelaskan', ekspresi: 'berpikir',
      transisi: 'fade', kamera: { fokus: 'karakter', zoom: 1.35, ms: 1000 } },

    // 8. Menjelaskan -> SERIUS
    { teks: 'Lokasi, biaya, dan kemudahan memengaruhi harga.', ucapan: 'Ada alasannya!',
      posisi: 38, durasi: 3000, pose: 'menjelaskan', ekspresi: 'serius',
      kamera: { fokus: [55, 52], zoom: 1.12, ms: 1200 }, toko: 'sorot' },

    // 9. Kesimpulan -> SERIUS (close-up)
    { teks: 'Jadi, harga bukan sekadar angka.', ucapan: null,
      posisi: 38, durasi: 2000, ekspresi: 'serius',
      transisi: 'kilat', kamera: 'wajah' },

    // 10. Penutup -> SENANG (berjalan lalu melompat kecil)
    { teks: 'Itulah kenapa harga bisa berbeda.', ucapan: 'Sampai jumpa!',
      posisi: 66, jalanMs: 1200, durasi: 3000, pose: 'bereaksi', ekspresi: 'senang',
      transisi: ['fade', 'keluar'], kamera: { fokus: 'lebar', ms: 1200 } }
  ]
};

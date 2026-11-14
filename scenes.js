/* ==========================================================
   SHORTLY - scenes.js
   Cerita: Doorway Effect (kenapa kita lupa saat masuk ruangan)
   Untuk video baru, narasi dan urutan adegan dapat diubah dari file ini.
   ========================================================== */
window.SHORTLY_NASKAH = {
  teksAwal: 'Pernah masuk ruangan lalu lupa mau ngapain?',
  posisiAwal: 18,
  adegan: [
    { teks: 'Pernah masuk ke sebuah ruangan…', ucapan: null,
      posisi: 38, jalanMs: 1400, durasi: 4200,
      pose: 'menjelaskan', ekspresi: 'berpikir', transisi: 'masuk', kamera: 'lebar' },

    { teks: '…tapi tiba-tiba lupa mau ngapain?', ucapan: 'Eh, tadi mau apa, ya?',
      posisi: 38, durasi: 4300, pose: 'bereaksi', ekspresi: 'senang',
      kamera: { fokus: [55, 50], zoom: 1.08, ms: 1800 } },

    { teks: 'Padahal, beberapa detik sebelumnya masih ingat!', ucapan: null,
      posisi: 38, durasi: 4300, pose: 'menunjuk', ekspresi: 'senang',
      kamera: { fokus: [58, 48], zoom: 1.13, ms: 1200 },
      kartu: { label: 'BARU SAJA TERINGAT', harga: 'LUPA?', aksi: 'pop' } },

    { teks: 'Tenang, ini bukan berarti otakmu rusak.', ucapan: 'Tenang dulu!',
      posisi: 38, durasi: 4200, pose: 'menjelaskan', ekspresi: 'serius',
      transisi: 'fade', kamera: { fokus: 'lebar', ms: 900 },
      kartu: { label: 'INI FENOMENA UMUM', harga: 'NORMAL', aksi: 'sorot' } },

    { teks: 'Fenomena ini dikenal sebagai Doorway Effect.', ucapan: null,
      posisi: 38, durasi: 4500, pose: 'menjelaskan', ekspresi: 'serius',
      kamera: { fokus: [55, 48], zoom: 1.12, ms: 1100 }, toko: 'sorot',
      kartu: { label: 'NAMA FENOMENA', harga: 'DOORWAY EFFECT', aksi: 'pop' } },

    { teks: 'Otak membagi pengalaman menjadi beberapa peristiwa.', ucapan: null,
      posisi: 38, durasi: 4700, ekspresi: 'bingung', kamera: 'wajah',
      transisi: 'kilat' },

    { teks: 'Saat melewati pintu, otak bisa menganggapnya peristiwa baru.', ucapan: 'Seperti pindah bab!',
      posisi: 38, durasi: 5000, pose: 'menjelaskan', ekspresi: 'berpikir',
      transisi: 'fade', kamera: { fokus: 'karakter', zoom: 1.22, ms: 1000 }, toko: 'sorot',
      kartu: { label: 'OTAK MEMBUAT BATAS', harga: 'PERISTIWA BARU', aksi: 'sorot' } },

    { teks: 'Akibatnya, informasi sebelumnya lebih sulit diingat.', ucapan: null,
      posisi: 38, durasi: 4700, ekspresi: 'terkejut', kamera: 'wajah',
      transisi: 'kilat' },

    { teks: 'Gangguan dan pengalih perhatian bisa membuatnya makin mudah terjadi.', ucapan: null,
      posisi: 38, durasi: 5000, pose: 'menjelaskan', ekspresi: 'serius',
      kamera: { fokus: [55, 50], zoom: 1.08, ms: 1200 },
      kartu: { label: 'TIPS SINGKAT', harga: 'FOKUS DULU', aksi: 'sorot' } },

    { teks: 'Jadi, jangan langsung menyalahkan ingatanmu. Pintu bisa bikin kita bingung!', ucapan: 'Sampai jumpa!',
      posisi: 66, jalanMs: 1200, durasi: 5000, pose: 'bereaksi', ekspresi: 'senang',
      transisi: ['fade', 'keluar'], kamera: { fokus: 'lebar', ms: 1200 } }
  ]
};

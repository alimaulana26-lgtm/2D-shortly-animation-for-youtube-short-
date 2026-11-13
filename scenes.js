/* ==========================================================
   SHORTLY - scenes.js (Tahap 4)
   Naskah dan urutan adegan. Untuk video baru, cukup ubah file ini.

   Isi setiap adegan (yang bertanda * boleh dikosongkan):
   - teks      : subtitle di bawah layar
   - ucapan    : isi gelembung ucapan (null = tanpa gelembung)
   - posisi *  : tempat karakter berdiri, 0 (kiri) - 100 (kanan)
   - jalanMs * : lama karakter berjalan ke posisi itu (milidetik)
   - durasi    : lama adegan (milidetik, 1000 = 1 detik)

   BARU di Tahap 4:
   - pose *     : 'berdiri' | 'berjalan' | 'menunjuk' | 'menjelaskan' | 'bereaksi'
                  (saat karakter berpindah tempat, pose otomatis 'berjalan')
   - ekspresi * : 'senang' | 'terkejut' | 'bingung' | 'berpikir' | 'serius'
                  (muncul sebagai ikon di dekat kepala; kalau kamera 'wajah',
                   muncul sebagai gambar wajah close-up)
   - kamera *   : 'lebar' | 'karakter' | 'wajah' | 'kartu' | 'toko'
                  atau { fokus:'kartu', zoom:1.7, ms:1000, ease:'linear' }
                  atau titik bebas { fokus:[60, 50], zoom:1.2 } (kiri-kanan, atas-bawah, 0-100)
                  (zoom = pembesaran, ms = lama kamera bergerak)
   - transisi * : 'masuk' (muncul dari hitam) | 'fade' (redup lalu terang)
                  | 'kilat' (kilatan biru) | 'keluar' (meredup di akhir)
   - kartu *    : { label:'...', harga:'...', aksi:'pop' | 'sorot' | 'goyang' }
   - toko *     : 'sorot' (minuman di jendela melompat)
   ========================================================== */
window.SHORTLY_NASKAH = {
  teksAwal: 'Kenapa harga barang bisa berbeda?',
  posisiAwal: 48,

  adegan: [
    { teks: 'Kenapa harga barang bisa berbeda?', ucapan: null,
      posisi: 38, jalanMs: 1400, durasi: 1800,
      ekspresi: 'senang', transisi: 'masuk', kamera: 'lebar' },

    { teks: 'Kenapa harga barang bisa berbeda?', ucapan: 'Wah, murah juga!',
      posisi: 38, durasi: 2200, pose: 'berdiri', ekspresi: 'senang',
      kamera: { fokus: 'karakter', zoom: 1.2, ms: 2200, ease: 'linear' },
      kartu: { aksi: 'pop' } },

    { teks: 'Air mineral di toko ini cuma Rp4.000.', ucapan: null,
      posisi: 38, durasi: 2400, pose: 'menunjuk', ekspresi: 'senang',
      kamera: { fokus: [60, 50], zoom: 1.2, ms: 1000 },   // karakter menunjuk + kartu harga terlihat bersama
      kartu: { aksi: 'sorot' } },

    { teks: 'Di tempat lain, harganya bisa lebih tinggi.', ucapan: 'Lho, kok mahal?',
      posisi: 38, durasi: 2400, pose: 'bereaksi', ekspresi: 'terkejut',
      transisi: 'fade', kamera: { fokus: 'lebar', ms: 900 },
      kartu: { label: 'HARGA DI TEMPAT LAIN', harga: 'Rp8.000', aksi: 'goyang' } },

    { teks: 'Kenapa selisihnya bisa sejauh itu?', ucapan: null,
      posisi: 38, durasi: 1900, ekspresi: 'bingung',
      transisi: 'kilat', kamera: 'wajah' },

    { teks: 'Hmm... pasti ada alasannya.', ucapan: null,
      posisi: 38, durasi: 1800, pose: 'menjelaskan', ekspresi: 'berpikir',
      transisi: 'fade', kamera: { fokus: 'karakter', zoom: 1.35, ms: 1000 } },

    { teks: 'Lokasi, biaya, dan kemudahan memengaruhi harga.', ucapan: 'Ada alasannya!',
      posisi: 66, jalanMs: 1200, durasi: 3200, pose: 'menjelaskan', ekspresi: 'senang',
      transisi: 'fade', kamera: { fokus: 'karakter', zoom: 1.15, ms: 1200 },
      toko: 'sorot' },

    { teks: 'Jadi, harga bukan sekadar angka.', ucapan: null,
      posisi: 66, durasi: 2000, ekspresi: 'serius',
      transisi: 'kilat', kamera: 'wajah' },

    { teks: 'Itulah kenapa harga bisa berbeda.', ucapan: 'Sampai jumpa!',
      posisi: 66, durasi: 2600, pose: 'berdiri', ekspresi: 'senang',
      transisi: 'keluar', kamera: { fokus: 'lebar', ms: 1200 } }
  ]
};

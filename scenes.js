/* ==========================================================
   SHORTLY - scenes.js
   Di sini tempat NASKAH dan URUTAN ADEGAN.
   Untuk membuat video baru, cukup ubah isi file ini
   (tidak perlu menyentuh script.js).

   Arti setiap baris adegan:
   - teks     : subtitle di bagian bawah layar
   - ucapan   : isi gelembung ucapan karakter (null = gelembung disembunyikan)
   - posisi   : tempat berdiri karakter, 0 (kiri) sampai 100 (kanan)
   - jalanMs  : lama karakter berjalan ke posisi itu, dalam milidetik (1000 = 1 detik)
   - durasi   : lama adegan ini tampil, dalam milidetik
   ========================================================== */
window.SHORTLY_NASKAH = {
  teksAwal: 'Kenapa harga barang bisa berbeda?', // subtitle saat tombol Ulangi ditekan
  posisiAwal: 48,                                // posisi karakter saat mulai

  adegan: [
    { teks: 'Kenapa harga barang bisa berbeda?',
      ucapan: null,
      posisi: 38, jalanMs: 800, durasi: 800 },

    { teks: 'Kenapa harga barang bisa berbeda?',
      ucapan: 'Wah, murah juga!',
      posisi: 38, durasi: 1800 },

    { teks: 'Di tempat lain, harganya bisa lebih tinggi.',
      ucapan: 'Lho, kok mahal?',
      posisi: 38, durasi: 1600 },

    { teks: 'Di tempat lain, harganya bisa lebih tinggi.',
      ucapan: null,
      posisi: 66, jalanMs: 1200, durasi: 1200 },

    { teks: 'Lokasi, biaya, dan kemudahan memengaruhi harga.',
      ucapan: 'Ada alasannya!',
      posisi: 66, durasi: 3100 },

    { teks: 'Lokasi, biaya, dan kemudahan memengaruhi harga.',
      ucapan: null,
      posisi: 66, durasi: 500 }
  ]
};

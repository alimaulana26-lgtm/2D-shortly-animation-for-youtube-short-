/* ==========================================================
   SHORTLY - scenes.js
   Cerita: Kenapa barang yang sama bisa punya harga berbeda?
   Versi: Variasi Pose Karakter
   ========================================================== */

window.SHORTLY_NASKAH = {
  teksAwal: 'Pernah lihat barang yang sama, tapi harganya berbeda?',
  posisiAwal: 38,

  adegan: [

    // ADEGAN 1 - PEMBUKAAN
    {
      teks: 'Pernah lihat barang yang sama…',
      ucapan: null,
      posisi: 38,
      durasi: 3900,
      pose: 'berdiri',
      ekspresi: 'berpikir',
      transisi: 'masuk',
      kamera: 'lebar'
    },

    // ADEGAN 2 - PERTANYAAN
    {
      teks: '…dijual dengan harga yang berbeda di dua toko?',
      ucapan: 'Kok bisa beda, ya?',
      posisi: 38,
      durasi: 4300,
      pose: 'menjelaskan',
      ekspresi: 'berpikir',
      kamera: {
        fokus: [55, 50],
        zoom: 1.08,
        ms: 1200
      },
      kartu: {
        label: 'TOKO A',
        harga: 'Rp15.000',
        aksi: 'pop'
      }
    },

    // ADEGAN 3 - PRODUK SAMA
    {
      teks: 'Padahal, merek dan produknya sama!',
      ucapan: null,
      posisi: 38,
      durasi: 4100,
      pose: 'berdiri',
      ekspresi: 'senang',
      kamera: {
        fokus: [58, 48],
        zoom: 1.12,
        ms: 1100
      },
      kartu: {
        label: 'TOKO B',
        harga: 'Rp20.000',
        aksi: 'sorot'
      }
    },

    // ADEGAN 4 - BIAYA OPERASIONAL
    {
      teks: 'Salah satu penyebabnya adalah biaya operasional toko.',
      ucapan: 'Ada alasannya!',
      posisi: 38,
      durasi: 4700,
      pose: 'menunjuk',
      ekspresi: 'serius',
      transisi: 'fade',
      kamera: {
        fokus: 'lebar',
        ms: 900
      },
      kartu: {
        label: 'BIAYA TOKO',
        harga: 'SEWA + LISTRIK',
        aksi: 'sorot'
      }
    },

    // ADEGAN 5 - LOKASI TOKO
    {
      teks: 'Toko di lokasi strategis biasanya punya biaya sewa lebih tinggi.',
      ucapan: null,
      posisi: 38,
      durasi: 4700,
      pose: 'berdiri',
      ekspresi: 'serius',
      kamera: {
        fokus: [55, 48],
        zoom: 1.1,
        ms: 1100
      },
      toko: 'sorot',
      kartu: {
        label: 'LOKASI STRATEGIS',
        harga: 'SEWA LEBIH TINGGI',
        aksi: 'pop'
      }
    },

    // ADEGAN 6 - JUMLAH STOK
    {
      teks: 'Jumlah stok dan cara toko mengambil barang juga berpengaruh.',
      ucapan: null,
      posisi: 38,
      durasi: 4700,
      pose: 'menunjuk',
      ekspresi: 'serius',
      kamera: {
        fokus: 'karakter',
        zoom: 1.12,
        ms: 1000
      },
      kartu: {
        label: 'JUMLAH STOK',
        harga: 'BISA BERPENGARUH',
        aksi: 'sorot'
      }
    },

    // ADEGAN 7 - PROMO DAN DISKON
    {
      teks: 'Ada juga promo, diskon, dan strategi masing-masing penjual.',
      ucapan: 'Perhatikan promonya!',
      posisi: 38,
      durasi: 4500,
      pose: 'menunjuk',
      ekspresi: 'senang',
      transisi: 'fade',
      kamera: {
        fokus: [55, 48],
        zoom: 1.1,
        ms: 1000
      },
      kartu: {
        label: 'PROMO TOKO',
        harga: 'DISKON!',
        aksi: 'pop'
      }
    },

    // ADEGAN 8 - KESIMPULAN
    {
      teks: 'Jadi, harga berbeda bukan selalu berarti kualitasnya berbeda.',
      ucapan: null,
      posisi: 38,
      durasi: 4700,
      pose: 'berdiri',
      ekspresi: 'serius',
      kamera: {
        fokus: 'wajah',
        ms: 1000
      },
      transisi: 'kilat'
    },

    // ADEGAN 9 - TIPS BELANJA
    {
      teks: 'Sebelum membeli, bandingkan harga dan cek kualitasnya.',
      ucapan: 'Jangan buru-buru membeli!',
      posisi: 38,
      durasi: 4700,
      pose: 'menunjuk',
      ekspresi: 'berpikir',
      kamera: {
        fokus: [55, 50],
        zoom: 1.08,
        ms: 1100
      },
      kartu: {
        label: 'TIPS BELANJA',
        harga: 'BANDINGKAN DULU',
        aksi: 'sorot'
      }
    },

    // ADEGAN 10 - PENUTUP
    {
      teks: 'Dengan begitu, kamu bisa memilih barang yang paling sesuai. Sampai jumpa!',
      ucapan: 'Sampai jumpa!',
      posisi: 66,
      jalanMs: 1200,
      durasi: 4800,
      pose: 'berjalan',
      ekspresi: 'senang',
      transisi: ['fade', 'keluar'],
      kamera: {
        fokus: 'lebar',
        ms: 1200
      }
    }

  ]
};

/* ==========================================================
SHORTLY - scenes.js
Cerita: Kenapa Barang yang Sama Bisa Berbeda Harga?
Versi alur baru: 8 adegan
========================================================== */

window.SHORTLY_NASKAH = {
teksAwal: 'Kenapa barang yang sama bisa berbeda harga?',
posisiAwal: 18,

adegan: [

// 1. HOOK - Dua toko, dua harga berbeda
{
  teks: 'Pernah melihat barang yang sama dijual dengan harga berbeda?',
  ucapan: 'Kok bisa berbeda?',
  posisi: 38,
  jalanMs: 1400,
  durasi: 4500,
  pose: 'menjelaskan',
  ekspresi: 'berpikir',
  transisi: 'masuk',
  kamera: 'lebar'
},

// 2. HARGA TOKO PERTAMA
{
  teks: 'Di toko pertama, harganya hanya Rp15.000.',
  ucapan: 'Cuma lima belas ribu!',
  posisi: 38,
  durasi: 4500,
  pose: 'bereaksi',
  ekspresi: 'senang',
  kamera: {
    fokus: 'kartu',
    zoom: 1.2,
    ms: 1000
  },
  kartu: {
    label: 'TOKO PERTAMA',
    harga: 'Rp15.000',
    aksi: 'pop'
  }
},

// 3. HARGA TOKO KEDUA
{
  teks: 'Namun, di toko sebelah harganya Rp20.000.',
  ucapan: 'Lho, kok lebih mahal?',
  posisi: 38,
  durasi: 4500,
  pose: 'bereaksi',
  ekspresi: 'senang',
  transisi: 'fade',
  kamera: {
    fokus: 'kartu',
    zoom: 1.2,
    ms: 1000
  },
  kartu: {
    label: 'TOKO KEDUA',
    harga: 'Rp20.000',
    aksi: 'goyang'
  }
},

// 4. MEMBANGUN RASA PENASARAN
{
  teks: 'Padahal merek, ukuran, dan produknya sama.',
  ucapan: null,
  posisi: 38,
  durasi: 4500,
  ekspresi: 'bingung',
  transisi: 'kilat',
  kamera: 'wajah'
},

// 5. BIAYA OPERASIONAL
{
  teks: 'Setiap toko memiliki biaya operasional yang berbeda.',
  ucapan: 'Ada biaya listrik, pegawai, dan sewa toko.',
  posisi: 38,
  durasi: 6000,
  pose: 'menjelaskan',
  ekspresi: 'serius',
  transisi: 'fade',
  kamera: 'toko',
  toko: 'sorot'
},

// 6. LOKASI DAN STRATEGI PENJUALAN
{
  teks: 'Lokasi, jumlah stok, dan strategi penjualan juga berpengaruh.',
  ucapan: 'Itu bisa membuat harga berbeda!',
  posisi: 38,
  durasi: 6500,
  pose: 'menunjuk',
  ekspresi: 'senang',
  kamera: {
    fokus: [55, 50],
    zoom: 1.12,
    ms: 1200
  }
},

// 7. PEMAHAMAN
{
  teks: 'Harga lebih mahal belum tentu berarti kualitasnya lebih bagus.',
  ucapan: null,
  posisi: 38,
  durasi: 5500,
  pose: 'berdiri',
  ekspresi: 'serius',
  transisi: 'fade',
  kamera: {
    fokus: 'karakter',
    zoom: 1.2,
    ms: 1000
  }
},

// 8. PENUTUP
{
  teks: 'Bandingkan harga, kualitas, dan kebutuhan sebelum membeli.',
  ucapan: 'Pilih dengan cerdas!',
  posisi: 66,
  jalanMs: 1200,
  durasi: 6000,
  pose: 'bereaksi',
  ekspresi: 'senang',
  transisi: ['fade', 'keluar'],
  kamera: {
    fokus: 'lebar',
    ms: 1200
  }
}

]
};

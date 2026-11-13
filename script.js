/* ==========================================================
   SHORTLY - script.js (Tahap 4)
   Tugas: membaca naskah dari scenes.js lalu memutar adegan satu per satu:
   teks, gelembung, jalan, POSE, EKSPRESI, KAMERA, TRANSISI, animasi OBJEK.
   Backup versi lama: backup-sebelum-tahap4/script.js
   ========================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var speech = $('speech'), caption = $('caption'), character = $('character');
  var cam = $('cam'), fade = $('fade'), flash = $('flash'), ikon = $('ikon');
  var kartu = $('kartu'), kartuLabel = $('kartu-label'), kartuHarga = $('kartu-harga'), toko = $('toko');
  var maskot = character.querySelector('.maskot');
  var naskah = window.SHORTLY_NASKAH;

  // Pengaman: kalau scenes.js belum dimuat atau salah isi, beri pesan jelas.
  if (!naskah || !Array.isArray(naskah.adegan) || naskah.adegan.length === 0) {
    caption.textContent = 'scenes.js tidak ditemukan atau kosong.';
    return;
  }

  /* ---------- Gambar maskot (semua dari lembar karakter SHORTLY) ---------- */
  var POSE = {
    berdiri: 'assets/pose-berdiri.webp', berjalan: 'assets/pose-berjalan.webp',
    menunjuk: 'assets/pose-menunjuk.webp', menjelaskan: 'assets/pose-menjelaskan.webp',
    bereaksi: 'assets/pose-bereaksi.webp'
  };
  var WAJAH = {
    senang: 'assets/wajah-senang.webp', terkejut: 'assets/wajah-terkejut.webp',
    bingung: 'assets/wajah-bingung.webp', berpikir: 'assets/wajah-bingung.webp',
    serius: 'assets/wajah-serius.webp'
  };
  var IKON = { senang: '✦', terkejut: '!', bingung: '?', berpikir: '…', serius: '' };
  [POSE, WAJAH].forEach(function (grup) {          // muat semua gambar di awal supaya pergantian mulus
    Object.keys(grup).forEach(function (k) { new Image().src = grup[k]; });
  });

  var awalKartu = { label: kartuLabel.textContent, harga: kartuHarga.textContent };
  var poseNow = 'berdiri', ekspresiNow = null, wajahNow = false, posisiNow = naskah.posisiAwal, idAdegan = 0;
  var FADE_MS = 240, FADE_KELUAR = 800;

  /* ---------- Jadwal ---------- */
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* ---------- Karakter: posisi, pose, ekspresi ---------- */
  function resetPosisi() {
    character.classList.remove('walking');
    character.style.setProperty('--jalan', '0ms');
    character.style.setProperty('--x', naskah.posisiAwal);
    void character.offsetWidth;
  }
  function jalanKe(posisi, ms) {
    character.style.setProperty('--jalan', ms + 'ms');
    character.style.setProperty('--x', posisi);
    character.classList.add('walking');
    var id = idAdegan;
    later(function () { if (id === idAdegan) character.classList.remove('walking'); }, ms);
  }
  function tampilGambar() {
    var src = wajahNow ? WAJAH[ekspresiNow || 'senang'] : POSE[poseNow];
    character.classList.toggle('wajah', wajahNow);
    if (maskot.getAttribute('src') !== src) {
      maskot.setAttribute('src', src);
      if (maskot.animate) maskot.animate([{ transform: 'scale(0.94, 1.05)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    }
  }
  function setIkon(nama) {
    var t = nama ? IKON[nama] : '';
    ikon.classList.remove('show');
    if (t) { ikon.textContent = t; void ikon.offsetWidth; ikon.classList.add('show'); }
  }

  /* ---------- Kamera ---------- */
  var FOKUS = { lebar: [50, 50, 1], kartu: [80, 17, 1.7], toko: [30, 58, 1.5] };
  function setKamera(k, msBawaan) {
    if (typeof k === 'string') k = { fokus: k };
    k = k || { fokus: 'lebar' };
    var f = k.fokus || 'lebar', x, y, z;
    if (f === 'karakter') { x = posisiNow; y = 52; z = 1.25; }
    else if (f === 'wajah') { x = posisiNow; y = 41; z = 1.3; }
    else if (Array.isArray(f)) { x = f[0]; y = f[1]; z = 1.4; }
    else { x = FOKUS[f][0]; y = FOKUS[f][1]; z = FOKUS[f][2]; }
    z = k.zoom || z;
    var tx = Math.min(0, Math.max(100 - 100 * z, 50 - z * x));   // dibatasi agar tepi panggung tidak terlihat
    var ty = Math.min(0, Math.max(100 - 100 * z, 50 - z * y));
    cam.style.setProperty('--cam-ms', (k.ms !== undefined ? k.ms : msBawaan) + 'ms');
    cam.style.setProperty('--cam-ease', k.ease || 'cubic-bezier(0.45, 0, 0.2, 1)');
    cam.style.setProperty('--cz', z);
    cam.style.setProperty('--cx', tx + '%');
    cam.style.setProperty('--cy', ty + '%');
  }

  /* ---------- Objek ---------- */
  function aksi(el, nama, daftar) {
    daftar.forEach(function (c) { el.classList.remove(c); });
    if (nama) { void el.offsetWidth; el.classList.add(nama); }
  }

  /* ---------- Satu adegan ---------- */
  function tampilkanAdegan(a, sebelumnya) {
    idAdegan++;
    var id = idAdegan;
    caption.textContent = a.teks;
    if (a.ucapan) { speech.textContent = a.ucapan; speech.classList.add('show'); }
    else { speech.classList.remove('show'); }

    var bergerak = a.posisi !== undefined && a.posisi !== sebelumnya;
    if (a.posisi !== undefined) posisiNow = a.posisi;
    var k = a.kamera, namaKamera = typeof k === 'string' ? k : (k && k.fokus);
    poseNow = a.pose || 'berdiri';
    ekspresiNow = a.ekspresi || null;
    wajahNow = namaKamera === 'wajah' && !!a.ekspresi;

    var ms = a.jalanMs || 900;
    if (bergerak && !wajahNow) {            // saat berpindah tempat: pose berjalan, lalu kembali ke pose adegan
      var poseAkhir = poseNow;
      poseNow = 'berjalan';
      jalanKe(a.posisi, ms);
      later(function () { if (id === idAdegan) { poseNow = poseAkhir; tampilGambar(); } }, ms);
    } else if (bergerak) {
      jalanKe(a.posisi, ms);
    }
    tampilGambar();
    setIkon(a.ekspresi);
    setKamera(k, bergerak ? ms : 1000);

    if (a.kartu) {
      if (a.kartu.label) kartuLabel.textContent = a.kartu.label;
      if (a.kartu.harga) kartuHarga.textContent = a.kartu.harga;
    }
    aksi(kartu, a.kartu && a.kartu.aksi, ['pop', 'sorot', 'goyang']);
    aksi(toko, a.toko, ['sorot']);
  }

  /* ---------- Kembalikan semua ke keadaan awal (tanpa animasi) ---------- */
  function resetSemua() {
    speech.classList.remove('show');
    caption.textContent = naskah.teksAwal;
    idAdegan++;
    poseNow = 'berdiri'; ekspresiNow = null; wajahNow = false; posisiNow = naskah.posisiAwal;
    resetPosisi();
    tampilGambar();
    setIkon(null);
    cam.style.transition = 'none';               // Ulangi: kamera kembali seketika, tanpa gerakan
    setKamera('lebar', 0);
    void cam.offsetWidth;
    cam.style.transition = '';
    fade.style.transition = 'none'; fade.className = 'fade'; void fade.offsetWidth; fade.style.transition = '';
    flash.classList.remove('on');
    kartuLabel.textContent = awalKartu.label;
    kartuHarga.textContent = awalKartu.harga;
    aksi(kartu, null, ['pop', 'sorot', 'goyang']);
    aksi(toko, null, ['sorot']);
  }

  function play() {
    clearTimers();
    resetSemua();
    if (naskah.adegan[0].transisi === 'masuk') {     // mulai dari layar hitam lalu terang perlahan
      fade.style.transition = 'none'; fade.className = 'fade on'; void fade.offsetWidth; fade.style.transition = '';
      later(function () { fade.className = 'fade lambat'; }, 50);
    }
    var waktu = 0, posisi = naskah.posisiAwal;
    naskah.adegan.forEach(function (a) {
      var sebelumnya = posisi, t0 = waktu, jeda = 0;
      if (a.transisi === 'fade') {
        later(function () { fade.className = 'fade on'; }, t0);
        jeda = FADE_MS;
      } else if (a.transisi === 'kilat') {
        later(function () { flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); }, t0);
        jeda = 110;
      } else if (a.transisi === 'keluar') {
        later(function () { fade.className = 'fade lambat on'; }, t0 + a.durasi - FADE_KELUAR);
      }
      later(function () {
        tampilkanAdegan(a, sebelumnya);
        if (a.transisi === 'fade') fade.className = 'fade';
      }, t0 + jeda);
      if (a.posisi !== undefined) posisi = a.posisi;
      waktu += a.durasi;
    });
    later(function () { speech.classList.remove('show'); }, waktu);
  }

  function ulangi() {
    clearTimers();
    resetSemua();
  }

  $('play').addEventListener('click', play);
  $('reset').addEventListener('click', ulangi);
  play();
})();

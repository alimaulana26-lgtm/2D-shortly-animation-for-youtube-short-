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
  var tubuh = $('tubuh'), bust = character.querySelector('.bust');
  var lapisan = character.querySelectorAll('.lap');
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
  // Wajah pada gambar tiap pose itu tetap (dari lembar karakter), jadi ekspresi harus cocok dengan pose.
  var WAJAH_POSE = {
    berdiri: ['serius', 'netral'], berjalan: ['netral', 'senang'], menunjuk: ['senang'],
    menjelaskan: ['berpikir', 'serius', 'bingung'], bereaksi: ['senang']
  };
  function cocok(pose, ekspresi) { return WAJAH_POSE[pose].indexOf(ekspresi) !== -1; }
  function poseCocok(ekspresi) {
    var hasil = null;
    ['menunjuk', 'menjelaskan', 'bereaksi', 'berdiri', 'berjalan'].forEach(function (p) { if (!hasil && cocok(p, ekspresi)) hasil = p; });
    return hasil;
  }
  var IKON = { senang: '✦', terkejut: '!', bingung: '?', berpikir: '…', serius: '' };
  [POSE, WAJAH].forEach(function (grup) {          // muat semua gambar di awal supaya pergantian mulus
    Object.keys(grup).forEach(function (k) { new Image().src = grup[k]; });
  });

  var awalKartu = { label: kartuLabel.textContent, harga: kartuHarga.textContent };
  var poseNow = 'berdiri', ekspresiNow = null, wajahNow = false, posisiNow = naskah.posisiAwal, idAdegan = 0;
  var FADE_MS = 240, FADE_KELUAR = 800, TUNDA = 160;   // TUNDA = jeda 'ancang-ancang' sebelum karakter berjalan

  /* ---------- Jadwal ---------- */
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  /* ---------- Karakter: posisi, pose, ekspresi ---------- */
  function resetPosisi() {
    character.classList.remove('walking');
    character.style.setProperty('--jalan', '0ms');
    character.style.setProperty('--tunda', '0ms');
    character.style.setProperty('--x', naskah.posisiAwal);
    void character.offsetWidth;
  }
  // Efek squash & stretch sekali jalan (Web Animations API, ringan)
  function efek(el, frames, ms, easing) {
    if (el.animate) el.animate(frames, { duration: ms, easing: easing || 'ease-out' });
  }
  var ANTISIPASI = [{ transform: 'scale(1,1)' }, { transform: 'scale(1.05,0.93)', offset: 0.6 }, { transform: 'scale(1,1)' }];
  var BERHENTI = [{ transform: 'scale(1.04,0.95)' }, { transform: 'scale(0.99,1.015)', offset: 0.6 }, { transform: 'scale(1,1)' }];
  var KAGET = [{ transform: 'scale(1,1)' }, { transform: 'scale(0.95,0.93)', offset: 0.15 },
               { transform: 'scale(1.09,1.12) translateY(-6px)', offset: 0.35 }, { transform: 'scale(1.02,1.03)', offset: 0.65 }, { transform: 'scale(1,1)' }];
  var MUNCUL = [{ transform: 'scale(0.95,1.04)' }, { transform: 'scale(1,1)' }];

  function jalanKe(posisi, ms, dariPosisi) {
    var id = idAdegan;
    // Sprite berjalan menghadap kanan: kalau tujuan di sebelah kiri, gambar dicerminkan sementara
    character.style.setProperty('--balik', posisi < dariPosisi ? -1 : 1);
    character.style.setProperty('--jalan', ms + 'ms');
    character.style.setProperty('--tunda', TUNDA + 'ms');
    character.style.setProperty('--x', posisi);
    efek(tubuh, ANTISIPASI, TUNDA + 100);                       // jongkok sedikit sebelum melangkah
    later(function () { if (id === idAdegan) character.classList.add('walking'); }, TUNDA);
    later(function () { if (id === idAdegan) { character.classList.remove('walking'); character.style.setProperty('--balik', 1); } }, TUNDA + ms);
  }
  var srcNow = '';
  function tampilGambar(pop) {
    var src = wajahNow ? WAJAH[ekspresiNow || 'senang'] : POSE[poseNow];
    character.classList.toggle('wajah', wajahNow);
    character.setAttribute('data-pose', poseNow);
    var kunci = (wajahNow ? 'w:' : 'p:') + src;
    if (kunci === srcNow) return;
    srcNow = kunci;
    if (wajahNow) {
      bust.setAttribute('src', src);
      if (pop !== false) efek(bust, ekspresiNow === 'terkejut' ? KAGET : MUNCUL, ekspresiNow === 'terkejut' ? 700 : 220);
    } else {
      for (var i = 0; i < lapisan.length; i++) lapisan[i].setAttribute('src', src);
      if (pop !== false) efek(tubuh, MUNCUL, 220);
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
    if (f === 'karakter') { x = posisiNow; y = 55; z = 1.25; }
    else if (f === 'wajah') { x = posisiNow; y = 37.7; z = 1.5; }   // tepi bawah gambar wajah tersembunyi di balik subtitle, tangan di dagu tetap terlihat
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
    aturKartu(z, tx, ty, parseFloat(cam.style.getPropertyValue('--cam-ms')) || 0);
  }

  // Kartu harga: tampil hanya kalau SELURUHNYA berada di dalam layar pada posisi kamera tujuan
  function aturKartu(z, tx, ty, camMs) {
    var W = cam.offsetWidth, H = cam.offsetHeight, m = W * 0.03;
    var kiri = -tx * W / 100 / z, kanan = (W - tx * W / 100) / z, atas = -ty * H / 100 / z, bawah = (H - ty * H / 100) / z;
    var penuh = kartu.offsetLeft - m >= kiri && kartu.offsetLeft + kartu.offsetWidth + m <= kanan &&
                kartu.offsetTop - m >= atas && kartu.offsetTop + kartu.offsetHeight + m <= bawah;
    var id = idAdegan;
    if (!penuh) { kartu.classList.add('sembunyi'); }
    else if (kartu.classList.contains('sembunyi')) {      // muncul lagi setelah kamera hampir sampai
      later(function () { if (id === idAdegan) kartu.classList.remove('sembunyi'); }, camMs * 0.7);
    }
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
    // Pengaman: ekspresi harus cocok dengan wajah pada gambar pose
    if (ekspresiNow && !wajahNow && !cocok(poseNow, ekspresiNow)) {
      var p = poseCocok(ekspresiNow);
      if (p) { console.warn('SHORTLY: pose "' + poseNow + '" tidak cocok dengan ekspresi "' + ekspresiNow + '", diganti ke "' + p + '".'); poseNow = p; }
      else { console.warn('SHORTLY: ekspresi "' + ekspresiNow + '" hanya ada sebagai close-up, memakai kamera wajah.'); wajahNow = true; k = 'wajah'; }
    }
    character.classList.toggle('bicara', !!a.ucapan);   // berbicara: naik-turun halus

    var ms = a.jalanMs || 900;
    if (bergerak && !wajahNow) {            // saat berpindah tempat: pose berjalan, lalu kembali ke pose adegan
      var poseAkhir = poseNow;
      poseNow = 'berjalan';
      jalanKe(a.posisi, ms, sebelumnya);
      later(function () {
        if (id !== idAdegan) return;
        poseNow = poseAkhir; tampilGambar(false); efek(tubuh, BERHENTI, 320);   // berhenti dengan sedikit mengendap
      }, TUNDA + ms);
    } else if (bergerak) {
      jalanKe(a.posisi, ms, sebelumnya);
    }
    tampilGambar();
    setIkon(a.ekspresi);
    setKamera(k, bergerak ? ms + TUNDA : 1000);

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
    character.classList.remove('bicara');
    character.style.setProperty('--balik', 1);
    kartu.classList.remove('sembunyi');
    resetPosisi();
    tampilGambar(false);
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
    if ([].concat(naskah.adegan[0].transisi || []).indexOf('masuk') !== -1) {     // mulai dari layar hitam lalu terang perlahan
      fade.style.transition = 'none'; fade.className = 'fade on'; void fade.offsetWidth; fade.style.transition = '';
      later(function () { fade.className = 'fade lambat'; }, 50);
    }
    var waktu = 0, posisi = naskah.posisiAwal;
    naskah.adegan.forEach(function (a) {
      var sebelumnya = posisi, t0 = waktu, jeda = 0;
      var tr = [].concat(a.transisi || []);                 // boleh satu atau beberapa transisi
      var fadeDulu = tr.indexOf('fade') !== -1;
      if (fadeDulu) {
        later(function () { fade.className = 'fade on'; }, t0);
        jeda = FADE_MS;
      } else if (tr.indexOf('kilat') !== -1) {
        later(function () { flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on'); }, t0);
        jeda = 110;
      }
      if (tr.indexOf('keluar') !== -1) {
        later(function () { fade.className = 'fade lambat on'; }, t0 + a.durasi - FADE_KELUAR);
      }
      later(function () {
        tampilkanAdegan(a, sebelumnya);
        if (fadeDulu) fade.className = 'fade';
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

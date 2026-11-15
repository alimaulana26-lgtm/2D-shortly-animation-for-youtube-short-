/* ==========================================================
   SHORTLY - ekspor/timeline.js
   "Mesin waktu" untuk ekspor video. Mensimulasikan script.js + animasi CSS
   dengan jam virtual, lalu menjawab: "pada milidetik ke-t, apa keadaan adegan?"
   (pose, ekspresi, kamera, posisi, subtitle, gelembung, kartu, fade, dst.)

   PENTING: aturan di sini HARUS sama dengan script.js dan style.css.
   Kalau salah satunya diubah, ubah juga bagian yang bersangkutan di sini.
   Satuan: "u" = satuan desain (panggung lebar 430u, tinggi 764.4u).
   ========================================================== */
(function (global) {
  'use strict';

  var IW = 426, IH = 760.44;                       // area dalam panggung (di luar bingkai 2u)
  var FADE_MS = 240, FADE_KELUAR = 800, TUNDA = 160;
  var AWAL_KARTU = { label: 'HARGA AIR MINERAL', harga: 'Rp4.000' };
  var IKON = { senang: '✦', terkejut: '!', bingung: '?', berpikir: '…', serius: '' };
  var WAJAH_POSE = { berdiri: ['serius', 'netral'], berjalan: ['netral', 'senang'], menunjuk: ['senang'],
                     menjelaskan: ['berpikir', 'serius', 'bingung'], bereaksi: ['senang'] };
  var FOKUS = { lebar: [50, 50, 1], kartu: [80, 17, 1.7], toko: [30, 58, 1.5] };

  /* ---------- kurva percepatan CSS ---------- */
  function bezier(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x, i, cx, cy;
      for (i = 0; i < 30; i++) {
        cx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
        if (Math.abs(cx - x) < 1e-6) break;
        if (cx < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
    };
  }
  var EASE = {
    'linear': function (x) { return Math.min(1, Math.max(0, x)); },
    'ease': bezier(0.25, 0.1, 0.25, 1), 'ease-in-out': bezier(0.42, 0, 0.58, 1), 'ease-out': bezier(0, 0, 0.58, 1),
    'kamera': bezier(0.45, 0, 0.2, 1), 'kartuPop': bezier(0.3, 1.6, 0.5, 1), 'ikon': bezier(0.3, 1.7, 0.5, 1)
  };
  function ambilEase(nama) {
    if (!nama) return EASE.kamera;
    if (EASE[nama]) return EASE[nama];
    var m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(nama);
    if (m) return bezier(+m[1], +m[2], +m[3], +m[4]);
    return EASE.kamera;
  }
  function lerpArr(a, b, e) { var o = [], i; for (i = 0; i < a.length; i++) o.push(a[i] + (b[i] - a[i]) * e); return o; }

  /* ---------- transisi CSS: nilai berubah halus dari nilai sekarang ke tujuan ---------- */
  function hitungTransisi(daftar, awal, t) {
    var seg = null, i, e, dari;
    for (i = 0; i < daftar.length; i++) {
      e = daftar[i]; if (e.t > t) break;
      dari = seg ? nilaiSeg(seg, e.t) : awal;
      seg = { t0: e.t, dari: dari, ke: e.ke, dur: e.dur, tunda: e.tunda || 0, ease: ambilEase(e.ease || 'ease') };
    }
    return seg ? nilaiSeg(seg, t) : awal;
  }
  function nilaiSeg(s, t) {
    var p = s.dur > 0 ? (t - s.t0 - s.tunda) / s.dur : (t - s.t0 - s.tunda >= 0 ? 1 : 0);
    if (p <= 0) return s.dari; if (p >= 1) return s.ke;
    return lerpArr(s.dari, s.ke, s.ease(p));
  }

  /* ---------- animasi @keyframes (tx, ty dalam u; rotasi derajat; skala x, y) ---------- */
  function kf(frames, p, easeFn) {          // frames: [[offset, [nilai...]], ...] ; easeFn dipakai pada tiap selang
    var i;
    if (p <= frames[0][0]) return frames[0][1];
    for (i = 1; i < frames.length; i++) {
      if (p <= frames[i][0]) {
        var a = frames[i - 1], b = frames[i], q = (p - a[0]) / (b[0] - a[0]);
        return lerpArr(a[1], b[1], easeFn(q));
      }
    }
    return frames[frames.length - 1][1];
  }
  var IO = EASE['ease-in-out'];
  var NOL = [0, 0, 0, 1, 1];
  var ANIM = {   // nama: {dur ms, tunda ms, bolakBalik, frames}
    'napas':        { dur: 3400, frames: [[0, NOL], [0.5, [0, 0, 0.4, 1.006, 1.014]], [1, NOL]] },
    'kepala-idle':  { dur: 3400, tunda: 180, frames: [[0, NOL], [0.5, [0, -0.9, 0.7, 1, 1]], [1, NOL]] },
    'bust-napas':   { dur: 3400, frames: [[0, NOL], [0.5, [0, 0, 0.6, 1.014, 1.014]], [1, NOL]] },
    'tunjuk-badan': { dur: 2800, frames: [[0, NOL], [0.2, [0, 0, 1.6, 1.006, 1.012]], [0.4, [0, 0, 0.5, 1, 1]], [1, NOL]] },
    'tunjuk-kepala':{ dur: 2800, frames: [[0, NOL], [0.2, [1.9, -0.8, 2.2, 1, 1]], [0.4, [0.6, 0, 0.8, 1, 1]], [1, NOL]] },
    'jelaskan-badan':{ dur: 3200, frames: [[0, [0, 0, -1, 1, 1]], [0.5, [0, 0, 1.3, 1.004, 1.012]], [1, [0, 0, -1, 1, 1]]] },
    'jelaskan-kepala':{ dur: 3200, frames: [[0, [-1.2, 0, -1.6, 1, 1]], [0.5, [1.5, -0.9, 2, 1, 1]], [1, [-1.2, 0, -1.6, 1, 1]]] },
    'bicara-badan': { dur: 550, balik: true, frames: [[0, NOL], [1, [0, 0, 0.3, 1.004, 1.011]]] },
    'bicara-kepala':{ dur: 550, balik: true, frames: [[0, [0, 0, -0.6, 1, 1]], [1, [0, -1.3, 0.9, 1, 1]]] },
    'bust-bicara':  { dur: 550, balik: true, frames: [[0, [0, 0, -0.5, 1, 1]], [1, [0, -1.6, 0.7, 1.01, 1.01]]] },
    'langkah':      { dur: 600, balik: true, frames: [[0, [0, 0, -6, 1, 1]], [1, [0, 0, 6, 1, 1]]] },
    'badan-jalan':  { dur: 1200, frames: [[0, [0, 0, 1.2, 1, 1]], [0.5, [0, 0, -1.2, 1, 1]], [1, [0, 0, 1.2, 1, 1]]] },
    'kepala-jalan': { dur: 1200, tunda: 80, frames: [[0, [1.3, 0, 1.2, 1, 1]], [0.5, [-1.3, 0, -1.2, 1, 1]], [1, [1.3, 0, 1.2, 1, 1]]] },
    'hop':          { dur: 1600, frames: [[0, NOL], [0.14, [0, 0, 0, 1.07, 0.9]], [0.38, [0, -28, 0, 0.96, 1.07]], [0.5, [0, -32, 0, 0.98, 1.03]],
                      [0.72, [0, -3, 0, 0.97, 1.05]], [0.8, [0, 0, 0, 1.08, 0.9]], [0.9, [0, 0, 0, 0.99, 1.02]], [1, NOL]] }
  };
  function hitungAnim(nama, lokal) {              // lokal = ms sejak animasi mulai
    var a = ANIM[nama]; if (!a) return NOL;
    var t = lokal - (a.tunda || 0); if (t < 0) return NOL;
    var p = (t / a.dur) % (a.balik ? 2 : 1);
    if (a.balik && p > 1) p = 2 - p;
    return kf(a.frames, p, IO);
  }
  function bob(lokal, dur) { var p = (lokal / dur) % 1, s = p < 0.5 ? p * 2 : (1 - p) * 2; return -7 * IO(s); }
  function bayangan(nama, lokal, dur) {           // [skalaX, skalaY, opasitas]
    var p = (lokal / dur) % 1;
    if (nama === 'bayangan-hop') return kf([[0, [1, 1, 0.9]], [0.14, [1.1, 1, 0.95]], [0.45, [0.65, 0.65, 0.45]], [0.8, [1.1, 1, 0.95]], [1, [1, 1, 0.9]]], p, IO);
    return kf([[0, [1, 1, 0.9]], [0.5, [0.85, 0.85, 0.6]], [1, [1, 1, 0.9]]], p, IO);
  }

  /* ---------- efek sekali jalan (Web Animations API di script.js): [skalaX, skalaY, geserY(u)] ---------- */
  var EFEK = {
    ANTISIPASI: { frames: [[0, [1, 1, 0]], [0.6, [1.05, 0.93, 0]], [1, [1, 1, 0]]] },
    BERHENTI:   { frames: [[0, [1.04, 0.95, 0]], [0.6, [0.99, 1.015, 0]], [1, [1, 1, 0]]] },
    KAGET:      { frames: [[0, [1, 1, 0]], [0.15, [0.95, 0.93, 0]], [0.35, [1.09, 1.12, -5.4]], [0.65, [1.02, 1.03, 0]], [1, [1, 1, 0]]] },
    MUNCUL:     { frames: [[0, [0.95, 1.04, 0]], [1, [1, 1, 0]]] }
  };
  function hitungEfek(e, t) {                       // mengembalikan [tx,ty,rot,sx,sy] atau null kalau tidak aktif
    var p = (t - e.t) / e.dur; if (p < 0 || p >= 1) return null;
    var v = kf(e.frames, EASE['ease-out'](p), EASE.linear);
    return [0, v[2], 0, v[0], v[1]];
  }

  /* ---------- ukuran kartu harga (untuk keputusan "kartu terpotong kamera atau tidak") ---------- */
  var _ctxUkur = null;
  function ukurKartu(label, harga) {
    if (!_ctxUkur) _ctxUkur = document.createElement('canvas').getContext('2d');
    _ctxUkur.font = 'bold 9px Arial'; var a = _ctxUkur.measureText(label).width;
    _ctxUkur.font = 'bold 24px Arial'; var b = _ctxUkur.measureText(harga).width;
    var w = Math.max(a, b) + 24 + 4, h = 24 + 4 + 9 * 1.149 + 24 * 1.149;
    return { l: IW - 0.05 * IW - w, t: 0.12 * IH, w: w, h: h };
  }

  /* ==========================================================
     Simulasi: menjalankan jadwal yang sama dengan play() di script.js
     ========================================================== */
  function simulasi(naskah, opsi) {
    opsi = opsi || {};
    var kartuAwal = opsi.kartuAwal || AWAL_KARTU, ukurK = opsi.ukurKartu || ukurKartu;
    var now = 0, q = [], seq = 0, idAdegan = 0, srcNow = '';
    function later(fn, ms) { q.push({ t: now + ms, s: seq++, fn: fn }); }

    var H = { cam: [], x: [], fade: [], speech: [], speechBottom: [], ikonO: [], ikonT: [], kartuV: [] };
    var EFEK_LIST = [], FLASH = [], D = [];
    var posisiNow = naskah.posisiAwal, poseNow = 'berdiri', ekspresiNow = null, wajahNow = false;
    var S = { dataPose: 'berdiri', wajah: false, ekspresi: null, walking: false, bicara: false, balik: 1, caption: naskah.teksAwal,
              speechText: '', speechTarget: 0, ikonText: '', ikonTarget: 0, kartuLabel: kartuAwal.label, kartuHarga: kartuAwal.harga,
              aksi: null, aksiStart: 0, toko: null, tokoStart: 0, sembunyi: false, bottom: 4 };
    var awalFade = 0;

    function pilih(s) {                              // animasi apa yang aktif (urutan prioritas = urutan aturan di style.css)
      var p = s.dataPose, j = s.walking, b = s.bicara, n = {};
      n.badan = p === 'bereaksi' ? null : j ? 'badan-jalan' : b ? 'bicara-badan' : p === 'menunjuk' ? 'tunjuk-badan' : p === 'menjelaskan' ? 'jelaskan-badan' : 'napas';
      n.kepala = p === 'bereaksi' ? null : j ? 'kepala-jalan' : b ? 'bicara-kepala' : p === 'menunjuk' ? 'tunjuk-kepala' : p === 'menjelaskan' ? 'jelaskan-kepala' : 'kepala-idle';
      n.kaki = j ? 'langkah' : null;
      n.tubuh = p === 'bereaksi' ? 'hop' : null;
      n.bust = b ? 'bust-bicara' : 'bust-napas';
      n.bayangan = p === 'bereaksi' ? 'bayangan-hop' : 'bayangan';
      return n;
    }
    function snap() {
      var salin = JSON.parse(JSON.stringify(S)), prev = D.length ? D[D.length - 1] : null;
      var sel = pilih(S), mulai = {}, k;
      for (k in sel) mulai[k] = (prev && prev.sel[k] === sel[k]) ? prev.mulai[k] : now;
      if (prev && JSON.stringify(prev.s) === JSON.stringify(salin)) return;
      D.push({ t: now, s: salin, sel: sel, mulai: mulai });
    }

    // ---- potongan dari script.js ----
    function cocok(pose, e) { return WAJAH_POSE[pose].indexOf(e) !== -1; }
    function poseCocok(e) { var h = null; ['menunjuk', 'menjelaskan', 'bereaksi', 'berdiri', 'berjalan'].forEach(function (p) { if (!h && cocok(p, e)) h = p; }); return h; }
    function efek(jenis, nama, dur) { EFEK_LIST.push({ t: now, jenis: jenis, frames: EFEK[nama].frames, dur: dur }); }

    function tampilGambar(pop) {
      S.dataPose = poseNow;
      if (S.wajah !== wajahNow) {
        S.wajah = wajahNow;
        H.speechBottom.push({ t: now, ke: [wajahNow ? 24 : 4], dur: 300, ease: 'ease' });
      }
      S.ekspresi = ekspresiNow;
      var kunci = wajahNow ? 'w:' + (ekspresiNow === 'berpikir' ? 'bingung' : (ekspresiNow || 'senang')) : 'p:' + poseNow;
      if (kunci === srcNow) return;
      srcNow = kunci;
      if (pop !== false) {
        if (wajahNow) efek('bust', ekspresiNow === 'terkejut' ? 'KAGET' : 'MUNCUL', ekspresiNow === 'terkejut' ? 700 : 220);
        else efek('tubuh', 'MUNCUL', 220);
      }
    }
    function setIkon(nama) {
      var t = nama ? IKON[nama] : '';
      if (!t) {
        if (S.ikonTarget) { S.ikonTarget = 0; H.ikonO.push({ t: now, ke: [0], dur: 200, ease: 'ease' }); H.ikonT.push({ t: now, ke: [0], dur: 300, ease: 'ikon' }); }
      } else {
        S.ikonText = t;
        if (!S.ikonTarget) { S.ikonTarget = 1; H.ikonO.push({ t: now, ke: [1], dur: 200, ease: 'ease' }); H.ikonT.push({ t: now, ke: [1], dur: 300, ease: 'ikon' }); }
      }
    }
    function aturKartu(z, tx, ty, camMs) {
      var W = IW, Hh = IH, m = W * 0.03, r = ukurK(S.kartuLabel, S.kartuHarga);
      var kiri = -tx * W / 100 / z, kanan = (W - tx * W / 100) / z, atas = -ty * Hh / 100 / z, bawah = (Hh - ty * Hh / 100) / z;
      var penuh = r.l - m >= kiri && r.l + r.w + m <= kanan && r.t - m >= atas && r.t + r.h + m <= bawah, id = idAdegan;
      if (!penuh) {
        if (!S.sembunyi) { S.sembunyi = true; H.kartuV.push({ t: now, ke: [0], dur: 250, ease: 'ease' }); }
      } else if (S.sembunyi) {
        later(function () { if (id === idAdegan) { S.sembunyi = false; H.kartuV.push({ t: now, ke: [1], dur: 250, ease: 'ease' }); } }, camMs * 0.7);
      }
    }
    function setKamera(k, msBawaan) {
      if (typeof k === 'string') k = { fokus: k };
      k = k || { fokus: 'lebar' };
      var f = k.fokus || 'lebar', x, y, z;
      if (f === 'karakter') { x = posisiNow; y = 55; z = 1.25; }
      else if (f === 'wajah') { x = posisiNow; y = 37.7; z = 1.5; }
      else if (Array.isArray(f)) { x = f[0]; y = f[1]; z = 1.4; }
      else { x = FOKUS[f][0]; y = FOKUS[f][1]; z = FOKUS[f][2]; }
      z = k.zoom || z;
      var tx = Math.min(0, Math.max(100 - 100 * z, 50 - z * x)), ty = Math.min(0, Math.max(100 - 100 * z, 50 - z * y));
      var ms = k.ms !== undefined ? k.ms : msBawaan;
      H.cam.push({ t: now, ke: [z, tx, ty], dur: ms, ease: k.ease || 'kamera' });
      aturKartu(z, tx, ty, ms || 0);
    }
    function jalanKe(posisi, ms, dari) {
      var id = idAdegan;
      S.balik = posisi < dari ? -1 : 1;
      H.x.push({ t: now, ke: [posisi], dur: ms, tunda: TUNDA, ease: 'ease-in-out' });
      efek('tubuh', 'ANTISIPASI', TUNDA + 100);
      later(function () { if (id === idAdegan) S.walking = true; }, TUNDA);
      later(function () { if (id === idAdegan) { S.walking = false; S.balik = 1; } }, TUNDA + ms);
    }
    function tampilkanAdegan(a, sebelumnya) {
      idAdegan++; var id = idAdegan;
      S.caption = a.teks;
      if (a.ucapan) { S.speechText = a.ucapan; if (!S.speechTarget) { S.speechTarget = 1; H.speech.push({ t: now, ke: [1], dur: 300, ease: 'ease' }); } }
      else if (S.speechTarget) { S.speechTarget = 0; H.speech.push({ t: now, ke: [0], dur: 300, ease: 'ease' }); }
      var bergerak = a.posisi !== undefined && a.posisi !== sebelumnya;
      if (a.posisi !== undefined) posisiNow = a.posisi;
      var k = a.kamera, namaKamera = typeof k === 'string' ? k : (k && k.fokus);
      poseNow = a.pose || 'berdiri'; ekspresiNow = a.ekspresi || null;
      wajahNow = namaKamera === 'wajah' && !!a.ekspresi;
      if (ekspresiNow && !wajahNow && !cocok(poseNow, ekspresiNow)) {
        var p = poseCocok(ekspresiNow);
        if (p) poseNow = p; else { wajahNow = true; k = 'wajah'; }
      }
      S.bicara = !!a.ucapan;
      var ms = a.jalanMs || 900;
      if (bergerak && !wajahNow) {
        var poseAkhir = poseNow; poseNow = 'berjalan';
        jalanKe(a.posisi, ms, sebelumnya);
        later(function () { if (id !== idAdegan) return; poseNow = poseAkhir; tampilGambar(false); efek('tubuh', 'BERHENTI', 320); }, TUNDA + ms);
      } else if (bergerak) { jalanKe(a.posisi, ms, sebelumnya); }
      tampilGambar();
      setIkon(a.ekspresi);
      setKamera(k, bergerak ? ms + TUNDA : 1000);
      if (a.kartu) { if (a.kartu.label) S.kartuLabel = a.kartu.label; if (a.kartu.harga) S.kartuHarga = a.kartu.harga; }
      S.aksi = (a.kartu && a.kartu.aksi) || null; S.aksiStart = now;
      S.toko = a.toko || null; S.tokoStart = now;
    }

    // ---- keadaan awal (resetSemua) lalu jadwal (play) ----
    H.cam.push({ t: 0, ke: [1, 0, 0], dur: 0 });                 // kamera lebar
    H.x.push({ t: 0, ke: [naskah.posisiAwal], dur: 0 });
    srcNow = 'p:berdiri'; snap();
    var tr0 = [].concat(naskah.adegan[0].transisi || []);
    if (tr0.indexOf('masuk') !== -1) { awalFade = 1; later(function () { H.fade.push({ t: now, ke: [0], dur: 800, ease: 'ease' }); }, 50); }
    var waktu = 0, posisi = naskah.posisiAwal;
    naskah.adegan.forEach(function (a) {
      var sebelumnya = posisi, t0 = waktu, jeda = 0, tr = [].concat(a.transisi || []), fadeDulu = tr.indexOf('fade') !== -1;
      if (fadeDulu) { later(function () { H.fade.push({ t: now, ke: [1], dur: FADE_MS, ease: 'ease' }); }, t0); jeda = FADE_MS; }
      else if (tr.indexOf('kilat') !== -1) { later(function () { FLASH.push(now); }, t0); jeda = 110; }
      if (tr.indexOf('keluar') !== -1) later(function () { H.fade.push({ t: now, ke: [1], dur: FADE_KELUAR, ease: 'ease' }); }, t0 + a.durasi - FADE_KELUAR);
      later(function () {
        tampilkanAdegan(a, sebelumnya);
        if (fadeDulu) H.fade.push({ t: now, ke: [0], dur: FADE_MS, ease: 'ease' });
      }, t0 + jeda);
      if (a.posisi !== undefined) posisi = a.posisi;
      waktu += a.durasi;
    });
    later(function () { if (S.speechTarget) { S.speechTarget = 0; H.speech.push({ t: now, ke: [0], dur: 300, ease: 'ease' }); } }, waktu);

    q.sort(function (a, b) { return a.t - b.t || a.s - b.s; });    // urutan sama dengan setTimeout; jadwal baru bisa muncul saat berjalan
    while (q.length) {
      q.sort(function (a, b) { return a.t - b.t || a.s - b.s; });
      var e = q.shift(); now = e.t; e.fn(); snap();
    }

    /* ---------- kueri keadaan pada waktu t ---------- */
    function cari(t) { var lo = 0, hi = D.length - 1; while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (D[mid].t <= t) lo = mid; else hi = mid - 1; } return D[lo]; }
    function keadaan(t) {
      var d = cari(t), s = d.s, sel = d.sel, mulai = d.mulai, hasil = { t: t, s: s };
      var camV = hitungTransisi(H.cam, [1, 0, 0], t);
      hasil.cam = { z: camV[0], tx: camV[1], ty: camV[2] };
      hasil.x = hitungTransisi(H.x, [naskah.posisiAwal], t)[0];
      hasil.fade = hitungTransisi(H.fade, [awalFade], t)[0];
      var fl = 0, i;
      for (i = 0; i < FLASH.length; i++) { var pf = (t - FLASH[i]) / 500; if (pf >= 0 && pf < 1) fl = kf([[0, [0]], [0.22, [0.9]], [1, [0]]], pf, EASE['ease-out'])[0]; }
      hasil.flash = fl;
      hasil.pose = s.dataPose; hasil.wajah = s.wajah; hasil.ekspresi = s.ekspresi; hasil.balik = s.balik; hasil.walking = s.walking; hasil.bicara = s.bicara;
      var durBob = s.walking ? 600 : 1600;
      hasil.bobY = bob(t, durBob);
      hasil.bayangan = bayangan(sel.bayangan, t - mulai.bayangan, s.dataPose === 'bereaksi' ? 1600 : durBob);
      hasil.badan = sel.badan ? hitungAnim(sel.badan, t - mulai.badan) : NOL;
      hasil.kepala = sel.kepala ? hitungAnim(sel.kepala, t - mulai.kepala) : NOL;
      hasil.kaki = sel.kaki ? hitungAnim(sel.kaki, t - mulai.kaki) : NOL;
      var tub = sel.tubuh ? hitungAnim(sel.tubuh, t - mulai.tubuh) : NOL, bus = hitungAnim(sel.bust, t - mulai.bust);
      for (i = 0; i < EFEK_LIST.length; i++) {            // efek sekali jalan menggantikan animasi CSS selama aktif (yang terbaru menang)
        var ef = EFEK_LIST[i], v = hitungEfek(ef, t);
        if (v) { if (ef.jenis === 'tubuh') tub = v; else bus = v; }
      }
      hasil.tubuh = tub; hasil.bust = bus;
      var io = hitungTransisi(H.ikonO, [0], t)[0], it = hitungTransisi(H.ikonT, [0], t)[0];
      hasil.ikon = { text: s.ikonText, o: io, p: it };
      var sv = hitungTransisi(H.speech, [0], t)[0];
      hasil.speech = { text: s.speechText, v: sv, bottom: hitungTransisi(H.speechBottom, [4], t)[0] };
      hasil.caption = s.caption;
      var kv = hitungTransisi(H.kartuV, [1], t)[0];
      hasil.kartu = { label: s.kartuLabel, harga: s.kartuHarga, vis: kv, aksi: s.aksi, aksiT: t - s.aksiStart };
      hasil.toko = { sorot: !!s.toko, t: t - s.tokoStart };
      return hasil;
    }
    return { keadaan: keadaan, durasiAdegan: waktu, durasi: waktu + 300, jumlahEvent: D.length, debug: { H: H, D: D, EFEK: EFEK_LIST } };
  }

  global.SHORTLY_TL = { simulasi: simulasi, ukurKartu: ukurKartu, IW: IW, IH: IH, hitungAnim: hitungAnim, EASE: EASE, ambilEase: ambilEase, kf: kf, NOL: NOL };
})(typeof window !== 'undefined' ? window : globalThis);

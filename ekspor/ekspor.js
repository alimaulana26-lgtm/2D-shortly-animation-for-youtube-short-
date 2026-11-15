/* ==========================================================
   SHORTLY - ekspor/ekspor.js
   Tombol "EXPORT VIDEO": merekam animasi dari awal sampai akhir menjadi file video.
   Cara utama : Canvas -> WebCodecs (H.264) -> MP4  (dirender frame demi frame, 30 fps)
   Cadangan   : Canvas -> MediaRecorder (waktu nyata) -> MP4 atau WebM
   Tanpa audio (audio ditambahkan di CapCut).
   ========================================================== */
(function () {
  'use strict';
  var FPS = 30, EKOR_MS = 300;
  var MUTU = {
    hemat: { nama: 'Hemat', lebar: 720, tinggi: 1280, bitrate: 4500000, ss: 1.5, kodek: ['avc1.42001f', 'avc1.4d001f', 'avc1.64001f'] },
    tajam: { nama: 'Tajam', lebar: 1080, tinggi: 1920, bitrate: 9000000, ss: 1.2, kodek: ['avc1.420028', 'avc1.4d0028', 'avc1.640028'] }
  };
  var $ = function (id) { return document.getElementById(id); };
  var tombol = $('ekspor');
  if (!tombol) return;

  var kondisi = { jalan: false, batal: false, hasil: null, urlSimpan: null, mutu: 'hemat', cara: null };
  var el = {};

  function Galat(pesan, saran, bisaCadangan) { var e = new Error(pesan); e.saran = saran || ''; e.bisaCadangan = !!bisaCadangan; e.galatEkspor = true; return e; }
  function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function mb(b) { return (b / 1048576).toFixed(1) + ' MB'; }
  function dtk(ms) { var s = Math.max(0, Math.round(ms / 1000)); return s >= 60 ? Math.floor(s / 60) + ' mnt ' + (s % 60) + ' dtk' : s + ' dtk'; }

  /* ---------- tampilan panel ---------- */
  function bangunPanel() {
    var p = document.createElement('div');
    p.className = 'ekspor-lapisan'; p.id = 'panel-ekspor'; p.hidden = true;
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-labelledby', 'ekspor-judul');
    p.innerHTML =
      '<div class="ekspor-kartu">' +
      '<h2 id="ekspor-judul">Export video SHORTLY</h2>' +
      '<div id="ekspor-pilih">' +
        '<p class="ekspor-teks">Animasi direkam dari awal sampai akhir (±22 detik, 30 fps, tanpa suara) menjadi file <b>MP4</b> untuk CapCut.</p>' +
        '<div class="ekspor-mutu" role="radiogroup" aria-label="Kualitas video">' +
          '<button type="button" class="ekspor-opsi aktif" data-mutu="hemat" role="radio" aria-checked="true"><b>Hemat</b> 720×1280<small>Disarankan • lebih ringan untuk HP</small></button>' +
          '<button type="button" class="ekspor-opsi" data-mutu="tajam" role="radio" aria-checked="false"><b>Tajam</b> 1080×1920<small>Lebih tajam • butuh memori lebih besar</small></button>' +
        '</div>' +
        '<p class="ekspor-teks kecil">Selama proses, biarkan layar menyala dan jangan pindah aplikasi.</p>' +
        '<div class="ekspor-baris"><button type="button" id="ekspor-mulai" class="ekspor-utama">Mulai export</button>' +
        '<button type="button" id="ekspor-cek" class="ekspor-sekunder">Cek dukungan HP</button>' +
        '<button type="button" id="ekspor-tutup1" class="ekspor-sekunder">Tutup</button></div>' +
      '</div>' +
      '<div id="ekspor-proses" hidden>' +
        '<p class="ekspor-teks" id="ekspor-status" aria-live="polite">Menyiapkan…</p>' +
        '<div class="ekspor-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="ekspor-bar"><div id="ekspor-isi"></div></div>' +
        '<p class="ekspor-teks kecil" id="ekspor-detail"></p>' +
        '<div class="ekspor-baris"><button type="button" id="ekspor-batal" class="ekspor-sekunder">Batal</button></div>' +
      '</div>' +
      '<div id="ekspor-selesai" hidden>' +
        '<p class="ekspor-teks ok" id="ekspor-info"></p>' +
        '<div class="ekspor-baris"><button type="button" id="ekspor-simpan" class="ekspor-utama">Simpan video</button>' +
        '<button type="button" id="ekspor-bagikan" class="ekspor-utama" hidden>Bagikan ke CapCut</button>' +
        '<button type="button" id="ekspor-tutup2" class="ekspor-sekunder">Tutup</button></div>' +
        '<p class="ekspor-teks kecil" id="ekspor-petunjuk"></p>' +
      '</div>' +
      '<div id="ekspor-galat" hidden>' +
        '<p class="ekspor-teks galat" id="ekspor-pesan" role="alert"></p>' +
        '<p class="ekspor-teks kecil" id="ekspor-saran"></p>' +
        '<div class="ekspor-baris"><button type="button" id="ekspor-cadangan" class="ekspor-utama" hidden>Coba cara cadangan</button>' +
        '<button type="button" id="ekspor-ulang" class="ekspor-sekunder">Kembali</button>' +
        '<button type="button" id="ekspor-tutup3" class="ekspor-sekunder">Tutup</button></div>' +
      '</div>' +
      '<pre class="ekspor-diag" id="ekspor-diag" hidden></pre>' +
      '</div>';
    document.body.appendChild(p);
    ['panel-ekspor', 'ekspor-pilih', 'ekspor-proses', 'ekspor-selesai', 'ekspor-galat', 'ekspor-status', 'ekspor-isi', 'ekspor-bar', 'ekspor-detail', 'ekspor-info', 'ekspor-petunjuk',
     'ekspor-pesan', 'ekspor-saran', 'ekspor-cadangan', 'ekspor-diag', 'ekspor-simpan', 'ekspor-bagikan'].forEach(function (id) { el[id] = $(id); });
  }
  function tampil(bagian) {
    ['pilih', 'proses', 'selesai', 'galat'].forEach(function (b) { el['ekspor-' + b].hidden = b !== bagian; });
    el['panel-ekspor'].hidden = false;
  }
  function lapor(frac, status, detail) {
    if (typeof frac === 'number' && isFinite(frac)) {                 // frac kosong = hanya ganti teks, bar tidak diubah
      var pct = Math.min(100, Math.max(0, Math.round(frac * 100)));
      el['ekspor-isi'].style.width = pct + '%'; el['ekspor-bar'].setAttribute('aria-valuenow', pct);
    }
    if (status) el['ekspor-status'].textContent = status;
    if (detail !== undefined) el['ekspor-detail'].textContent = detail;
  }
  function tutupPanel() {
    el['panel-ekspor'].hidden = true; el['ekspor-diag'].hidden = true;
    if (kondisi.urlSimpan) { URL.revokeObjectURL(kondisi.urlSimpan); kondisi.urlSimpan = null; }
    kondisi.hasil = null; window.SHORTLY_EKSPOR_TERAKHIR = null;
    pulihkanPemutar();
  }

  /* ---------- pemutar halaman: dihentikan selama export, dihidupkan lagi sesudahnya ---------- */
  function hentikanPemutar() { var r = $('reset'); if (r) r.click(); }
  function pulihkanPemutar() { var p = $('play'); if (p && !kondisi.jalan) p.click(); }

  /* ---------- dukungan browser ---------- */
  function adaWebCodecs() { return typeof window.VideoEncoder !== 'undefined' && typeof window.VideoFrame !== 'undefined' && typeof window.SHORTLY_MP4 === 'function'; }
  function cfgKodek(m, kodek) { return { codec: kodek, width: m.lebar, height: m.tinggi, bitrate: m.bitrate, framerate: FPS, avc: { format: 'avc' } }; }
  async function pilihKodek(m) {
    var i, s;
    for (i = 0; i < m.kodek.length; i++) {
      try { s = await VideoEncoder.isConfigSupported(cfgKodek(m, m.kodek[i])); if (s && s.supported) return m.kodek[i]; } catch (e) { /* coba berikutnya */ }
    }
    return null;
  }
  async function cekDukungan() {
    var b = [], ua = navigator.userAgent, v = /Chrome\/([\d.]+)/.exec(ua), i, k, s;
    b.push('Browser      : ' + (v ? 'Chrome ' + v[1] : ua.slice(0, 60)) + (/Android/.test(ua) ? ' (Android)' : ''));
    b.push('Memori (kira2): ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'tidak diketahui') + ' | CPU: ' + (navigator.hardwareConcurrency || '?') + ' inti');
    b.push('WebCodecs    : ' + (typeof window.VideoEncoder !== 'undefined' ? 'ada' : 'TIDAK ada'));
    if (typeof window.VideoEncoder !== 'undefined') {
      for (var q in MUTU) for (i = 0; i < MUTU[q].kodek.length; i++) {
        k = MUTU[q].kodek[i];
        try { s = await VideoEncoder.isConfigSupported(cfgKodek(MUTU[q], k)); } catch (e) { s = { supported: false }; }
        b.push('H.264 ' + MUTU[q].lebar + 'x' + MUTU[q].tinggi + ' ' + k + ' : ' + (s.supported ? 'didukung' : 'tidak'));
      }
    }
    if (typeof window.MediaRecorder !== 'undefined') {
      ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].forEach(function (t) { b.push('Rekam langsung ' + t + ' : ' + (MediaRecorder.isTypeSupported(t) ? 'didukung' : 'tidak')); });
    } else b.push('Rekam langsung (MediaRecorder): TIDAK ada');
    b.push('Layar tetap menyala (wakeLock): ' + ('wakeLock' in navigator ? 'ada' : 'tidak'));
    b.push('Bagikan file      (share)   : ' + (typeof navigator.canShare === 'function' ? 'ada' : 'tidak'));
    return b.join('\n');
  }

  /* ---------- persiapan bersama ---------- */
  async function siapkan(m) {
    if (typeof window.SHORTLY_TL === 'undefined' || typeof window.SHORTLY_RENDER === 'undefined' || !window.SHORTLY_NASKAH) throw Galat('File mesin export tidak lengkap.', 'Pastikan folder "ekspor" ikut diunggah ke GitHub (timeline.js, render.js, mp4.js, ekspor.js).');
    var gambar;
    try { gambar = await window.SHORTLY_RENDER.muatGambar('assets/'); }
    catch (e) { throw Galat(e.message, 'Pastikan folder "assets" (huruf kecil) dan semua gambar pose/wajah ada di GitHub.'); }
    var tl = window.SHORTLY_TL.simulasi(window.SHORTLY_NASKAH);
    var kanvas = document.createElement('canvas'); kanvas.width = m.lebar; kanvas.height = m.tinggi;
    var ctx = kanvas.getContext('2d');
    var r = window.SHORTLY_RENDER.buat({ lebar: m.lebar, tinggi: m.tinggi, tl: tl, gambar: gambar, skyline: window.SHORTLY_RENDER.bacaSiluet(), supersample: m.ss });
    r.siapkan();
    return { tl: tl, kanvas: kanvas, ctx: ctx, r: r, jumlah: Math.ceil(tl.durasi / 1000 * FPS) };
  }
  function bebaskan(s) { try { s.r.tutup(); s.kanvas.width = 1; s.kanvas.height = 1; } catch (e) { /* abaikan */ } }
  async function tungguTampak(status) {
    var pernah = false;
    while (document.hidden) { if (!pernah) { lapor(undefined, 'Dijeda: kembali ke halaman ini agar export dilanjutkan.'); pernah = true; } if (kondisi.batal) return; await tidur(300); }
    if (pernah) lapor(undefined, status);
  }
  async function kunciLayar() { try { if ('wakeLock' in navigator) return await navigator.wakeLock.request('screen'); } catch (e) { /* tidak wajib */ } return null; }

  /* ==========================================================
     Cara utama: WebCodecs H.264 -> MP4
     ========================================================== */
  async function eksporMP4(m) {
    if (!adaWebCodecs()) throw Galat('Browser ini belum mendukung perekaman MP4 langsung (WebCodecs).', 'Akan dicoba cara cadangan (rekam langsung).', true);
    lapor(0, 'Memeriksa dukungan encoder H.264…', '');
    var kodek = await pilihKodek(m);
    if (!kodek) throw Galat('HP ini tidak mendukung encoder H.264 untuk ' + m.lebar + '×' + m.tinggi + '.', m.nama === 'Tajam' ? 'Coba kualitas Hemat, atau pakai cara cadangan.' : 'Coba cara cadangan (rekam langsung).', true);
    var s = await siapkan(m), enc = null, mp4 = new window.SHORTLY_MP4({ lebar: m.lebar, tinggi: m.tinggi, fps: FPS }), galatEnc = null, kunci = null, mulai = Date.now();
    try {
      enc = new VideoEncoder({
        output: function (chunk, meta) { try { mp4.tambah(chunk, meta); } catch (e) { galatEnc = galatEnc || e; } },
        error: function (e) { galatEnc = galatEnc || e; }
      });
      enc.configure(cfgKodek(m, kodek));
      kunci = await kunciLayar();
      var status = 'Merender frame video…', i, t, f, kecil = Math.round(1e6 / FPS);
      lapor(0, status, '');
      for (i = 0; i < s.jumlah; i++) {
        if (kondisi.batal) throw Galat('Export dibatalkan.', '', false);
        if (galatEnc) throw galatEnc;
        if (document.hidden) await tungguTampak(status);
        t = i * 1000 / FPS;
        s.r.frame(s.ctx, t);
        f = new VideoFrame(s.kanvas, { timestamp: Math.round(i * 1e6 / FPS), duration: kecil });
        try { enc.encode(f, { keyFrame: i % FPS === 0 }); } finally { f.close(); }
        while (enc.encodeQueueSize > 3) { await tidur(2); if (galatEnc) throw galatEnc; }
        if (i % 6 === 0 || i === s.jumlah - 1) {
          var frac = (i + 1) / s.jumlah, lewat = Date.now() - mulai;
          lapor(frac * 0.97, status, 'Frame ' + (i + 1) + ' dari ' + s.jumlah + ' • sisa ±' + dtk(lewat / frac - lewat));
          await tidur(0);
        }
      }
      lapor(0.97, 'Menyelesaikan file MP4…', 'Menunggu encoder selesai');
      await enc.flush();
      if (galatEnc) throw galatEnc;
      if (mp4.jumlahFrame() !== s.jumlah) throw Galat('Jumlah frame tidak lengkap (' + mp4.jumlahFrame() + ' dari ' + s.jumlah + ').', 'Coba ulangi dengan kualitas Hemat.', true);
      var blob = mp4.selesai();
      lapor(1, 'Selesai', '');
      return { blob: blob, mime: 'video/mp4', ext: 'mp4', codec: kodek, cara: 'WebCodecs H.264', durasiMs: s.tl.durasi, frame: s.jumlah, m: m };
    } catch (e) {
      if (e && e.galatEkspor) throw e;
      var pesan = (e && e.message) || String(e), mem = /memory|quota|alloc/i.test(pesan) || (e && e.name === 'QuotaExceededError') || (e && e.name === 'RangeError');
      throw Galat('Encoder video gagal: ' + pesan, mem ? 'Memori HP tidak cukup. Tutup aplikasi lain lalu coba kualitas Hemat.' : 'Coba kualitas Hemat, atau pakai cara cadangan.', true);
    } finally {
      try { if (enc && enc.state !== 'closed') enc.close(); } catch (e2) { /* abaikan */ }
      if (kunci) { try { kunci.release(); } catch (e3) { /* abaikan */ } }
      bebaskan(s);
    }
  }

  /* ==========================================================
     Cadangan: MediaRecorder dari kanvas (waktu nyata)
     ========================================================== */
  async function eksporLangsung(m) {
    if (typeof window.MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') {
      throw Galat('Browser ini tidak bisa merekam video langsung.', 'Pakai perekam layar bawaan Android (geser panel notifikasi → Rekam layar) lalu edit di CapCut.', false);
    }
    var tipe = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0];
    if (!tipe) throw Galat('Tidak ada format rekam yang didukung browser ini.', 'Pakai perekam layar bawaan Android lalu edit di CapCut.', false);
    var s = await siapkan(m), kunci = await kunciLayar(), rec, bagian = [], track, mulai, galatRec = null;
    try {
      var stream = s.kanvas.captureStream(0); track = stream.getVideoTracks()[0];
      rec = new MediaRecorder(stream, { mimeType: tipe, videoBitsPerSecond: m.bitrate });
      rec.ondataavailable = function (e) { if (e.data && e.data.size) bagian.push(e.data); };
      rec.onerror = function (e) { galatRec = (e && e.error) || new Error('MediaRecorder error'); };
      var selesai = new Promise(function (ok) { rec.onstop = ok; });
      s.r.frame(s.ctx, 0); rec.start(1000);
      var status = 'Merekam langsung (waktu nyata)…'; lapor(0, status, 'Jangan tinggalkan halaman ini'); mulai = performance.now();
      await new Promise(function (ok, gagal) {
        function langkah() {
          if (kondisi.batal) return gagal(Galat('Export dibatalkan.', '', false));
          if (galatRec) return gagal(galatRec);
          var t = performance.now() - mulai;
          if (t >= s.tl.durasi) return ok();
          s.r.frame(s.ctx, t); if (track.requestFrame) track.requestFrame();
          lapor(t / s.tl.durasi * 0.97, status, 'Berjalan ' + dtk(t) + ' dari ' + dtk(s.tl.durasi));
          requestAnimationFrame(langkah);
        }
        langkah();
      });
      s.r.frame(s.ctx, s.tl.durasi - 1); if (track.requestFrame) track.requestFrame();
      await tidur(200); rec.stop(); await selesai;
      var blob = new Blob(bagian, { type: tipe.split(';')[0] }), mp4 = /mp4/.test(tipe);
      if (!blob.size) throw Galat('Rekaman kosong.', 'Coba ulangi atau pakai perekam layar Android.', false);
      lapor(1, 'Selesai', '');
      return { blob: blob, mime: blob.type, ext: mp4 ? 'mp4' : 'webm', codec: tipe, cara: 'Rekam langsung (MediaRecorder)', durasiMs: s.tl.durasi, frame: null, m: m, cadangan: true };
    } catch (e) {
      if (e && e.galatEkspor) throw e;
      throw Galat('Perekaman gagal: ' + ((e && e.message) || e), 'Coba ulangi atau pakai perekam layar bawaan Android.', false);
    } finally {
      try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e2) { /* abaikan */ }
      if (kunci) { try { kunci.release(); } catch (e3) { /* abaikan */ } }
      bebaskan(s);
    }
  }

  /* ---------- alur tombol ---------- */
  function namaFile(h) {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'shortly-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-' + h.m.lebar + 'p.' + h.ext;
  }
  function tampilkanHasil(h) {
    h.nama = namaFile(h); kondisi.hasil = h; window.SHORTLY_EKSPOR_TERAKHIR = h;
    el['ekspor-info'].textContent = '✔ Video siap: ' + h.nama + ' • ' + mb(h.blob.size) + ' • ' + h.m.lebar + '×' + h.m.tinggi + ' • ' + (h.durasiMs / 1000).toFixed(1) + ' dtk • ' + h.cara;
    var buka = 'Setelah disimpan, buka CapCut → Proyek baru → pilih video dari Galeri atau folder Download. Jika tidak terlihat di Galeri, pakai tombol Bagikan.';
    el['ekspor-petunjuk'].textContent = h.cadangan
      ? (h.ext === 'webm'
          ? 'Format WebM: CapCut Android kadang tidak bisa membukanya. Jika gagal, pakai perekam layar bawaan Android, atau ubah WebM ke MP4 dengan aplikasi konverter. '
          : 'Ini hasil rekam langsung: frame rate-nya bisa tidak tetap, jadi gerakan mungkin kurang halus di CapCut. Cara utama (MP4 H.264 30 fps) lebih disarankan kalau HP mendukung. ') + buka
      : buka;
    el['ekspor-bagikan'].hidden = !(navigator.canShare && typeof File !== 'undefined');
    tampil('selesai');
  }
  function tampilkanGalat(e, bisaCadangan) {
    el['ekspor-pesan'].textContent = e.message || 'Export gagal.';
    el['ekspor-saran'].textContent = e.saran || '';
    el['ekspor-cadangan'].hidden = !(bisaCadangan && e.bisaCadangan);
    tampil('galat');
  }
  async function jalankan(cara) {
    if (kondisi.jalan) return;
    kondisi.jalan = true; kondisi.batal = false; kondisi.cara = cara;
    tombol.disabled = true; hentikanPemutar(); tampil('proses'); lapor(0, 'Menyiapkan…', '');
    var m = MUTU[kondisi.mutu];
    try {
      var h = cara === 'cadangan' ? await eksporLangsung(m) : await eksporMP4(m);
      kondisi.jalan = false; tampilkanHasil(h);
    } catch (e) {
      kondisi.jalan = false;
      if (e && e.message === 'Export dibatalkan.') { tampil('pilih'); }
      else { if (window.console) console.error('SHORTLY export:', e); tampilkanGalat(e && e.galatEkspor ? e : Galat('Export gagal: ' + ((e && e.message) || e), 'Coba ulangi dengan kualitas Hemat.', false), cara !== 'cadangan'); }
    } finally { kondisi.jalan = false; tombol.disabled = false; }
  }
  function simpan() {
    var h = kondisi.hasil; if (!h) return;
    if (kondisi.urlSimpan) URL.revokeObjectURL(kondisi.urlSimpan);
    kondisi.urlSimpan = URL.createObjectURL(h.blob);
    var a = document.createElement('a'); a.href = kondisi.urlSimpan; a.download = h.nama; document.body.appendChild(a); a.click(); a.remove();
    el['ekspor-petunjuk'].textContent = 'Video dikirim ke unduhan Chrome (folder Download). Cek notifikasi unduhan.';
  }
  async function bagikan() {
    var h = kondisi.hasil; if (!h) return;
    try {
      var f = new File([h.blob], h.nama, { type: h.mime });
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'Video SHORTLY' });
      else el['ekspor-petunjuk'].textContent = 'Browser tidak bisa membagikan file ini. Pakai tombol Simpan video.';
    } catch (e) { if (!e || e.name !== 'AbortError') el['ekspor-petunjuk'].textContent = 'Gagal membagikan: ' + ((e && e.message) || e) + '. Pakai tombol Simpan video.'; }
  }

  /* ---------- pasang ---------- */
  bangunPanel();
  tombol.addEventListener('click', function () { if (kondisi.jalan) return; hentikanPemutar(); tampil('pilih'); });
  el['panel-ekspor'].addEventListener('click', function (ev) {
    var t = ev.target.closest && ev.target.closest('[data-mutu]');
    if (t) {
      kondisi.mutu = t.getAttribute('data-mutu');
      el['panel-ekspor'].querySelectorAll('.ekspor-opsi').forEach(function (b) { var a = b === t; b.classList.toggle('aktif', a); b.setAttribute('aria-checked', a); });
    }
  });
  $('ekspor-mulai').addEventListener('click', function () { jalankan('utama'); });
  $('ekspor-cadangan').addEventListener('click', function () { jalankan('cadangan'); });
  $('ekspor-batal').addEventListener('click', function () { kondisi.batal = true; lapor(undefined, 'Membatalkan…'); });
  $('ekspor-simpan').addEventListener('click', simpan);
  $('ekspor-bagikan').addEventListener('click', bagikan);
  $('ekspor-ulang').addEventListener('click', function () { tampil('pilih'); });
  ['ekspor-tutup1', 'ekspor-tutup2', 'ekspor-tutup3'].forEach(function (id) { $(id).addEventListener('click', tutupPanel); });
  $('ekspor-cek').addEventListener('click', async function () {
    var d = el['ekspor-diag']; d.hidden = false; d.textContent = 'Memeriksa…'; d.textContent = await cekDukungan();
  });
  window.SHORTLY_EKSPOR = { jalankan: jalankan, cekDukungan: cekDukungan, kondisi: kondisi };
})();

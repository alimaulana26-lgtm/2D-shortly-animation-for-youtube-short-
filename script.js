/* ==========================================================
   SHORTLY - script.js (Tahap 2)
   Tugas file ini: membaca naskah dari scenes.js, lalu
   memutar adegan satu per satu. Isi cerita TIDAK ditulis di sini.
   Backup versi lama: backup-sebelum-tahap1/script.js
   ========================================================== */
(function () {
  var speech = document.getElementById('speech');
  var caption = document.getElementById('caption');
  var character = document.getElementById('character');
  var naskah = window.SHORTLY_NASKAH;

  // Pengaman: kalau scenes.js belum dimuat atau salah isi, beri pesan jelas.
  if (!naskah || !Array.isArray(naskah.adegan) || naskah.adegan.length === 0) {
    caption.textContent = 'scenes.js tidak ditemukan atau kosong.';
    return;
  }

  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  // Pindahkan karakter ke posisi awal TANPA animasi jalan.
  function resetPosisi() {
    character.classList.remove('walking');
    character.style.setProperty('--jalan', '0ms');
    character.style.setProperty('--x', naskah.posisiAwal);
    void character.offsetWidth; // paksa browser menerapkan posisi sekarang juga
  }

  // Karakter berjalan halus ke posisi baru.
  function jalanKe(posisi, ms) {
    character.style.setProperty('--jalan', ms + 'ms');
    character.style.setProperty('--x', posisi);
    character.classList.add('walking');
    later(function () { character.classList.remove('walking'); }, ms);
  }

  function tampilkanAdegan(adegan, posisiSebelumnya) {
    caption.textContent = adegan.teks;
    if (adegan.ucapan) {
      speech.textContent = adegan.ucapan;
      speech.classList.add('show');
    } else {
      speech.classList.remove('show');
    }
    if (adegan.posisi !== undefined && adegan.posisi !== posisiSebelumnya) {
      jalanKe(adegan.posisi, adegan.jalanMs || 900);
    }
  }

  function play() {
    clearTimers();
    speech.classList.remove('show');
    caption.textContent = naskah.teksAwal;
    resetPosisi();

    var waktu = 0;
    var posisi = naskah.posisiAwal;
    naskah.adegan.forEach(function (adegan) {
      var sebelumnya = posisi;
      later(function () { tampilkanAdegan(adegan, sebelumnya); }, waktu);
      if (adegan.posisi !== undefined) posisi = adegan.posisi;
      waktu += adegan.durasi;
    });
    later(function () { speech.classList.remove('show'); }, waktu);
  }

  function ulangi() {
    clearTimers();
    speech.classList.remove('show');
    caption.textContent = naskah.teksAwal;
    resetPosisi();
  }

  document.getElementById('play').addEventListener('click', play);
  document.getElementById('reset').addEventListener('click', ulangi);
  play();
})();

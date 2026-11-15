/* ==========================================================
   SHORTLY - ekspor/mp4.js
   Penyusun file MP4 sederhana (buatan sendiri, tanpa pustaka luar).
   Menerima potongan video H.264 dari WebCodecs (VideoEncoder) lalu
   menyusunnya menjadi satu file .mp4 (1 jalur video, tanpa audio).

   Cara pakai:
     var mp4 = new SHORTLY_MP4({ lebar: 720, tinggi: 1280, fps: 30, warna: 'bt709' });
     encoder callback:  mp4.tambah(chunk, metadata);
     selesai:           var blob = mp4.selesai();   // Blob 'video/mp4'
   ========================================================== */
(function (global) {
  'use strict';

  function u32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function u16(n) { return [(n >>> 8) & 255, n & 255]; }
  function teks(s) { var a = []; for (var i = 0; i < s.length; i++) a.push(s.charCodeAt(i) & 255); return a; }
  function nol(n) { return new Array(n).fill(0); }

  // box = [ukuran 4 byte][jenis 4 byte][isi...]
  function box(jenis) {
    var isi = Array.prototype.slice.call(arguments, 1), panjang = 8, i;
    for (i = 0; i < isi.length; i++) panjang += isi[i].length;
    var out = new Uint8Array(panjang);
    out.set(u32(panjang), 0); out.set(teks(jenis), 4);
    var o = 8;
    for (i = 0; i < isi.length; i++) { out.set(isi[i], o); o += isi[i].length; }
    return out;
  }
  function tabel32(daftar) {            // daftar angka -> byte 32-bit
    var out = new Uint8Array(daftar.length * 4);
    for (var i = 0; i < daftar.length; i++) {
      var n = daftar[i]; out[i * 4] = (n >>> 24) & 255; out[i * 4 + 1] = (n >>> 16) & 255; out[i * 4 + 2] = (n >>> 8) & 255; out[i * 4 + 3] = n & 255;
    }
    return out;
  }

  function PenyusunMP4(opsi) {
    this.lebar = opsi.lebar; this.tinggi = opsi.tinggi; this.fps = opsi.fps || 30;
    this.warna = opsi.warna || null;             // null = biarkan data video sendiri yang menentukan warna (disarankan); 'bt709' | 'bt601' = tambahkan keterangan warna
    this.skala = this.fps * 1000;                // satuan waktu jalur video
    this.potongan = [];                          // data tiap frame (Uint8Array)
    this.ukuran = []; this.kunci = []; this.waktu = [];
    this.avcC = null; this.totalByte = 0;
  }

  PenyusunMP4.prototype.tambah = function (chunk, meta) {
    if (!this.avcC) {
      var desc = meta && meta.decoderConfig && meta.decoderConfig.description;
      if (!desc) throw new Error('Encoder tidak memberi data konfigurasi H.264 (avcC). Format video tidak bisa disusun.');
      this.avcC = new Uint8Array(desc instanceof ArrayBuffer ? desc.slice(0) : new Uint8Array(desc.buffer, desc.byteOffset, desc.byteLength).slice());
    }
    var n = this.waktu.length;
    if (n > 0 && chunk.timestamp <= this.waktu[n - 1]) {
      throw new Error('Urutan frame dari encoder tidak berurutan (B-frame). File MP4 tidak bisa disusun dengan benar.');
    }
    var data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    this.potongan.push(data); this.ukuran.push(data.length);
    this.kunci.push(chunk.type === 'key'); this.waktu.push(chunk.timestamp);
    this.totalByte += data.length;
  };

  PenyusunMP4.prototype.jumlahFrame = function () { return this.waktu.length; };

  PenyusunMP4.prototype.selesai = function () {
    var N = this.potongan.length, i;
    if (N === 0) throw new Error('Tidak ada frame video yang berhasil dibuat.');
    if (!this.kunci[0]) throw new Error('Frame pertama bukan keyframe. File MP4 tidak valid.');
    if (this.totalByte > 4000000000) throw new Error('Ukuran video melebihi batas 4 GB.');
    var skala = this.skala;

    // ---- waktu tiap frame (DTS = PTS karena tanpa B-frame) ----
    var dts = this.waktu.map(function (t) { return Math.round(t * skala / 1e6); });
    var delta = [];
    for (i = 0; i < N - 1; i++) delta.push(Math.max(1, dts[i + 1] - dts[i]));
    delta.push(N > 1 ? delta[N - 2] : Math.round(skala / this.fps));
    var durasiSkala = 0; for (i = 0; i < N; i++) durasiSkala += delta[i];
    var durasiMs = Math.round(durasiSkala * 1000 / skala);
    var stts = [], mulai = 0;                      // stts diringkas: (jumlah, selisih)
    for (i = 1; i <= N; i++) {
      if (i === N || delta[i] !== delta[mulai]) { stts.push(i - mulai, delta[mulai]); mulai = i; }
    }

    // ---- ftyp ----
    var ftyp = box('ftyp', teks('isom'), u32(512), teks('isom'), teks('iso2'), teks('avc1'), teks('mp41'));
    var mdatAwal = ftyp.length + 8;                // data video dimulai setelah header mdat
    var offset = [], pos = mdatAwal;
    for (i = 0; i < N; i++) { offset.push(pos); pos += this.ukuran[i]; }
    var mdatHeader = new Uint8Array(8); mdatHeader.set(u32(this.totalByte + 8), 0); mdatHeader.set(teks('mdat'), 4);

    // ---- stbl ----
    var nama = nol(32), namaTeks = teks('SHORTLY'); nama[0] = namaTeks.length;
    for (i = 0; i < namaTeks.length; i++) nama[i + 1] = namaTeks[i];
    var avc1Isi = [].concat(nol(6), u16(1), nol(2), nol(2), nol(12), u16(this.lebar), u16(this.tinggi),
      u32(0x00480000), u32(0x00480000), nol(4), u16(1), nama, u16(0x0018), u16(0xFFFF));
    var avc1Anak = [box('avcC', this.avcC)];
    if (this.warna) {                               // keterangan warna (nclx) dengan rentang terbatas
      var kode = this.warna === 'bt601' ? 6 : 1;    // 1 = BT.709, 6 = BT.601 (SMPTE 170M)
      avc1Anak.push(box('colr', teks('nclx'), u16(kode), u16(kode), u16(kode), [0]));
    }
    var avc1 = box.apply(null, ['avc1', new Uint8Array(avc1Isi)].concat(avc1Anak));
    var stsd = box('stsd', u32(0), u32(1), avc1);
    var sttsB = box('stts', u32(0), u32(stts.length / 2), tabel32(stts));
    var kuncinya = []; for (i = 0; i < N; i++) if (this.kunci[i]) kuncinya.push(i + 1);
    var stss = box('stss', u32(0), u32(kuncinya.length), tabel32(kuncinya));
    var stsc = box('stsc', u32(0), u32(1), u32(1), u32(1), u32(1));
    var stsz = box('stsz', u32(0), u32(0), u32(N), tabel32(this.ukuran));
    var stco = box('stco', u32(0), u32(N), tabel32(offset));
    var stbl = box('stbl', stsd, sttsB, stss, stsc, stsz, stco);

    // ---- minf / mdia ----
    var vmhd = box('vmhd', u32(1), u16(0), nol(6));
    var dinf = box('dinf', box('dref', u32(0), u32(1), box('url ', u32(1))));
    var minf = box('minf', vmhd, dinf, stbl);
    var hdlr = box('hdlr', u32(0), u32(0), teks('vide'), nol(12), teks('VideoHandler'), [0]);
    var waktuMP4 = Math.floor(Date.now() / 1000) + 2082844800;      // detik sejak 1904
    var mdhd = box('mdhd', u32(0), u32(waktuMP4), u32(waktuMP4), u32(skala), u32(durasiSkala), u16(0x55C4), u16(0));
    var mdia = box('mdia', mdhd, hdlr, minf);

    // ---- trak ----
    var matriks = [].concat(u32(0x00010000), u32(0), u32(0), u32(0), u32(0x00010000), u32(0), u32(0), u32(0), u32(0x40000000));
    var tkhd = box('tkhd', u32(0x00000003), u32(waktuMP4), u32(waktuMP4), u32(1), u32(0), u32(durasiMs), nol(8),
      u16(0), u16(0), u16(0), u16(0), matriks, u32(this.lebar * 65536), u32(this.tinggi * 65536));
    var trak = box('trak', tkhd, mdia);

    // ---- moov ----
    var mvhd = box('mvhd', u32(0), u32(waktuMP4), u32(waktuMP4), u32(1000), u32(durasiMs), u32(0x00010000), u16(0x0100), nol(2),
      nol(8), matriks, nol(24), u32(2));
    var moov = box('moov', mvhd, trak);

    var bagian = [ftyp, mdatHeader].concat(this.potongan, [moov]);
    this.potongan = [];                              // lepaskan memori
    return new Blob(bagian, { type: 'video/mp4' });
  };

  global.SHORTLY_MP4 = PenyusunMP4;
})(typeof window !== 'undefined' ? window : globalThis);

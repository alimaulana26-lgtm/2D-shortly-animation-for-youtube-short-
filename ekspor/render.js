/* ==========================================================
   SHORTLY - ekspor/render.js
   Menggambar satu frame animasi SHORTLY ke kanvas pada waktu t (ms),
   meniru tampilan halaman (style.css) memakai Canvas 2D.
   Keadaan tiap frame datang dari ekspor/timeline.js.
   Semua ukuran memakai "satuan desain u" (panggung 430u x 764.4u).
   ========================================================== */
(function (global) {
  'use strict';
  var TL = global.SHORTLY_TL, IW = TL.IW, IH = TL.IH, SW = 430;     // SW = lebar panggung penuh (dipakai rumus posisi karakter)
  var C = { hitam: '#05070d', navyGelap: '#0a1630', navy: '#10224a', putih: '#ffffff', biru: '#2b7bff', biruTerang: '#6aa6ff' };
  var RIG = { berdiri: [45.8, 68.1], berjalan: [45.2, 65.7], menunjuk: [45.8, 68.8], menjelaskan: [46.6, 69.6], bereaksi: [47, 67] };
  var POSE_NAMA = ['berdiri', 'berjalan', 'menunjuk', 'menjelaskan', 'bereaksi'];
  var WAJAH_NAMA = ['senang', 'terkejut', 'bingung', 'serius'];
  var KAR = { x0: 0, y0: 0.26, w: 164, h: 299.48, bw: 164, bh: 300 };   // kotak karakter dan area gambar (object-fit: contain)

  function buatKanvas(w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  }
  function skala(ctx) { var m = ctx.getTransform(); return Math.hypot(m.a, m.b); }
  function rgba(r, g, b, a) { return 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + a + ')'; }
  function jalurKotak(ctx, x, y, w, h, r) {
    var a = typeof r === 'number' ? [r, r, r, r] : r;                       // [kiriAtas, kananAtas, kananBawah, kiriBawah]
    ctx.moveTo(x + a[0], y); ctx.lineTo(x + w - a[1], y); ctx.arcTo(x + w, y, x + w, y + a[1], a[1]);
    ctx.lineTo(x + w, y + h - a[2]); ctx.arcTo(x + w, y + h, x + w - a[2], y + h, a[2]);
    ctx.lineTo(x + a[3], y + h); ctx.arcTo(x, y + h, x, y + h - a[3], a[3]);
    ctx.lineTo(x, y + a[0]); ctx.arcTo(x, y, x + a[0], y, a[0]); ctx.closePath();
  }
  function lingkarJalur(ctx, x, y, w, h, r) { jalurKotak(ctx, x, y, w, h, r); }
  // kotak dengan latar (meluas sampai bawah garis tepi, seperti CSS), garis tepi, dan cahaya di luar kotak (box-shadow)
  function kotak(ctx, x, y, w, h, r, bg, bw, bc, glow) {
    var rad = typeof r === 'number' ? [r, r, r, r] : r, dalam = rad.map(function (v) { return Math.max(0, v - bw); });
    if (glow) {
      ctx.save(); ctx.beginPath(); ctx.rect(-1e5, -1e5, 2e5, 2e5); jalurKotak(ctx, x, y, w, h, rad); ctx.clip('evenodd');
      ctx.shadowColor = glow[0]; ctx.shadowBlur = glow[1] * skala(ctx); ctx.fillStyle = '#000';
      ctx.beginPath(); jalurKotak(ctx, x, y, w, h, rad); ctx.fill(); ctx.restore();
    }
    if (bg) { ctx.fillStyle = bg; ctx.beginPath(); jalurKotak(ctx, x, y, w, h, rad); ctx.fill(); }
    if (bw > 0) { ctx.fillStyle = bc; ctx.beginPath(); jalurKotak(ctx, x, y, w, h, rad); jalurKotak(ctx, x + bw, y + bw, w - 2 * bw, h - 2 * bw, dalam); ctx.fill('evenodd'); }
  }
  function elips(ctx, cx, cy, rx, ry, stops, kotakIsi) {                     // gradien radial berbentuk elips
    ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    ctx.fillStyle = g; var k = kotakIsi || [-1, -1, 2, 2]; ctx.fillRect(k[0], k[1], k[2], k[3]); ctx.restore();
  }
  function teksCahaya(ctx, teks, x, y, bayangan, rapat) {                    // teks dengan text-shadow (bayangan terakhir digambar dulu)
    var i, s = skala(ctx);
    for (i = bayangan.length - 1; i >= 0; i--) { ctx.save(); ctx.shadowColor = bayangan[i][1]; ctx.shadowBlur = bayangan[i][0] * s; ctx.fillText(teks, x, y); ctx.restore(); }
    ctx.fillText(teks, x, y);
  }
  function setFont(ctx, font, rapat) { ctx.font = font; if ('letterSpacing' in ctx) ctx.letterSpacing = (rapat || 0) + 'px'; }
  function lebarTeks(ctx, teks, font, rapat) { ctx.save(); setFont(ctx, font, rapat); var w = ctx.measureText(teks).width; ctx.restore(); return w; }
  function barisTeks(ctx, teks, font, maksLebar) {
    ctx.save(); setFont(ctx, font, 0);
    var kata = teks.split(' '), baris = [], cur = '', i, t;
    for (i = 0; i < kata.length; i++) {
      t = cur ? cur + ' ' + kata[i] : kata[i];
      if (ctx.measureText(t).width > maksLebar && cur) { baris.push(cur); cur = kata[i]; } else cur = t;
    }
    if (cur) baris.push(cur); ctx.restore(); return baris;
  }
  function garisDasar(ctx, top, lineH, font) {                               // posisi baseline teks dalam kotak baris CSS
    ctx.save(); ctx.font = font; var m = ctx.measureText('Hg'), A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent; ctx.restore();
    if (!(A > 0)) { return top + lineH * 0.78; }
    return top + (lineH - (A + D)) / 2 + A;
  }

  /* ==========================================================
     Pembuat renderer
     ========================================================== */
  function buat(opsi) {
    var W = opsi.lebar, Hh = opsi.tinggi, TLs = opsi.tl, gambar = opsi.gambar, skyRect = opsi.skyline || [];
    var sx = W / IW, sy = Hh / IH, Q = opsi.supersample || 1.5;
    var ctxUkur = buatKanvas(8, 8).getContext('2d');
    var cache = { teks: {}, lapisan: {} };

    function lapisanStatis(kode) {                                            // kode: 'A' | 'B' | 'Bsorot'
      if (cache.lapisan[kode]) return cache.lapisan[kode];
      var c = buatKanvas(IW * sx * Q, IH * sy * Q), x = c.getContext('2d'); x.scale(sx * Q, sy * Q);
      x.imageSmoothingQuality = 'high';
      if (kode === 'A') {
        var g = x.createLinearGradient(0, 0, 0, IH);                           // langit
        g.addColorStop(0, C.hitam); g.addColorStop(0.42, C.navyGelap); g.addColorStop(0.72, C.navy); g.addColorStop(1, C.navyGelap);
        x.fillStyle = g; x.fillRect(0, 0, IW, IH);
        elips(x, IW / 2, -0.08 * IH + 0.26 * IH, 0.65 * IW, 0.26 * IH,         // cahaya biru dari atas
          [[0, rgba(43, 123, 255, 0.5)], [0.6, rgba(43, 123, 255, 0.14)], [1, rgba(43, 123, 255, 0)]], [-1, -1, 2, 2]);
      } else {
        // siluet kota (SVG diregangkan: lebar penuh, tinggi 260u)
        var topKota = IH - 254 - 260, i, r;
        for (i = 0; i < skyRect.length; i++) {
          r = skyRect[i]; x.globalAlpha = r.opacity; x.fillStyle = r.fill; x.fillRect(r.x * IW / 430, topKota + r.y, r.w * IW / 430, r.h);
        }
        x.globalAlpha = 1;
        // toko
        var sxp = 0.07 * IW, sw = 0.5 * IW, sh = 225, sb = IH - 254, st = sb - sh, bw = 3, rad = [8, 8, 0, 0];
        var glow = kode === 'Bsorot' ? [rgba(106, 166, 255, 0.8), 34] : [rgba(43, 123, 255, 0.45), 22];
        var bg = x.createLinearGradient(0, st + bw, 0, sb - bw); bg.addColorStop(0, '#0d1b3d'); bg.addColorStop(1, '#091329');
        kotak(x, sxp, st, sw, sh, rad, bg, bw, C.biru, glow);
        var ax = sxp + bw, ay = st + bw, aw = sw - 2 * bw;                       // kanopi bergaris
        x.save(); x.beginPath(); jalurKotak(x, ax, ay, aw, 48, [5, 5, 0, 0]); x.clip();
        for (i = 0; i * 28 < aw; i++) { x.fillStyle = i % 2 ? '#142a5c' : '#0b1836'; x.fillRect(ax + i * 28, ay, 28, 48); }
        x.fillStyle = C.biru; x.fillRect(ax, ay + 45, aw, 3); x.restore();
        x.save(); x.fillStyle = C.putih; x.textAlign = 'center'; setFont(x, 'bold 16px Arial', 0.96);
        teksCahaya(x, 'TOKO MINI', ax + aw / 2, garisDasar(x, ay + 13, 16 * 1.149, 'bold 16px Arial'), [[10, C.biru], [3, C.biruTerang]]); x.restore();
        var wx = ax + (aw - 0.8 * aw) / 2, wy = ay + 48 + 25, ww = 0.8 * aw, wh = 105;   // jendela toko
        x.save(); x.beginPath(); jalurKotak(x, wx, wy, ww, wh, 0); x.clip();
        x.fillStyle = C.biruTerang; x.fillRect(wx, wy, ww, wh);
        var ig = { x: wx + 3, y: wy + 3, w: ww - 6, h: wh - 6 }, cr = Math.sqrt(Math.pow(ig.w / 2, 2) + Math.pow(0.6 * ig.h, 2));
        x.fillStyle = C.navyGelap; x.fillRect(ig.x, ig.y, ig.w, ig.h);
        elips(x, ig.x + ig.w / 2, ig.y + 0.4 * ig.h, cr, cr, [[0, rgba(106, 166, 255, 0.55)], [1, rgba(43, 123, 255, 0.18)]], [-1, -1, 2, 2]);
        x.restore();
        // lantai
        var gy = IH - 258, gh = 258, gg = x.createLinearGradient(0, gy + 2, 0, IH); gg.addColorStop(0, C.navyGelap); gg.addColorStop(1, C.hitam);
        x.save(); x.beginPath(); x.rect(-1e4, -1e4, 2e4, 2e4); x.rect(0, gy, IW, gh); x.clip('evenodd');
        x.shadowColor = rgba(43, 123, 255, 0.35); x.shadowBlur = 24 * sx * Q; x.shadowOffsetY = -6 * sy * Q; x.fillStyle = '#000'; x.fillRect(0, gy, IW, gh); x.restore();
        x.fillStyle = C.biruTerang; x.fillRect(0, gy, IW, 2);
        x.fillStyle = gg; x.fillRect(0, gy + 2, IW, gh - 2);
        elips(x, IW / 2, gy + 2, 0.6 * Math.SQRT2 * IW / 2, 0.6 * Math.SQRT2 * (gh - 2),
          [[0, rgba(43, 123, 255, 0.35)], [1, rgba(43, 123, 255, 0)]], [-1, 0, 2, 1]);
      }
      return (cache.lapisan[kode] = c);
    }
    function spriteSinar() {
      if (cache.sinar) return cache.sinar;
      var w = 0.34 * IW, h = 0.8 * IH, k = Math.max(sx, sy) * 1.2, c = buatKanvas(w * k, h * k), x = c.getContext('2d'); x.scale(k, k);
      var g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, rgba(106, 166, 255, 0)); g.addColorStop(0.5, rgba(106, 166, 255, 0.2)); g.addColorStop(1, rgba(106, 166, 255, 0));
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-in'; var m = x.createLinearGradient(0, 0, 0, h); m.addColorStop(0, '#000'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, w, h);
      return (cache.sinar = { c: c, w: w, h: h });
    }
    function gambarSinar(ctx, t) {
      var s = spriteSinar(), IO = TL.EASE['ease-in-out'];
      [{ kiri: 0.08 * IW, rot: 14, tunda: 0 }, { kiri: IW - 0.02 * IW - s.w, rot: -16, tunda: 4000 }].forEach(function (b) {
        var p = ((t + b.tunda) / 9000) % 2; if (p > 1) p = 2 - p; var v = IO(p);
        ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * v; ctx.translate(-10 + 20 * v, 0);
        ctx.translate(b.kiri + s.w / 2, -0.05 * IH + s.h / 2); ctx.rotate(b.rot * Math.PI / 180); ctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h); ctx.restore();
      });
    }
    var EMOJI = ['🥤', '🥛', '🧃'];
    function gambarEmoji(ctx, toko) {
      var sxp = 0.07 * IW, aw = 0.5 * IW - 6, ww = 0.8 * aw, wx = sxp + 3 + (aw - ww) / 2, wy = IH - 254 - 225 + 3 + 48 + 25, ing = ww - 6;
      var f = '27px Arial', lw = EMOJI.map(function (e) { return lebarTeks(ctxUkur, e, f, 0); }), tot = lw[0] + lw[1] + lw[2], gap = (ing - tot) / 3;
      var cx = wx + 3 + gap / 2, cy = wy + 3 + (105 - 6) / 2, IO = TL.EASE['ease-in-out'];
      ctx.save(); setFont(ctx, f, 0); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      EMOJI.forEach(function (e, i) {
        var dy = 0, sc = 1;
        if (toko.sorot) { var lok = toko.t - i * 150; if (lok >= 0) { var v = TL.kf([[0, [0, 1]], [0.4, [-14, 1.15]], [1, [0, 1]]], (lok / 700) % 1, IO); dy = v[0]; sc = v[1]; } }
        ctx.save(); ctx.translate(cx + lw[i] / 2, cy + dy); ctx.scale(sc, sc); ctx.fillText(e, -lw[i] / 2, 1); ctx.restore();
        cx += lw[i] + gap;
      });
      ctx.restore();
    }

    /* ---------- kartu harga ---------- */
    function gambarKartu(ctx, k) {
      var a = TL.ukurKartu(k.label, k.harga), l = a.l, t = a.t, w = a.w, h = a.h, rot = 3, sc = 1, op = 1, glowW = rgba(43, 123, 255, 0.55), glowB = 18, IO = TL.EASE['ease-in-out'], v;
      if (k.aksi === 'pop' && k.aksiT < 600) { var e = TL.EASE.kartuPop(k.aksiT / 600); sc = 0.3 + 0.7 * e; op = Math.min(1, Math.max(0, e)); }
      else if (k.aksi === 'sorot') {
        v = TL.kf([[0, [3, 1, 43, 123, 255, 0.55, 18]], [0.5, [3, 1.08, 106, 166, 255, 0.95, 34]], [1, [3, 1, 43, 123, 255, 0.55, 18]]], (k.aksiT / 1100) % 1, IO);
        rot = v[0]; sc = v[1]; glowW = rgba(v[2], v[3], v[4], v[5]); glowB = v[6];
      } else if (k.aksi === 'goyang' && k.aksiT < 1200) {
        v = TL.kf([[0, [3, 1]], [0.25, [-6, 1.06]], [0.75, [10, 1.06]], [1, [3, 1]]], (k.aksiT / 600) % 1, IO); rot = v[0]; sc = v[1];
      }
      var alfa = op * k.vis; if (alfa <= 0.002) return;
      ctx.save(); ctx.globalAlpha = alfa; ctx.translate(l + w / 2, t + h / 2); ctx.rotate(rot * Math.PI / 180); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
      kotak(ctx, 0, 0, w, h, 12, 'rgba(10,22,48,0.82)', 2, C.biru, [glowW, glowB]);
      ctx.textAlign = 'center'; var f1 = 'bold 9px Arial', f2 = 'bold 24px Arial';
      ctx.fillStyle = C.biruTerang; setFont(ctx, f1, 0); ctx.fillText(k.label, w / 2, garisDasar(ctx, 14, 9 * 1.149, f1));
      ctx.fillStyle = C.putih; setFont(ctx, f2, 0); ctx.fillText(k.harga, w / 2, garisDasar(ctx, 14 + 9 * 1.149, 24 * 1.149, f2));
      ctx.restore();
    }

    /* ---------- karakter ---------- */
    function terap(ctx, ox, oy, a) {                                         // transform [tx,ty,rot,sx,sy] terhadap titik asal (ox,oy)
      ctx.translate(ox + a[0], oy + a[1]); ctx.rotate(a[2] * Math.PI / 180); ctx.scale(a[3], a[4]); ctx.translate(-ox, -oy);
    }
    function gambarKarakter(ctx, s) {
      var xPx = SW * s.x / 100, bl = xPx - 82, bt = IH - 236 - 300;
      ctx.save(); ctx.translate(bl, bt + s.bobY);
      elips(ctx, 82, 24 + 170, 125, 170, [[0, rgba(43, 123, 255, 0.6)], [0.55, rgba(43, 123, 255, 0.2)], [0.8, rgba(43, 123, 255, 0)], [1, rgba(43, 123, 255, 0)]]);
      if (!s.wajah) {                                                        // bayangan di lantai
        var b = s.bayangan; ctx.save(); ctx.globalAlpha = b[2]; ctx.translate(27 + 55, 290 + 8); ctx.scale(b[0], b[1]);
        ctx.shadowColor = rgba(43, 123, 255, 0.55); ctx.shadowBlur = 14 * skala(ctx); ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath(); ctx.ellipse(0, 0, 55, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      if (s.wajah) {
        var nm = s.ekspresi === 'berpikir' ? 'bingung' : (s.ekspresi || 'senang'), img = gambar.wajah[nm], bw = 200, bh = 200 * img.naturalHeight / img.naturalWidth;
        ctx.save(); terap(ctx, 82, -18 + bh, s.bust); ctx.drawImage(img, 82 - bw / 2, -18, bw, bh); ctx.restore();
      } else {
        var rig = RIG[s.pose], neck = rig[0] / 100 * 300, hem = rig[1] / 100 * 300, im = gambar.pose[s.pose];
        ctx.save(); terap(ctx, 82, 300, s.tubuh); ctx.translate(82, 150); ctx.scale(s.balik, 1); ctx.translate(-82, -150);
        [['kaki', hem - 0.016 * 300, 300, 'kaki', hem], ['badan', neck - 0.014 * 300, hem, 'badan', hem], ['kepala', 0, neck, 'kepala', neck]].forEach(function (L) {
          ctx.save(); terap(ctx, 82, L[4], s[L[3]]); ctx.beginPath(); ctx.rect(-5, L[1], KAR.bw + 10, L[2] - L[1]); ctx.clip();
          ctx.drawImage(im, KAR.x0, KAR.y0, KAR.w, KAR.h); ctx.restore();
        });
        ctx.restore();
      }
      // ikon ekspresi
      var ik = s.ikon;
      if (ik.o > 0.003 && ik.text) {
        var fs = s.wajah ? 44 : 34, fk = '900 ' + fs + 'px Arial', iw = lebarTeks(ctxUkur, ik.text, fk, 0), px = s.wajah ? 166 : 136, py = s.wajah ? 6 : 28;
        ctx.save(); ctx.globalAlpha = Math.min(1, Math.max(0, ik.o)); ctx.translate(px + iw / 2, py + fs / 2);
        var sc = 0.3 + 0.7 * ik.p; ctx.rotate(-14 * (1 - ik.p) * Math.PI / 180); ctx.scale(sc, sc);
        ctx.fillStyle = C.putih; setFont(ctx, fk, 0); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        teksCahaya(ctx, ik.text, 0, 1, [[12, C.biru], [4, C.biruTerang]]); ctx.restore();
      }
      // gelembung ucapan
      var sp = s.speech;
      if (sp.v > 0.003 && sp.text) {
        var f = 'bold 17px Arial', lines = barisTeks(ctxUkur, sp.text, f, 180), mw = 0, i;
        lines.forEach(function (ln) { mw = Math.max(mw, lebarTeks(ctxUkur, ln, f, 0)); });
        var bw2 = lines.length > 1 || mw > 180 ? 215 : mw + 35, bh2 = lines.length * 17 * 1.2 + 25, v = sp.v;
        ctx.save(); ctx.globalAlpha = Math.min(1, v);
        ctx.translate(82, -sp.bottom); ctx.translate(0, 6 * (1 - v)); ctx.scale(0.85 + 0.15 * v, 0.85 + 0.15 * v); ctx.translate(-bw2 / 2, -bh2);
        kotak(ctx, 0, 0, bw2, bh2, 16, C.putih, 2.5, C.biru, [rgba(43, 123, 255, 0.7), 16]);
        ctx.fillStyle = C.navyGelap; ctx.textAlign = 'center'; setFont(ctx, f, 0);
        for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], bw2 / 2, garisDasar(ctx, 12.5 + i * 20.4, 20.4, f));
        ctx.save(); ctx.translate(bw2 / 2, bh2 - 8 + 7); ctx.rotate(Math.PI / 4);                  // ekor gelembung
        ctx.fillStyle = C.putih; ctx.fillRect(-7, -7, 14, 14); ctx.fillStyle = C.biru; ctx.fillRect(4.5, -7, 2.5, 14); ctx.fillRect(-7, 4.5, 14, 2.5); ctx.restore();
        ctx.restore();
      }
      ctx.restore();
    }

    /* ---------- lapisan di atas kamera: logo, subtitle ---------- */
    function bitmapLogo() {
      if (cache.logo) return cache.logo;
      var RW = 240, RH = 100, c = buatKanvas(RW * sx, RH * sy), x = c.getContext('2d'); x.scale(sx, sy);       // hanya area pojok kiri atas
      var fS = 'italic 900 30px "Arial Black", Impact, Arial, sans-serif', fK = 'bold 11px Arial', wS = lebarTeks(x, 'SHORTLY', fS, -0.6), wK = lebarTeks(x, 'Belajar • Tahu • Jadi Pintar', fK, 0);
      var lw = Math.max(wS, wK), L = 18, T = 18;
      x.fillStyle = C.putih; x.textAlign = 'left'; setFont(x, fS, -0.6);
      teksCahaya(x, 'SHORTLY', L, garisDasar(x, T, 30, fS), [[14, rgba(43, 123, 255, 0.8)]]);
      var bx = L, by = T + 30 + 3, bw = 0.78 * lw, bh = 4;                    // garis biru miring
      x.save(); x.translate(bx + bw / 2, by + bh / 2); x.transform(1, 0, Math.tan(-24 * Math.PI / 180), 1, 0, 0); x.translate(-bw / 2, -bh / 2);
      x.shadowColor = C.biru; x.shadowBlur = 10 * skala(x); x.fillStyle = C.biru; x.beginPath(); jalurKotak(x, 0, 0, bw, bh, 3); x.fill(); x.restore();
      x.fillStyle = C.biruTerang; setFont(x, fK, 0); x.fillText('Belajar • Tahu • Jadi Pintar', L, garisDasar(x, T + 37 + 6, 11, fK));
      return (cache.logo = { c: c, x: 0, y: 0 });
    }
    function bitmapCaption(teks) {
      if (cache.teks[teks]) return cache.teks[teks];
      var f = 'bold 20px Arial', bw = 0.9 * IW, bl = 0.05 * IW, lines = barisTeks(ctxUkur, teks, f, bw - 31), bh = Math.max(84, lines.length * 26 + 31), by = IH - 80 - bh, i;
      var P = 34, x0 = bl - P, y0 = by - P, RW = bw + 2 * P, RH = bh + 2 * P;                              // hanya area kotak subtitle + ruang cahaya
      var c = buatKanvas(RW * sx, RH * sy), x = c.getContext('2d'); x.scale(sx, sy); x.translate(-x0, -y0);
      kotak(x, bl, by, bw, bh, 14, 'rgba(5,7,13,0.96)', 1.5, 'rgba(106,166,255,0.55)', [rgba(43, 123, 255, 0.4), 16]);
      x.fillStyle = C.putih; x.textAlign = 'center'; setFont(x, f, 0);
      var tot = lines.length * 26, y0t = by + (bh - tot) / 2;
      for (i = 0; i < lines.length; i++) { x.save(); x.shadowColor = '#000'; x.shadowBlur = 3 * skala(x); x.shadowOffsetY = 1 * skala(x); x.fillText(lines[i], bl + bw / 2, garisDasar(x, y0t + i * 26, 26, f)); x.restore(); }
      return (cache.teks[teks] = { c: c, x: x0, y: y0 });
    }

    /* ---------- satu frame ---------- */
    function frame(ctx, t) {
      var s = TLs.keadaan(t);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, Hh); ctx.imageSmoothingQuality = 'high';
      ctx.scale(sx, sy);
      // kamera
      ctx.save(); ctx.translate(s.cam.tx * IW / 100, s.cam.ty * IH / 100); ctx.scale(s.cam.z, s.cam.z);
      ctx.drawImage(lapisanStatis('A'), 0, 0, IW, IH);
      gambarSinar(ctx, t);
      ctx.drawImage(lapisanStatis(s.toko.sorot ? 'Bsorot' : 'B'), 0, 0, IW, IH);
      gambarEmoji(ctx, s.toko);
      gambarKarakter(ctx, s);
      gambarKartu(ctx, s.kartu);
      ctx.restore();
      // vignette
      elips(ctx, IW / 2, 0.55 * IH, Math.SQRT2 * IW / 2, Math.SQRT2 * 0.55 * IH, [[0, 'rgba(0,0,0,0)'], [0.52, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.6)']], [-3, -3, 6, 6]);
      // logo + subtitle (tanpa kamera), fade, kilat
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); var bl = bitmapLogo(), bc = bitmapCaption(s.caption);
      ctx.drawImage(bl.c, Math.round(bl.x * sx), Math.round(bl.y * sy)); ctx.drawImage(bc.c, Math.round(bc.x * sx), Math.round(bc.y * sy)); ctx.restore();
      if (s.fade > 0.002) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, s.fade) + ')'; ctx.fillRect(0, 0, IW, IH); }
      if (s.flash > 0.002) {
        var r = Math.sqrt(Math.pow(IW / 2, 2) + Math.pow(0.55 * IH, 2)), g = ctx.createRadialGradient(IW / 2, 0.45 * IH, 0, IW / 2, 0.45 * IH, r);
        g.addColorStop(0, '#fff'); g.addColorStop(0.45, C.biruTerang); g.addColorStop(1, 'rgba(43,123,255,0.4)');
        ctx.save(); ctx.globalAlpha = s.flash; ctx.fillStyle = g; ctx.fillRect(0, 0, IW, IH); ctx.restore();
      }
      ctx.restore();
    }
    function siapkan() { lapisanStatis('A'); lapisanStatis('B'); spriteSinar(); bitmapLogo(); }
    function tutup() { cache = { teks: {}, lapisan: {} }; }
    return { frame: frame, siapkan: siapkan, tutup: tutup, lebar: W, tinggi: Hh };
  }

  function muatGambar(dasar) {                                               // memuat semua gambar pose dan wajah
    var hasil = { pose: {}, wajah: {} }, janji = [];
    function muat(grup, nama, url) {
      janji.push(new Promise(function (ok, gagal) {
        var im = new Image(); im.onload = function () { (im.decode ? im.decode() : Promise.resolve()).then(function () { hasil[grup][nama] = im; ok(); }, function () { hasil[grup][nama] = im; ok(); }); };
        im.onerror = function () { gagal(new Error('Gambar gagal dimuat: ' + url)); }; im.src = url;
      }));
    }
    POSE_NAMA.forEach(function (n) { muat('pose', n, dasar + 'pose-' + n + '.webp'); });
    WAJAH_NAMA.forEach(function (n) { muat('wajah', n, dasar + 'wajah-' + n + '.webp'); });
    return Promise.all(janji).then(function () { return hasil; });
  }
  function bacaSiluet() {                                                    // data kotak siluet kota dari index.html
    var out = []; document.querySelectorAll('.skyline rect').forEach(function (r) {
      out.push({ x: +r.getAttribute('x'), y: +r.getAttribute('y'), w: +r.getAttribute('width'), h: +r.getAttribute('height'), fill: r.getAttribute('fill'), opacity: r.getAttribute('opacity') === null ? 1 : +r.getAttribute('opacity') });
    }); return out;
  }
  global.SHORTLY_RENDER = { buat: buat, muatGambar: muatGambar, bacaSiluet: bacaSiluet };
})(typeof window !== 'undefined' ? window : globalThis);

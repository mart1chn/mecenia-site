'use strict';
/* Lecture des dimensions (PNG, JPEG, WebP, SVG) pour poser width/height et éviter les sauts de mise en page. */
const fs = require('fs');
const path = require('path');
const { DIST } = require('./util');

function dims(file) {
  let b;
  try { b = fs.readFileSync(file); } catch (e) { return null; }
  const ext = path.extname(file).toLowerCase();
  try {
    if (ext === '.png') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (ext === '.jpg' || ext === '.jpeg') {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
    if (ext === '.webp') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    }
    if (ext === '.svg') {
      const s = b.toString('utf8', 0, 2000);
      const vb = s.match(/viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
      if (vb) return { w: Math.round(+vb[1]), h: Math.round(+vb[2]) };
      const w = s.match(/\swidth="([\d.]+)/), h = s.match(/\sheight="([\d.]+)/);
      if (w && h) return { w: Math.round(+w[1]), h: Math.round(+h[1]) };
    }
  } catch (e) { /* dimensions inconnues */ }
  return null;
}

/** Ajoute width/height aux <img> locales qui n'en ont pas. */
function addDims(html) {
  return html.replace(/<img\b([^>]*?)\ssrc="(\/assets\/[^"]+)"([^>]*)>/g, (m, a, src, c) => {
    if (/\swidth=/.test(a + c)) return m;
    const d = dims(path.join(DIST, decodeURIComponent(src.split('?')[0])));
    return d ? `<img${a} src="${src}"${c} width="${d.w}" height="${d.h}">` : m;
  });
}

module.exports = { dims, addDims };

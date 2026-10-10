'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const write = (file, data) => { ensureDir(path.dirname(file)); fs.writeFileSync(file, data); };
const copyDir = (from, to) => { if (exists(from)) fs.cpSync(from, to, { recursive: true }); };

/** Chemin public d'une page ("/a-propos/") → fichier dans dist. */
const outFile = (urlPath) => {
  if (urlPath.endsWith('.html')) return path.join(DIST, urlPath);
  return path.join(DIST, urlPath, 'index.html');
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const roman = (n) => ROMAN[n - 1] || String(n);

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const parseDate = (v) => {
  if (v instanceof Date) return v;
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
};
const fmtDate = (d) => (d ? `${d.getUTCDate() === 1 ? '1er' : d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : '');
const isoDate = (d) => (d ? d.toISOString().slice(0, 10) : '');

const isExternal = (u) => /^https?:\/\//i.test(u || '');
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = { ROOT, DIST, esc, read, exists, ensureDir, write, copyDir, outFile, roman, fmtDate, isoDate, parseDate, isExternal, slugify };

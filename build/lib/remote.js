'use strict';
/* Rapatrie localement les images Wikimedia au moment du build (Netlify a accès à Internet).
   Si le téléchargement échoue (hors ligne, indisponibilité), l'adresse d'origine est conservée : rien ne casse. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, DIST, ensureDir, esc } = require('./util');

const CACHE = path.join(ROOT, '.cache', 'remote-images');
const UA = 'MeceniaSiteBuilder/1.0 (https://www.mecenia.org; contact@mecenia.org)';
const WIKI = /https:\/\/(?:upload\.wikimedia\.org\/[^\s"'<>]+|commons\.wikimedia\.org\/wiki\/Special:Redirect\/file\/[^\s"'<>]+)/g;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif' };

function balance(u) {
  while (u.endsWith(')') && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) u = u.slice(0, -1);
  return u.replace(/[.,;]+$/, '');
}

const collect = (texts) => {
  const set = new Set();
  for (const t of texts) for (const m of String(t).matchAll(WIKI)) set.add(balance(m[0]));
  return [...set];
};

const withWidth = (u) => (/Special:Redirect\/file\//.test(u) && !/[?&]width=/.test(u) ? u + (u.includes('?') ? '&' : '?') + 'width=1400' : u);

async function fetchOne(url) {
  const key = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  ensureDir(CACHE);
  const hit = fs.readdirSync(CACHE).find((f) => f.startsWith(key + '.'));
  if (hit) return { key, file: path.join(CACHE, hit), name: hit };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(withWidth(url), { headers: { 'User-Agent': UA }, signal: ctl.signal, redirect: 'follow' });
    if (!res.ok) return null;
    const ext = EXT[(res.headers.get('content-type') || '').split(';')[0]];
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500 || buf.length > 6 * 1024 * 1024) return null;
    const name = `${key}.${ext}`;
    fs.writeFileSync(path.join(CACHE, name), buf);
    return { key, file: path.join(CACHE, name), name };
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Retourne une Map adresse d'origine → /assets/img/remote/xxxx.ext (seulement pour les téléchargements réussis). */
async function localize(texts) {
  const urls = collect(texts);
  const map = new Map();
  if (process.env.MECENIA_NO_FETCH === '1' || !urls.length) return { map, urls, ok: 0 };
  const queue = urls.slice();
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const u = queue.shift();
      const r = await fetchOne(u);
      if (r) {
        ensureDir(path.join(DIST, 'assets', 'img', 'remote'));
        fs.copyFileSync(r.file, path.join(DIST, 'assets', 'img', 'remote', r.name));
        map.set(u, '/assets/img/remote/' + r.name);
      }
    }
  });
  await Promise.all(workers);
  return { map, urls, ok: map.size };
}

/** Remplace dans le HTML final les adresses distantes par les copies locales. */
function rewrite(html, map) {
  let out = html;
  for (const [u, local] of map) out = out.split(esc(u)).join(local).split(u).join(local);
  return out;
}

module.exports = { localize, rewrite, collect };

'use strict';
/* Construit la feuille de style, le script et les polices avec empreinte (cache longue durée sans risque). */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, DIST, read, write, ensureDir } = require('./util');

const hash = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);

const minCss = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();

function build() {
  const out = {};
  // Polices : copie avec empreinte
  const fonts = {};
  const fdir = path.join(ROOT, 'src', 'fonts');
  ensureDir(path.join(DIST, 'assets', 'fonts'));
  for (const f of fs.readdirSync(fdir)) {
    if (!f.endsWith('.woff')) continue;
    const buf = fs.readFileSync(path.join(fdir, f));
    const name = f.replace('.woff', `.${hash(buf)}.woff`);
    fs.writeFileSync(path.join(DIST, 'assets', 'fonts', name), buf);
    fonts[f.replace('.woff', '')] = `/assets/fonts/${name}`;
  }
  out.fonts = fonts;
  // CSS
  const cdir = path.join(ROOT, 'src', 'css');
  let css = fs.readdirSync(cdir).filter((f) => f.endsWith('.css')).sort().map((f) => read(path.join(cdir, f))).join('\n');
  css = css.replace(/\{\{font:([\w-]+)\}\}/g, (m, k) => fonts[k] || '');
  css = minCss(css);
  const cname = `site.${hash(css)}.css`;
  write(path.join(DIST, 'assets', 'css', cname), css);
  out.css = `/assets/css/${cname}`;
  // JS
  const jdir = path.join(ROOT, 'src', 'js');
  const js = fs.readdirSync(jdir).filter((f) => f.endsWith('.js')).sort().map((f) => read(path.join(jdir, f))).join('\n');
  const jname = `site.${hash(js)}.js`;
  write(path.join(DIST, 'assets', 'js', jname), js);
  out.js = `/assets/js/${jname}`;
  return out;
}

module.exports = { build };

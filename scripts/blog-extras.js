'use strict';
/* Blog : thématiques et types d'articles (filtres en bulles), étiquettes, et mise en page « magazine » par blocs.
   Dernière étape du build. Ne fait jamais échouer le build. */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), OUT = path.join(ROOT, 'dist'), DIR = path.join(ROOT, 'content', 'blog');
let yaml = null;
try { yaml = require('js-yaml'); } catch (e) { console.warn('Blog : js-yaml absent, les blocs de mise en page ne seront pas affichés.'); }
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unq = v => ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'")) ? v.slice(1, -1) : v;
function simple(raw) {
  const d = {}; let key = null;
  raw.split(/\r?\n/).forEach(l => {
    let x = l.match(/^([\w-]+):\s*(.*)$/);
    if (x) { key = x[1]; const v = x[2].trim(); if (!v) { d[key] = []; return; } if (v[0] === '[') { try { d[key] = JSON.parse(v); return; } catch (e) {} } d[key] = unq(v); return; }
    x = l.match(/^\s+-\s+(.*)$/);
    if (x && key && Array.isArray(d[key])) d[key].push(unq(x[1].trim()));
  });
  return d;
}
function parse(raw) {
  const m = raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { d: {}, body: raw };
  let d; try { d = yaml ? (yaml.load(m[1]) || {}) : simple(m[1]); } catch (e) { d = simple(m[1]); }
  return { d, body: m[2] };
}
const list = v => Array.isArray(v) ? v.filter(Boolean).map(String) : (v ? [String(v)] : []);
function inline(t) { return esc(t).replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>'); }
function markdown(src) { const l = String(src || '').replace(/\r/g, '').split('\n'), o = []; let i = 0; while (i < l.length) { if (!l[i].trim()) { i++; continue; } let m; if ((m = l[i].match(/^(#{1,6})\s+(.*)$/))) { o.push('<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'); i++; continue; } if (/^[-*+]\s+/.test(l[i])) { let a = []; while (i < l.length && /^[-*+]\s+/.test(l[i])) a.push('<li>' + inline(l[i++].replace(/^[-*+]\s+/, '')) + '</li>'); o.push('<ul>' + a.join('') + '</ul>'); continue; } if (/^>\s?/.test(l[i])) { let a = []; while (i < l.length && /^>\s?/.test(l[i])) a.push(l[i++].replace(/^>\s?/, '')); o.push('<blockquote><p>' + inline(a.join(' ')) + '</p></blockquote>'); continue; } let a = [l[i++]]; while (i < l.length && l[i].trim() && !/^(#{1,6}\s|[-*+]\s+|>\s?)/.test(l[i])) a.push(l[i++]); o.push('<p>' + inline(a.join(' ')) + '</p>'); } return o.join('\n'); }
function fig(src, alt, cap, cls) {
  if (!src) return '';
  return '<figure class="mag-fig ' + cls + '"><img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">' + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
}
function block(b) {
  if (!b || typeof b !== 'object') return '';
  switch (b.type) {
    case 'texte': return b.texte ? '<div class="mag mag-text">' + markdown(b.texte) + '</div>' : '';
    case 'texte_image': {
      const w = { etroite: '30%', moyenne: '40%', large: '50%' }[b.largeur] || '40%';
      return '<div class="mag mag-side ' + (b.cote === 'gauche' ? 'left' : 'right') + '" style="--w:' + w + '">' + fig(b.image, b.alt, b.legende, b.cadrage === 'original' ? 'side' : 'side crop') + '<div class="mag-text">' + markdown(b.texte) + '</div></div>';
    }
    case 'image': return '<div class="mag">' + fig(b.image, b.alt, b.legende, { panoramique: 'wide', paysage: 'land' }[b.format] || 'full') + '</div>';
    case 'galerie': {
      const imgs = (Array.isArray(b.images) ? b.images : []).filter(x => x && x.image).slice(0, 3);
      if (!imgs.length) return '';
      const c = { portrait: 'crop', paysage: 'land', carre: 'square' }[b.cadrage] || 'full';
      return '<div class="mag mag-gallery n' + imgs.length + '">' + imgs.map(x => fig(x.image, x.alt, x.legende, c)).join('') + '</div>';
    }
    case 'citation': return b.texte ? '<blockquote class="mag-quote"><p>' + inline(b.texte) + '</p>' + (b.auteur ? '<cite>' + esc(b.auteur) + '</cite>' : '') + '</blockquote>' : '';
    case 'encadre': return '<aside class="mag-box">' + (b.titre ? '<h3>' + esc(b.titre) + '</h3>' : '') + markdown(b.texte) + '</aside>';
    default: return '';
  }
}
function posts() {
  if (!fs.existsSync(DIR)) return [];
  const out = [];
  for (const f of fs.readdirSync(DIR)) {
    if (!/\.md$/i.test(f)) continue;
    const x = parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    if (!x.d.title || String(x.d.draft).toLowerCase() === 'true') continue;
    out.push({ slug: f.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''), themes: list(x.d.themes), kind: list(x.d.kind)[0] || '', blocks: Array.isArray(x.d.blocks) ? x.d.blocks : [] });
  }
  return out;
}
function settings() {
  const p = path.join(ROOT, 'content', 'settings', 'categories.yml'), r = { themes: [], types: [] };
  if (!fs.existsSync(p)) return r;
  const raw = fs.readFileSync(p, 'utf8');
  try {
    if (yaml) { const d = yaml.load(raw) || {}; r.themes = (d.themes || []).map(x => x && x.name).filter(Boolean); r.types = (d.types || []).map(x => x && x.name).filter(Boolean); return r; }
  } catch (e) {}
  let cur = null;
  raw.split(/\r?\n/).forEach(l => { if (/^themes:/.test(l)) cur = 'themes'; else if (/^types:/.test(l)) cur = 'types'; else { const x = l.match(/^\s*-\s*name:\s*(.*)$/); if (x && cur) r[cur].push(unq(x[1].trim())); } });
  return r;
}
const FILTER_JS = '<script id="mecenia-blog-filters">(function(){var bar=document.querySelector("[data-blog-filters]");if(!bar)return;var cards=[].slice.call(document.querySelectorAll(".blog-card")),pills=[].slice.call(bar.querySelectorAll(".bf-pill")),empty=bar.querySelector(".bf-empty"),reset=bar.querySelector(".bf-reset"),status=bar.querySelector(".bf-status"),st={themes:[],kind:[]},P={themes:"theme",kind:"type"};function apply(){var n=0;cards.forEach(function(c){var th=(c.getAttribute("data-themes")||"").split("|").filter(Boolean),k=c.getAttribute("data-kind")||"",a=!st.themes.length||st.themes.some(function(t){return th.indexOf(t)>-1}),b=!st.kind.length||st.kind.indexOf(k)>-1,ok=a&&b;c.hidden=!ok;if(ok)n++});var act=st.themes.length+st.kind.length;empty.hidden=n>0;reset.hidden=!act;status.textContent=act?n+(n>1?" articles affichés":" article affiché"):"";pills.forEach(function(p){p.setAttribute("aria-pressed",st[p.getAttribute("data-group")].indexOf(p.getAttribute("data-value"))>-1?"true":"false")});try{var u=new URLSearchParams();st.themes.forEach(function(v){u.append("theme",v)});st.kind.forEach(function(v){u.append("type",v)});var q=u.toString();history.replaceState(null,"",location.pathname+(q?"?"+q:""))}catch(e){}}pills.forEach(function(p){p.addEventListener("click",function(){var g=p.getAttribute("data-group"),v=p.getAttribute("data-value"),i=st[g].indexOf(v);if(i>-1)st[g].splice(i,1);else st[g].push(v);apply()})});reset.addEventListener("click",function(){st.themes=[];st.kind=[];apply()});try{var u=new URLSearchParams(location.search);st.themes=u.getAll("theme");st.kind=u.getAll("type")}catch(e){}apply()})();</script>';
try {
  const all = posts();
  if (fs.existsSync(path.join(ROOT, 'scripts', 'blog-layout.css')) && fs.existsSync(path.join(OUT, 'assets'))) fs.copyFileSync(path.join(ROOT, 'scripts', 'blog-layout.css'), path.join(OUT, 'assets', 'blog-layout.css'));
  const LINK = '<link rel="stylesheet" href="/assets/blog-layout.css">';
  const withLink = h => h.includes('blog-layout.css') ? h : h.replace('</head>', LINK + '\n</head>');
  const chips = p => (p.kind || p.themes.length) ? '<span class="cat-chips">' + (p.kind ? '<span class="cat cat-kind">' + esc(p.kind) + '</span>' : '') + p.themes.map(t => '<span class="cat">' + esc(t) + '</span>').join('') + '</span>' : '';
  const cfg = settings();
  const used = { themes: [], kind: [] };
  all.forEach(p => { p.themes.forEach(t => { if (!used.themes.includes(t)) used.themes.push(t); }); if (p.kind && !used.kind.includes(p.kind)) used.kind.push(p.kind); });
  const order = (arr, ref) => arr.slice().sort((a, b) => { const i = ref.indexOf(a), j = ref.indexOf(b); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j) || a.localeCompare(b, 'fr'); });
  const bfile = path.join(OUT, 'blog', 'index.html');
  if (fs.existsSync(bfile)) {
    let h = fs.readFileSync(bfile, 'utf8');
    if (!h.includes('data-blog-filters')) {
      let touched = 0;
      for (const p of all) {
        const open = '<article class="card blog-card"><a href="/blog/' + p.slug + '/">';
        const s = h.indexOf(open);
        if (s < 0) { console.warn('Blog : carte introuvable pour ' + p.slug); continue; }
        const e = h.indexOf('</article>', s);
        let card = h.slice(s, e).replace(open, '<article class="card blog-card" data-themes="' + esc(p.themes.join('|')) + '" data-kind="' + esc(p.kind) + '"><a href="/blog/' + p.slug + '/">').replace(/(<span class="tag">[^<]*<\/span>)/, '$1' + chips(p));
        h = h.slice(0, s) + card + h.slice(e); touched++;
      }
      const T = order(used.themes, cfg.themes), K = order(used.kind, cfg.types);
      if (touched && (T.length || K.length)) {
        const group = (label, aria, g, items) => items.length ? '<div class="bf-group" role="group" aria-label="' + aria + '"><span class="bf-label">' + label + '</span>' + items.map(v => '<button type="button" class="bf-pill" aria-pressed="false" data-group="' + g + '" data-value="' + esc(v) + '">' + esc(v) + '</button>').join('') + '</div>' : '';
        const bar = '<div class="blog-filters" data-blog-filters>' + group('Thématiques', 'Filtrer par thématique', 'themes', T) + group('Type d’article', 'Filtrer par type d’article', 'kind', K) + '<div class="bf-foot"><button type="button" class="bf-reset" hidden>Tout afficher</button><p class="bf-status" role="status" aria-live="polite"></p></div><p class="bf-empty" hidden>Aucun article ne correspond à cette sélection.</p></div>';
        const g = h.indexOf('<div class="grid g3 stagger">');
        if (g >= 0) { h = h.slice(0, g) + bar + h.slice(g); h = h.replace('</body>', FILTER_JS + '\n</body>'); }
        else console.warn('Blog : liste des articles introuvable, filtres non ajoutés.');
      }
      h = withLink(h);
      fs.writeFileSync(bfile, h);
    }
  }
  let laid = 0;
  for (const p of all) {
    const f = path.join(OUT, 'blog', p.slug, 'index.html');
    if (!fs.existsSync(f)) continue;
    let h = fs.readFileSync(f, 'utf8'); const before = h;
    if (!h.includes('class="cat-chips"') && chips(p)) h = h.replace(/(<p class="sub">Publié le [^<]*<\/p>)/, '$1' + chips(p));
    const html = p.blocks.map(block).join('\n');
    if (html && !h.includes('mag-')) {
      h = h.replace(/(<article class="prose post">[\s\S]*?)(<\/article>)/, (m, a, b) => a + html + b).replace('class="container narrow"', 'class="container post-wide"');
      laid++;
    }
    h = withLink(h);
    if (h !== before) fs.writeFileSync(f, h);
  }
  console.log('Blog : ' + all.length + ' article(s), ' + laid + ' avec mise en page par blocs.');
} catch (e) { console.error('Blog : étape ignorée', e.message); }

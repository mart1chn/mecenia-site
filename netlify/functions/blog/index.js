'use strict';
/* Blog dynamique : lit les articles directement dans GitHub (dépôt privé) et les affiche sans nouveau déploiement.
   Mis en cache 60 s par le CDN de Netlify. En cas de panne de GitHub, sert la dernière version déployée. */
const OWNER = 'mart1chn', REPO = 'mecenia-site', BRANCH = process.env.CONTENT_BRANCH || 'main', BASE = 'https://www.mecenia.org';
let yaml = null; try { yaml = require('js-yaml'); } catch (e) {}
let shell = {}; try { shell = require('./shell.json') || {}; } catch (e) {}
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unq = v => ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'")) ? v.slice(1, -1) : v;
function simple(raw) { const d = {}; let key = null; raw.split(/\r?\n/).forEach(l => { let x = l.match(/^([\w-]+):\s*(.*)$/); if (x) { key = x[1]; const v = x[2].trim(); if (!v) { d[key] = []; return; } if (v[0] === '[') { try { d[key] = JSON.parse(v); return; } catch (e) {} } d[key] = unq(v); return; } x = l.match(/^\s+-\s+(.*)$/); if (x && key && Array.isArray(d[key])) d[key].push(unq(x[1].trim())); }); return d; }
function parse(raw) { const m = String(raw || '').replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/); if (!m) return { d: {}, body: String(raw || '') }; let d; try { d = yaml ? (yaml.load(m[1]) || {}) : simple(m[1]); } catch (e) { d = simple(m[1]); } return { d, body: m[2] }; }
const list = v => Array.isArray(v) ? v.filter(Boolean).map(String) : (v ? [String(v)] : []);
function inline(t) { return esc(t).replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>'); }
function markdown(src) { const l = String(src || '').replace(/\r/g, '').split('\n'), o = []; let i = 0; while (i < l.length) { if (!l[i].trim()) { i++; continue; } let m; if ((m = l[i].match(/^(#{1,6})\s+(.*)$/))) { o.push('<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'); i++; continue; } if (/^[-*+]\s+/.test(l[i])) { let a = []; while (i < l.length && /^[-*+]\s+/.test(l[i])) a.push('<li>' + inline(l[i++].replace(/^[-*+]\s+/, '')) + '</li>'); o.push('<ul>' + a.join('') + '</ul>'); continue; } if (/^>\s?/.test(l[i])) { let a = []; while (i < l.length && /^>\s?/.test(l[i])) a.push(l[i++].replace(/^>\s?/, '')); o.push('<blockquote><p>' + inline(a.join(' ')) + '</p></blockquote>'); continue; } let a = [l[i++]]; while (i < l.length && l[i].trim() && !/^(#{1,6}\s|[-*+]\s+|>\s?)/.test(l[i])) a.push(l[i++]); o.push('<p>' + inline(a.join(' ')) + '</p>'); } return o.join('\n'); }
function fig(src, alt, cap, cls) { if (!src) return ''; return '<figure class="mag-fig ' + cls + '"><img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">' + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>'; }
function block(b) {
  if (!b || typeof b !== 'object') return '';
  switch (b.type) {
    case 'texte': return b.texte ? '<div class="mag mag-text">' + markdown(b.texte) + '</div>' : '';
    case 'texte_image': { const w = { etroite: '30%', moyenne: '40%', large: '50%' }[b.largeur] || '40%'; return '<div class="mag mag-side ' + (b.cote === 'gauche' ? 'left' : 'right') + '" style="--w:' + w + '">' + fig(b.image, b.alt, b.legende, b.cadrage === 'original' ? 'side' : 'side crop') + '<div class="mag-text">' + markdown(b.texte) + '</div></div>'; }
    case 'image': return '<div class="mag">' + fig(b.image, b.alt, b.legende, { panoramique: 'wide', paysage: 'land' }[b.format] || 'full') + '</div>';
    case 'galerie': { const imgs = (Array.isArray(b.images) ? b.images : []).filter(x => x && x.image).slice(0, 3); if (!imgs.length) return ''; const c = { portrait: 'crop', paysage: 'land', carre: 'square' }[b.cadrage] || 'full'; return '<div class="mag mag-gallery n' + imgs.length + '">' + imgs.map(x => fig(x.image, x.alt, x.legende, c)).join('') + '</div>'; }
    case 'citation': return b.texte ? '<blockquote class="mag-quote"><p>' + inline(b.texte) + '</p>' + (b.auteur ? '<cite>' + esc(b.auteur) + '</cite>' : '') + '</blockquote>' : '';
    case 'encadre': return '<aside class="mag-box">' + (b.titre ? '<h3>' + esc(b.titre) + '</h3>' : '') + markdown(b.texte) + '</aside>';
    default: return '';
  }
}
const fmt = d => d.getTime() ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
const chips = p => (p.kind || p.themes.length) ? '<span class="cat-chips">' + (p.kind ? '<span class="cat cat-kind">' + esc(p.kind) + '</span>' : '') + p.themes.map(t => '<span class="cat">' + esc(t) + '</span>').join('') + '</span>' : '';
const FILTER_JS = '<script id="mecenia-blog-filters">(function(){var bar=document.querySelector("[data-blog-filters]");if(!bar)return;var cards=[].slice.call(document.querySelectorAll(".blog-card")),pills=[].slice.call(bar.querySelectorAll(".bf-pill")),empty=bar.querySelector(".bf-empty"),reset=bar.querySelector(".bf-reset"),status=bar.querySelector(".bf-status"),st={themes:[],kind:[]};function apply(){var n=0;cards.forEach(function(c){var th=(c.getAttribute("data-themes")||"").split("|").filter(Boolean),k=c.getAttribute("data-kind")||"",a=!st.themes.length||st.themes.some(function(t){return th.indexOf(t)>-1}),b=!st.kind.length||st.kind.indexOf(k)>-1,ok=a&&b;c.hidden=!ok;if(ok)n++});var act=st.themes.length+st.kind.length;empty.hidden=n>0;reset.hidden=!act;status.textContent=act?n+(n>1?" articles affichés":" article affiché"):"";pills.forEach(function(p){p.setAttribute("aria-pressed",st[p.getAttribute("data-group")].indexOf(p.getAttribute("data-value"))>-1?"true":"false")});try{var u=new URLSearchParams();st.themes.forEach(function(v){u.append("theme",v)});st.kind.forEach(function(v){u.append("type",v)});var q=u.toString();history.replaceState(null,"",location.pathname+(q?"?"+q:""))}catch(e){}}pills.forEach(function(p){p.addEventListener("click",function(){var g=p.getAttribute("data-group"),v=p.getAttribute("data-value"),i=st[g].indexOf(v);if(i>-1)st[g].splice(i,1);else st[g].push(v);apply()})});reset.addEventListener("click",function(){st.themes=[];st.kind=[];apply()});try{var u=new URLSearchParams(location.search);st.themes=u.getAll("theme");st.kind=u.getAll("type")}catch(e){}apply()})();</script>';
async function load() {
  const q = 'query($o:String!,$n:String!,$a:String!,$b:String!){repository(owner:$o,name:$n){blog:object(expression:$a){... on Tree{entries{name object{... on Blob{text}}}}} cats:object(expression:$b){... on Blob{text}}}}';
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, 'User-Agent': 'mecenia-blog', 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, variables: { o: OWNER, n: REPO, a: BRANCH + ':content/blog', b: BRANCH + ':content/settings/categories.yml' } }) });
  if (!res.ok) throw new Error('GitHub ' + res.status);
  const j = await res.json();
  if (j.errors || !j.data || !j.data.repository) throw new Error('GitHub GraphQL');
  const r = j.data.repository, posts = [];
  ((r.blog && r.blog.entries) || []).forEach(e => {
    if (!/\.md$/i.test(e.name) || !e.object || typeof e.object.text !== 'string') return;
    const x = parse(e.object.text);
    if (!x.d.title || String(x.d.draft).toLowerCase() === 'true') return;
    let date = new Date(x.d.date); if (isNaN(date)) date = new Date(0);
    posts.push({ slug: e.name.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''), title: String(x.d.title), desc: String(x.d.description || ''), image: x.d.image ? String(x.d.image) : '', date, themes: list(x.d.themes), kind: list(x.d.kind)[0] || '', blocks: Array.isArray(x.d.blocks) ? x.d.blocks : [], body: x.body });
  });
  posts.sort((a, b) => b.date - a.date);
  const cfg = { themes: [], types: [] };
  if (r.cats && r.cats.text) { try { const d = yaml.load(r.cats.text) || {}; cfg.themes = (d.themes || []).map(x => x && x.name).filter(Boolean); cfg.types = (d.types || []).map(x => x && x.name).filter(Boolean); } catch (e) {} }
  return { posts, cfg };
}
const MIN = { head: '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Blog | Mecenia</title><meta name="description" content=""><link rel="canonical" href="' + BASE + '/blog/"><link rel="stylesheet" href="/assets/style.css"><link rel="stylesheet" href="/assets/blog-layout.css">', header: '<body><header class="site"><div class="nav-wrap"><a class="brand" href="/">MECENIA</a></div></header><main id="contenu">', foot: '</main></body></html>' };
function page(p, title, desc, main, image, withFilters) {
  const set = (h, prop, v) => h.replace(new RegExp('(<meta (?:property|name)="' + prop + '" content=")[^"]*(")'), (m, a, b) => a + esc(v) + b);
  let head = (shell.head || MIN.head).replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + esc(title) + '</title>');
  head = set(set(set(set(set(head, 'description', desc), 'og:title', title), 'og:description', desc), 'twitter:title', title), 'twitter:description', desc);
  head = head.replace(/<link rel="canonical" href="[^"]*">/, () => '<link rel="canonical" href="' + BASE + p + '">');
  head = set(head, 'og:url', BASE + p);
  if (image) { const u = /^https?:/.test(image) ? image : BASE + image; head = set(set(head, 'og:image', u), 'twitter:image', u); }
  let foot = shell.foot || MIN.foot;
  if (withFilters) foot = foot.replace('</body>', () => FILTER_JS + '\n</body>');
  return head + '</head>' + (shell.header || MIN.header) + main + foot;
}
const HERO = shell.listHero || '<section class="hero small"><div class="container hero-content"><div class="breadcrumb"><a href="/">Accueil</a> &nbsp;/&nbsp; Blog</div><h1>Le blog de Mecenia</h1><p class="sub">Analyses, comptes rendus et réflexions sur la culture comme richesse économique et pouvoir d’influence.</p></div></section>';
function listPage(d) {
  const used = { themes: [], kind: [] };
  d.posts.forEach(p => { p.themes.forEach(t => { if (!used.themes.includes(t)) used.themes.push(t); }); if (p.kind && !used.kind.includes(p.kind)) used.kind.push(p.kind); });
  const order = (arr, ref) => arr.slice().sort((a, b) => { const i = ref.indexOf(a), j = ref.indexOf(b); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j) || a.localeCompare(b, 'fr'); });
  const T = order(used.themes, d.cfg.themes), K = order(used.kind, d.cfg.types);
  const group = (label, aria, g, items) => items.length ? '<div class="bf-group" role="group" aria-label="' + aria + '"><span class="bf-label">' + label + '</span>' + items.map(v => '<button type="button" class="bf-pill" aria-pressed="false" data-group="' + g + '" data-value="' + esc(v) + '">' + esc(v) + '</button>').join('') + '</div>' : '';
  const bar = (T.length || K.length) ? '<div class="blog-filters" data-blog-filters>' + group('Thématiques', 'Filtrer par thématique', 'themes', T) + group('Type d’article', 'Filtrer par type d’article', 'kind', K) + '<div class="bf-foot"><button type="button" class="bf-reset" hidden>Tout afficher</button><p class="bf-status" role="status" aria-live="polite"></p></div><p class="bf-empty" hidden>Aucun article ne correspond à cette sélection.</p></div>' : '';
  const cards = d.posts.map(p => '<article class="card blog-card" data-themes="' + esc(p.themes.join('|')) + '" data-kind="' + esc(p.kind) + '"><a href="/blog/' + p.slug + '/">' + (p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">' : '') + '<span class="tag">' + fmt(p.date) + '</span>' + chips(p) + '<h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p><span class="arrow-link">Lire l’article</span></a></article>').join('');
  const empty = '<div class="card blog-empty"><h2>Les premiers articles arrivent bientôt</h2><p>Notre blog ouvre prochainement. En attendant, découvrez <a class="link" href="/notre-mission/">notre mission</a> ou <a class="link" href="/adherer/?type=suivre#formulaire">inscrivez-vous pour suivre nos travaux</a>.</p></div>';
  const main = HERO + '<section class="bg-white"><div class="container">' + (cards ? bar + '<div class="grid g3 stagger">' + cards + '</div>' : empty) + '</div></section>';
  return page('/blog/', 'Blog — Mecenia', 'Analyses, comptes rendus et réflexions de Mecenia.', main, '', !!bar);
}
function articlePage(p) {
  const wide = p.blocks.length > 0;
  const main = '<section class="hero small"><div class="container hero-content"><div class="breadcrumb"><a href="/">Accueil</a> &nbsp;/&nbsp; <a href="/blog/">Blog</a></div><h1>' + esc(p.title) + '</h1><p class="sub">Publié le ' + fmt(p.date) + '</p>' + chips(p) + '</div></section><section class="bg-white"><div class="container ' + (wide ? 'post-wide' : 'narrow') + '">' + (p.image ? '<figure class="post-cover"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '"></figure>' : '') + '<article class="prose post">' + markdown(p.body) + p.blocks.map(block).join('\n') + '</article><p class="center" style="margin-top:36px"><a class="arrow-link" href="/blog/">Tous les articles</a></p></div></section>';
  return page('/blog/' + p.slug + '/', p.title + ' | Blog Mecenia', p.desc || p.title, main, p.image, false);
}
const CACHE = { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' };
const html = (code, body) => ({ statusCode: code, headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8' }, code === 200 ? CACHE : { 'Cache-Control': 'no-store' }), body });
async function fallback(p) {
  try {
    const base = process.env.DEPLOY_URL || process.env.URL;
    const r = await fetch(base + '/_blog-static' + (p && p !== '__latest' ? '/' + p + '/' : '/'));
    if (r.ok) return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, s-maxage=20' }, body: await r.text() };
  } catch (e) {}
  return html(503, '<!DOCTYPE html><meta charset="utf-8"><title>Blog momentanément indisponible</title><p>Le blog est momentanément indisponible. Merci de réessayer dans quelques instants.</p>');
}
exports.handler = async (event) => {
  const raw = (event.queryStringParameters && event.queryStringParameters.path) || '/';
  let p = String(raw).replace(/^\/+|\/+$/g, ''); try { p = decodeURIComponent(p); } catch (e) {}
  let d; try { d = await load(); } catch (e) { console.error('Blog dynamique :', e.message); return p === '__latest' ? { statusCode: 503, headers: { 'Cache-Control': 'no-store' }, body: '{}' } : fallback(p); }
  if (p === '__latest') return { statusCode: 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': BASE }, CACHE), body: JSON.stringify({ items: d.posts.slice(0, 6).map(x => ({ slug: x.slug, title: x.title, desc: x.desc, image: x.image, date: fmt(x.date) })) }) };
  if (!p) return html(200, listPage(d));
  const post = d.posts.find(x => x.slug === p);
  if (post) return html(200, articlePage(post));
  return html(404, page('/blog/', 'Article introuvable | Mecenia', 'Cet article est introuvable.', HERO.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>Article introuvable</h1>') + '<section class="bg-white"><div class="container narrow"><p class="center">Cet article n’existe pas ou n’est plus publié. <a class="arrow-link" href="/blog/">Voir tous les articles</a></p></div></section>', '', false));
};

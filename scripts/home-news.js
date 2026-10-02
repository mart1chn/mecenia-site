'use strict';
/* Accueil : défilement automatique des derniers articles du blog (couverture, titre, résumé court).
   Lit content/blog comme le blog lui-même. Ne fait jamais échouer le build. */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), OUT = path.join(ROOT, 'dist'), DIR = path.join(ROOT, 'content', 'blog');
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function parse(raw) {
  const m = raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/), d = {};
  if (!m) return { d, body: raw };
  m[1].split(/\r?\n/).forEach(l => { const x = l.match(/^([\w-]+):\s*(.*)$/); if (x) { let v = x[2].trim(); if ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'")) v = v.slice(1, -1); d[x[1]] = v; } });
  return { d, body: m[2] };
}
const plain = md => md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^#+\s*/gm, '').replace(/[>*_`]/g, '').replace(/\s+/g, ' ').trim();
const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const CSS = '<style id="mecenia-news">.news-carousel{position:relative;max-width:980px;margin:36px auto 0}.news-view{overflow:hidden;border:1px solid var(--line);background:#fff}.news-track{display:flex;transition:transform .65s cubic-bezier(.4,0,.2,1)}.news-slide{flex:0 0 100%;min-width:0;display:flex}.news-link{flex:1 1 auto;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:stretch;color:inherit;text-decoration:none}.news-img{position:relative;aspect-ratio:16/10;background:var(--beige);overflow:hidden}.news-img img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain}.news-img img.news-bg{object-fit:cover;filter:blur(22px) saturate(1.05);transform:scale(1.15);opacity:.55}.news-body{display:flex;flex-direction:column;justify-content:center;gap:10px;padding:34px;text-align:left}.news-body h3{font-family:"Playfair Display",Georgia,serif;font-size:24px;line-height:1.25;margin:4px 0 0}.news-body p{margin:0;color:var(--gray);text-align:left;hyphens:none;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.news-slide.no-img .news-link{grid-template-columns:1fr;min-height:220px}.news-ctrl{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:18px}.news-btn{width:42px;height:42px;border-radius:50%;border:1px solid rgba(154,95,55,.55);background:none;color:#9A5F37;cursor:pointer;font-size:22px;line-height:1}.news-btn:hover{background:#9A5F37;color:#fff}.news-dots{display:flex;align-items:center}.news-dots button{box-sizing:content-box;width:9px;height:9px;padding:8px;border:0;border-radius:50%;background:rgba(154,95,55,.3);background-clip:content-box;cursor:pointer}.news-dots button[aria-current="true"]{background-color:#9A5F37}.news-more{text-align:center;margin-top:22px}@media(max-width:760px){.news-link{grid-template-columns:1fr}.news-body{padding:22px}.news-body h3{font-size:21px}}@media(prefers-reduced-motion:reduce){.news-track{transition:none}}</style>';
const JS = '<script id="mecenia-news-js">(function(){var c=document.querySelector("[data-news]");if(!c)return;var t=c.querySelector(".news-track"),s=[].slice.call(c.querySelectorAll(".news-slide")),d=[].slice.call(c.querySelectorAll(".news-dots button")),n=s.length,i=0,timer=null,reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function show(k){i=(k+n)%n;t.style.transform="translateX("+(-100*i)+"%)";s.forEach(function(e,j){var on=j===i;e.setAttribute("aria-hidden",on?"false":"true");[].forEach.call(e.querySelectorAll("a"),function(a){a.tabIndex=on?0:-1})});d.forEach(function(e,j){e.setAttribute("aria-current",j===i?"true":"false")})}function stop(){if(timer){clearInterval(timer);timer=null}}function play(){stop();if(reduce||n<2)return;timer=setInterval(function(){show(i+1)},6500)}var p=c.querySelector("[data-prev]"),x=c.querySelector("[data-next]");if(p)p.addEventListener("click",function(){show(i-1);play()});if(x)x.addEventListener("click",function(){show(i+1);play()});d.forEach(function(e,j){e.addEventListener("click",function(){show(j);play()})});c.addEventListener("mouseenter",stop);c.addEventListener("mouseleave",play);c.addEventListener("focusin",stop);c.addEventListener("focusout",play);var sx=null;c.addEventListener("touchstart",function(e){sx=e.touches[0].clientX;stop()},{passive:true});c.addEventListener("touchend",function(e){if(sx!==null){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(i+(dx<0?1:-1))}sx=null;play()});document.addEventListener("visibilitychange",function(){if(document.hidden)stop();else play()});show(0);play()})();</script>';
function posts() {
  if (!fs.existsSync(DIR)) return [];
  const list = [];
  for (const f of fs.readdirSync(DIR)) {
    if (!/\.md$/i.test(f)) continue;
    const x = parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    if (!x.d.title || String(x.d.draft).toLowerCase() === 'true') continue;
    let date = new Date(x.d.date); if (isNaN(date)) date = fs.statSync(path.join(DIR, f)).mtime;
    let desc = x.d.description || plain(x.body).slice(0, 170).trim();
    list.push({ slug: f.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''), title: x.d.title, desc, image: x.d.image || '', date });
  }
  return list.sort((a, b) => b.date - a.date).slice(0, 6);
}
try {
  const file = path.join(OUT, 'index.html');
  const list = posts();
  if (!fs.existsSync(file)) { console.warn('Actualités : accueil absent'); }
  else if (!list.length) { console.log('Actualités : aucun article publié, section non affichée.'); }
  else {
    let h = fs.readFileSync(file, 'utf8');
    if (!h.includes('data-news-section')) {
      const slides = list.map((p, k) => '<article class="news-slide' + (p.image ? '' : ' no-img') + '" role="group" aria-roledescription="diapositive" aria-label="' + (k + 1) + ' sur ' + list.length + '"><a class="news-link" href="/blog/' + p.slug + '/">' + (p.image ? '<div class="news-img"><img class="news-bg" src="' + esc(p.image) + '" alt="" aria-hidden="true" loading="lazy" decoding="async"><img src="' + esc(p.image) + '" alt="" loading="lazy" decoding="async"></div>' : '') + '<div class="news-body"><span class="tag">' + fmt(p.date) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p><span class="arrow-link">Lire l’article</span></div></a></article>').join('');
      const dots = list.map((p, k) => '<button type="button" aria-label="Article ' + (k + 1) + '" aria-current="' + (k === 0 ? 'true' : 'false') + '"></button>').join('');
      const ctrl = list.length > 1 ? '<div class="news-ctrl"><button class="news-btn" type="button" data-prev aria-label="Article précédent">‹</button><div class="news-dots">' + dots + '</div><button class="news-btn" type="button" data-next aria-label="Article suivant">›</button></div>' : '';
      const sec = '\n<section class="bg-beige" data-news-section="1"><div class="container"><span class="eyebrow reveal">Le blog</span><h2 class="title reveal">Les derniers articles</h2><p class="lead reveal">Analyses, comptes rendus et réflexions sur la culture comme richesse économique et pouvoir d’influence.</p><div class="news-carousel" data-news role="region" aria-roledescription="carrousel" aria-label="Derniers articles du blog"><div class="news-view"><div class="news-track">' + slides + '</div></div>' + ctrl + '</div><p class="news-more"><a class="arrow-link" href="/blog/">Tous les articles</a></p></div></section>';
      const m = h.indexOf('La culture, un seul et même horizon');
      const j = m < 0 ? -1 : h.indexOf('</section>', m);
      let at = j >= 0 ? j + 10 : h.indexOf('</main>');
      if (at < 0) { console.warn('Actualités : point d’insertion introuvable'); }
      else {
        h = h.slice(0, at) + sec + h.slice(at);
        h = h.replace('</head>', CSS + '\n</head>').replace('</body>', JS + '\n</body>');
        fs.writeFileSync(file, h);
        console.log('Actualités : ' + list.length + ' article(s) dans le carrousel de l’accueil.');
      }
    }
  }
  const bf = path.join(OUT, 'blog', 'index.html');
  if (fs.existsSync(bf)) {
    let b = fs.readFileSync(bf, 'utf8');
    if (!b.includes('mecenia-blog-clamp')) { b = b.replace('</head>', '<style id="mecenia-blog-clamp">.blog-card p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}</style>\n</head>'); fs.writeFileSync(bf, b); }
  }
} catch (e) { console.error('Actualités : étape ignorée', e.message); }

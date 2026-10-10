'use strict';
const { esc } = require('../lib/util');

const abs = (site, u) => (/^https?:\/\//.test(u) ? u : site.url + (u.startsWith('/') ? u : '/' + u));

function head(site, assets, p) {
  const url = site.url + p.path.replace(/index\.html$/, '');
  const title = esc(p.title);
  const desc = esc(p.description || site.description_defaut);
  const image = abs(site, p.image || '/assets/img/og-image.jpg');
  const ld = JSON.stringify(p.jsonld || [], null, 0).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="${p.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">
<meta name="theme-color" content="#F7F1E5">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:type" content="${p.article ? 'article' : 'website'}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="preload" href="${assets.fonts['lora']}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${assets.fonts['inter-400']}" as="font" type="font/woff" crossorigin>
<script>document.documentElement.classList.add('js')</script>
<link rel="stylesheet" href="${assets.css}">
<script type="application/ld+json">${ld}</script>
${p.headExtra || ''}</head>`;
}

function header(site, current) {
  const links = site.menu.map((m) => {
    const on = current === m.url || (m.url !== '/' && current.startsWith(m.url));
    return `<li><a href="${esc(m.url)}"${on ? ' aria-current="page"' : ''}>${esc(m.label)}</a></li>`;
  }).join('');
  const cta = site.bouton_menu ? `<a class="btn btn--sm" href="${esc(site.bouton_menu.url)}">${esc(site.bouton_menu.label)}</a>` : '';
  const social = (site.reseaux || []).map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.nom)}</a>`).join('');
  return `<a class="skip" href="#contenu">Aller au contenu</a>
<div class="topbar"><div class="container"><span class="topbar__l">Association loi 1901 · ${esc(site.ville)}</span><span class="topbar__r">${social}<a href="mailto:${esc(site.email)}">${esc(site.email)}</a></span></div></div>
<header class="site-header" id="top">
<div class="container bar">
<a class="brand" href="/" aria-label="${esc(site.nom)}, retour à l’accueil"><img src="/assets/img/mecenia-icon.png" alt="" width="38" height="43"><span>MECEN<i>IA</i></span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-toggle__label">Menu</span><span class="menu-toggle__bars" aria-hidden="true"></span></button>
<nav id="menu" class="menu" aria-label="Navigation principale"><ul>${links}</ul>${cta}</nav>
</div>
</header>`;
}

function footer(site) {
  const f = site.pied_de_page;
  const cols = (f.colonnes || []).map((c) => `<div><h2 class="foot-title">${esc(c.titre)}</h2><ul>${(c.liens || []).map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join('')}</ul></div>`).join('');
  const social = (site.reseaux || []).map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.nom)}</a></li>`).join('');
  return `<footer class="site-footer">
<div class="container">
<div class="foot-grid">
<div class="foot-id"><p class="foot-brand">MECEN<i>IA</i></p><p>${esc(f.texte)}</p><p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a><br>${esc(site.ville)}</p></div>
${cols}
<div><h2 class="foot-title">Suivre &amp; informations</h2><ul>${social}<li><a href="/mentions-legales/">Mentions légales &amp; confidentialité</a></li></ul></div>
</div>
<p class="foot-legal">© ${new Date().getFullYear()} ${esc(site.nom)}. Tous droits réservés.${f.mentions ? ' ' + esc(f.mentions) : ''}</p>
</div>
</footer>`;
}

function document(site, assets, p, content) {
  return `${head(site, assets, p)}
<body class="${p.bodyClass || ''}">
${header(site, p.path)}
<main id="contenu">
${content}
</main>
${footer(site)}
<script src="${assets.js}" defer></script>
</body>
</html>
`;
}

module.exports = { document, abs };

'use strict';
const { esc, fmtDate, isoDate } = require('../lib/util');
const { block, inline, figures, readingMinutes } = require('../lib/md');
const U = require('./ui');
const { sectionHead, section, img, postCard } = U;
const { renderBlocks } = require('./blocks');

const fmt = (d) => fmtDate(d);

/* ---------- Mise en page avancée (blocs facultatifs d'un article) ---------- */
function postBlock(b) {
  switch (b.type) {
    case 'texte': return `<div class="prose">${block(b.texte)}</div>`;
    case 'texte_image':
      return `<div class="mag mag--${esc(b.cote || 'droite')} mag--${esc(b.largeur || 'moyenne')} mag--${esc(b.cadrage || 'portrait')}"><figure class="fig">${img(b.image, b.alt)}${b.legende ? `<figcaption>${esc(b.legende)}</figcaption>` : ''}</figure><div class="prose">${block(b.texte)}</div></div>`;
    case 'image':
      return `<figure class="fig fig--${esc(b.format || 'original')}">${img(b.image, b.alt)}${b.legende ? `<figcaption>${esc(b.legende)}</figcaption>` : ''}</figure>`;
    case 'galerie':
      return `<div class="gallery gallery--${esc(b.cadrage || 'portrait')}">${(b.images || []).map((i) => `<figure class="fig">${img(i.image, i.alt)}${i.legende ? `<figcaption>${esc(i.legende)}</figcaption>` : ''}</figure>`).join('')}</div>`;
    case 'citation':
      return `<figure class="pullquote"><blockquote><p>${esc(b.texte)}</p></blockquote>${b.auteur ? `<figcaption>${esc(b.auteur)}</figcaption>` : ''}</figure>`;
    case 'encadre':
      return `<aside class="callout">${b.titre ? `<h3>${esc(b.titre)}</h3>` : ''}${block(b.texte)}</aside>`;
    default: return '';
  }
}

/* ---------- Liste ---------- */
function renderIndex(ctx) {
  const { posts } = ctx;
  const kinds = [...new Set(posts.map((p) => p.kind).filter(Boolean))];
  const themes = [...new Set(posts.flatMap((p) => p.themes))];
  const chips = (label, list, key) => (list.length ? `<div class="filter" data-filter="${key}"><p class="filter__label" id="f-${key}">${label}</p><div role="group" aria-labelledby="f-${key}">${list.map((t) => `<button type="button" class="chip" data-value="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div></div>` : '');
  const filters = posts.length > 3 ? `<div class="filters" hidden>${chips('Type', kinds, 'kind')}${chips('Thématique', themes, 'theme')}<p class="filters__count" role="status" aria-live="polite"></p></div>` : '';
  const grid = posts.length
    ? `<div class="grid grid--3 posts-grid">${posts.map((p) => postCard(p, ctx)).join('\n')}</div><p class="empty" hidden>Aucun article ne correspond à cette sélection.</p>`
    : `<div class="card card--empty"><h3>Les premiers articles arrivent bientôt</h3><p>Notre blog ouvre prochainement. En attendant, découvrez <a href="/a-propos/">notre association</a>.</p></div>`;
  const hero = renderBlocks([{ type: 'hero', variante: 'page', titre: 'Le blog de Mecenia', sous_titre: 'Analyses, comptes rendus et réflexions sur la culture comme richesse économique et pouvoir d’influence pour la France.' }], ctx);
  return hero + section({ fond: 'blanc' }, `${filters}${grid}`);
}

/* ---------- Article ---------- */
function renderPost(p, ctx) {
  const html = figures(block(p.body)) + p.blocks.map(postBlock).join('\n');
  const minutes = readingMinutes(p.body + ' ' + p.blocks.map((b) => b.texte || '').join(' '));
  const tags = [p.kind].concat(p.themes).filter(Boolean);
  const hero = `<section class="hero hero--page hero--post">
<div class="container">
<nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a></nav>
<h1>${esc(p.title)}</h1>
<p class="hero__sub post-meta"><time datetime="${isoDate(p.date)}">Publié le ${fmt(p.date)}</time><span aria-hidden="true">·</span><span>${minutes} min de lecture</span></p>
${tags.length ? `<ul class="tags tags--light" aria-label="Thématiques">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
</div>
</section>`;
  const cover = p.image ? `<figure class="post-cover">${img(p.image, p.title, '', '').replace('loading="lazy"', 'fetchpriority="high"')}</figure>` : '';
  const others = ctx.posts.filter((o) => o.slug !== p.slug).slice(0, 3);
  const more = others.length ? section({ fond: 'beige' }, `${sectionHead({ eyebrow: 'Poursuivre la lecture', titre: 'À lire aussi' })}<div class="grid grid--3">${others.map((o) => postCard(o, ctx)).join('\n')}</div>`) : '';
  const cta = renderBlocks([{ type: 'cta', fond: 'sombre', titre: 'Envie de participer à la conversation ?', texte: 'Rejoignez Mecenia ou écrivez-nous : nous construisons ce dialogue entre culture et économie avec nos premiers membres et partenaires.', boutons: [{ label: 'Adhérer à Mecenia', url: '/adherer/', style: 'principal' }, { label: 'Nous contacter', url: '/contact/', style: 'secondaire' }] }], ctx);
  return `<div class="read-progress" aria-hidden="true"><span></span></div>${hero}
<section class="sec bg-paper"><div class="container narrow">${cover}<article class="prose post">${html}</article><p class="center sec-more"><a class="link-arrow" href="/blog/">Tous les articles</a></p></div></section>
${more}${cta}`;
}

module.exports = { renderIndex, renderPost, minutesOf: (p) => readingMinutes(p.body) };

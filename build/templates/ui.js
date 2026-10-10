'use strict';
const { esc } = require('../lib/util');
const { block, inline } = require('../lib/md');

const FOND = { blanc: 'paper', beige: 'sand', sombre: 'ink', degrade: 'deep' };
const fond = (f) => FOND[f] || 'paper';

const attr = (name, v) => (v ? ` ${name}="${esc(v)}"` : '');

function button(b) {
  if (!b || !b.url) return '';
  const label = esc(b.label);
  if (b.style === 'lien') return `<a class="link-arrow" href="${esc(b.url)}">${label}</a>`;
  const cls = b.style === 'secondaire' ? 'btn btn--ghost' : 'btn';
  return `<a class="${cls}" href="${esc(b.url)}">${label}</a>`;
}
const buttons = (list) => (list && list.length ? `<div class="btn-row">${list.map(button).join('')}</div>` : '');

/** En-tête de section : surtitre, titre, introduction (Markdown en ligne). */
function sectionHead(b, { level = 2, left = false } = {}) {
  if (!b.eyebrow && !b.titre && !b.intro) return '';
  return `<header class="sec-head${left ? ' sec-head--left' : ''}">${b.eyebrow ? `<p class="eyebrow">${esc(b.eyebrow)}</p>` : ''}${b.titre ? `<h${level} class="title">${inline(b.titre)}</h${level}>` : ''}${b.intro ? `<p class="lead">${inline(b.intro)}</p>` : ''}</header>`;
}

function section(b, inner, extra = '') {
  return `<section class="sec bg-${fond(b.fond)}${extra ? ' ' + extra : ''}"${attr('id', b.id)}>\n<div class="container">\n${inner}\n</div>\n</section>`;
}

function img(src, alt, cls = '', extra = '') {
  return `<img${cls ? ` class="${cls}"` : ''} src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy" decoding="async"${extra}>`;
}

/** Carte d'article (liste du blog, accueil, articles associés). */
function postCard(p, { fmt }) {
  const media = p.image ? `<span class="card-media">${img(p.image, '')}</span>` : '';
  const tags = [p.kind].concat(p.themes).filter(Boolean).slice(0, 3).map((t) => `<li>${esc(t)}</li>`).join('');
  return `<article class="post-card" data-kind="${esc(p.kind)}" data-themes="${esc(p.themes.join('|'))}">
<a href="/blog/${esc(p.slug)}/">
${media}
<span class="post-card__body">
<time datetime="${p.date.toISOString().slice(0, 10)}">${fmt(p.date)}</time>
<h3>${esc(p.title)}</h3>
<p>${esc(p.description)}</p>
${tags ? `<ul class="tags" aria-label="Thématiques">${tags}</ul>` : ''}
<span class="link-arrow" aria-hidden="true">Lire l’article</span>
</span>
</a>
</article>`;
}

module.exports = { fond, attr, button, buttons, sectionHead, section, img, postCard, block, inline };

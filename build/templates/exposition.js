'use strict';
const { esc } = require('../lib/util');
const { block, inline } = require('../lib/md');
const U = require('./ui');
const { section, img, button } = U;

const commonsUrl = (file) => 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' + encodeURIComponent(String(file).replace(/ /g, '_'));

function work(w) {
  const src = w.image || (w.commons_file ? commonsUrl(w.commons_file) : '');
  const credit = [
    w.credit ? esc(w.credit) : '',
    w.license_name ? (w.license_url ? `<a href="${esc(w.license_url)}" target="_blank" rel="noopener">${esc(w.license_name)}</a>` : esc(w.license_name)) : '',
    w.image_source_url ? `<a href="${esc(w.image_source_url)}" target="_blank" rel="noopener">Source de l’image</a>` : ''
  ].filter(Boolean).join(' · ');
  return `<article class="work${w.contrepoint ? ' work--counter' : ''}" id="${esc(w.id)}">
<figure class="work__media">${src ? img(src, w.alt) : ''}${credit ? `<figcaption>${credit}</figcaption>` : ''}</figure>
<div class="work__body">
${w.status ? `<p class="badge">${esc(w.status)}</p>` : ''}
<h3>${esc(w.title)}</h3>
<p class="work__meta">${[w.date, w.medium, w.origin].filter(Boolean).map(esc).join(' · ')}</p>
<h4>Regarder l’œuvre</h4>
<p>${inline(w.notice || '')}</p>
${w.complement ? `<p>${inline(w.complement)}</p>` : ''}
<h4>Le regard de Mecenia</h4>
<p>${inline(w.reading || '')}</p>
${w.source ? `<p><a class="link-arrow" href="${esc(w.source)}" target="_blank" rel="noopener">Source institutionnelle</a></p>` : ''}
${w.transition ? `<p class="work__next">${inline(w.transition)}</p>` : ''}
</div>
</article>`;
}

function render(e) {
  const acts = (e.acts || []).map((a) => {
    const works = (e.works || []).filter((w) => +w.act === +a.n).map(work).join('\n');
    return `<section class="sec bg-${a.n % 2 ? 'paper' : 'sand'}" id="etape-${a.n}"><div class="container">
<header class="sec-head sec-head--left"><p class="eyebrow">Étape ${a.n}</p><h2 class="title">${esc(a.title)}</h2><p class="lead lead--left">${inline(a.text)}</p></header>
<div class="works">${works}</div></div></section>`;
  }).join('\n');
  const hero = `<section class="hero hero--page hero--expo"><div class="container">
${e.eyebrow ? `<p class="eyebrow eyebrow--gold">${esc(e.eyebrow)}</p>` : ''}
<h1>${esc(e.title)}</h1>
<p class="hero__sub">${inline(e.hero_subtitle || '')}</p>
<div class="btn-row"><a class="btn" href="#etape-1">Commencer le parcours</a>${e.article_url ? `<a class="btn btn--ghost" href="${esc(e.article_url)}">Lire l’article</a>` : ''}</div>
</div></section>`;
  const intro = section({ fond: 'blanc' }, `<div class="narrow"><header class="sec-head sec-head--left"><h2 class="title">${esc(e.intro_title || '')}</h2></header><div class="prose">${(e.intro_paragraphs || []).map((p) => `<p>${inline(p)}</p>`).join('')}</div>
${e.project_url ? `<p>${button({ label: e.project_link_label || 'Découvrir le projet officiel', url: e.project_url, style: 'lien' }).replace('href=', 'target="_blank" rel="noopener" href=')}</p>` : ''}
${e.note ? `<p class="note">${inline(e.note)}</p>` : ''}</div>`);
  const end = section({ fond: 'beige' }, `<div class="narrow"><header class="sec-head sec-head--left"><h2 class="title">${esc(e.method_title || 'Pour approfondir')}</h2></header><div class="prose">${[e.method_text, e.images_text, e.update_note].filter(Boolean).map((t) => `<p>${inline(t)}</p>`).join('')}</div></div>`);
  const cta = section({ fond: 'sombre' }, `<div class="cta"><h2>${esc(e.cta_title || '')}</h2><p>${inline(e.cta_text || '')}</p>${e.article_url ? `<div class="btn-row"><a class="btn" href="${esc(e.article_url)}">Lire notre article sur la cour du Sphinx</a></div>` : ''}</div>`, 'sec--cta');
  return hero + intro + acts + end + cta;
}

module.exports = { render };

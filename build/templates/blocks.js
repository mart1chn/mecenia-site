'use strict';
const { esc, roman, fmtDate, parseDate } = require('../lib/util');
const U = require('./ui');
const { block, inline, button, buttons, sectionHead, section, img, postCard } = U;

/* ---------- Héros ---------- */
function hero(b, ctx) {
  const crumbs = ctx.page.path !== '/' && !ctx.page.noindex
    ? `<nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">${esc(b.titre)}</span></nav>` : '';
  if (b.variante === 'accueil') {
    return `<section class="hero hero--home">
<div class="container hero__grid">
<div class="hero__text">
${b.eyebrow ? `<p class="eyebrow eyebrow--gold">${esc(b.eyebrow)}</p>` : ''}
<h1>${esc(b.titre)}</h1>
${b.sous_titre ? `<p class="hero__sub">${inline(b.sous_titre)}</p>` : ''}
${buttons(b.boutons)}
</div>
<div class="hero__art" aria-hidden="true"><div class="arch"><img src="/assets/img/mecenia-icon-hero.png" alt="" width="212" height="241"></div></div>
</div>
</section>`;
  }
  return `<section class="hero hero--page">
<div class="container">
${crumbs}
<h1>${esc(b.titre)}</h1>
${b.sous_titre ? `<p class="hero__sub">${inline(b.sous_titre)}</p>` : ''}
${buttons(b.boutons)}
</div>
</section>`;
}

/* ---------- Texte (avec image facultative) ---------- */
function texte(b) {
  const body = block(b.texte);
  const actions = buttons(b.boutons);
  if (!b.image) {
    return section(b, `<div class="narrow">${sectionHead(b, { left: true })}<div class="prose">${body}</div>${actions}</div>`);
  }
  const side = b.image_cote === 'gauche' ? 'split--rev' : '';
  const logo = b.image_style === 'logo';
  const fig = `<figure class="split__media${logo ? ' split__media--logo' : ''}">${img(b.image, b.image_alt)}${b.image_legende ? `<figcaption>${inline(b.image_legende)}</figcaption>` : ''}</figure>`;
  return section(b, `<div class="split ${side}"><div class="split__text">${sectionHead(b, { left: true })}<div class="prose">${body}</div>${actions}</div>${fig}</div>`);
}

function texteLong(b) {
  return section(b, `<div class="narrow"><div class="prose prose--legal">${block(b.texte)}</div></div>`);
}

/* ---------- Cartes ---------- */
function cartes(b) {
  const cols = [2, 3, 4].includes(+b.colonnes) ? +b.colonnes : 3;
  const num = b.style === 'numerote';
  const cards = (b.cartes || []).map((c, i) => `<article class="card${num ? ' card--num' : ''}">
${num ? `<span class="card__num" aria-hidden="true">${roman(i + 1)}</span>` : ''}
<h3>${inline(c.titre)}</h3>
<p>${inline(c.texte)}</p>
${c.pied ? `<p class="card__foot">${inline(c.pied)}</p>` : ''}
${c.lien_url ? `<a class="link-arrow" href="${esc(c.lien_url)}">${esc(c.lien_label || 'En savoir plus')}</a>` : ''}
</article>`).join('\n');
  const more = b.lien_url ? `<p class="sec-more"><a class="link-arrow" href="${esc(b.lien_url)}">${esc(b.lien_label || 'En savoir plus')}</a></p>` : '';
  return section(b, `${sectionHead(b)}<div class="grid grid--${cols}">${cards}</div>${more}`);
}

/* ---------- Étapes ---------- */
function etapes(b) {
  const items = (b.etapes || []).map((s, i) => `<li><span class="step__n" aria-hidden="true">${i + 1}</span><div><h3>${inline(s.titre)}</h3><p>${inline(s.texte)}</p></div></li>`).join('');
  return section(b, `${sectionHead(b)}<ol class="steps">${items}</ol>${b.note ? `<p class="note">${inline(b.note)}</p>` : ''}`);
}

/* ---------- FAQ / accordéon (éléments <details> natifs) ---------- */
function faq(b) {
  const items = (b.questions || []).map((q) => `<details class="acc">
<summary>${q.etiquette ? `<span class="acc__tag">${esc(q.etiquette)}</span>` : ''}<span class="acc__q">${inline(q.question)}</span>${q.resume ? `<span class="acc__sum">${inline(q.resume)}</span>` : ''}<span class="acc__icon" aria-hidden="true"></span></summary>
<div class="acc__a">${block(q.reponse)}</div>
</details>`).join('\n');
  const more = b.lien_url ? `<p class="sec-more"><a class="link-arrow" href="${esc(b.lien_url)}">${esc(b.lien_label || 'En savoir plus')}</a></p>` : '';
  return section(b, `${sectionHead(b)}<div class="acc-list">${items}</div>${more}`);
}

/* ---------- Chiffres clés ---------- */
function chiffres(b, ctx) {
  const d = ctx.data.chiffres || { items: [] };
  const items = (d.items || []).map((s) => `<div class="stat"><b>${esc(s.valeur)}</b><span>${esc(s.libelle)}</span></div>`).join('');
  return section(b, `${sectionHead(b)}<div class="stats">${items}</div>${d.source ? `<p class="note note--center">${inline(d.source)}</p>` : ''}`);
}

/* ---------- Citation ---------- */
function citation(b) {
  return section(b, `<figure class="bigquote"><blockquote><p>« ${inline(b.texte)} »</p></blockquote>${b.auteur ? `<figcaption><b>${esc(b.auteur)}</b>${b.source ? `, ${esc(b.source)}` : ''}</figcaption>` : ''}</figure>
${b.suite ? `<p class="bigquote__after">${inline(b.suite)}</p>` : ''}
${b.bouton ? `<p class="center">${button(Object.assign({ style: 'secondaire' }, b.bouton))}</p>` : ''}`);
}

/* ---------- Triptyque d'œuvres ---------- */
function triptyque(b) {
  const figs = (b.images || []).map((i) => `<figure class="tri">${img(i.src, i.alt)}<figcaption>${inline(i.legende || '')}</figcaption></figure>`).join('');
  return section(b, `${sectionHead(b, { left: true })}<div class="prose prose--wide">${block(b.texte)}</div><div class="triptych">${figs}</div>`);
}

/* ---------- Bandeau d'œuvre ---------- */
function bandeauOeuvre(b) {
  const fig = `<figure class="band__media">${img(b.image, b.image_alt)}<figcaption>${inline(b.legende || '')}</figcaption></figure>`;
  const text = `<div class="band__text">${sectionHead(b, { left: true })}<div class="prose">${block(b.texte)}</div></div>`;
  return section(b, `<div class="band${b.inverse ? ' band--rev' : ''}">${b.inverse ? fig + text : text + fig}</div>`);
}

/* ---------- Derniers articles (défilement horizontal natif) ---------- */
function blogRecents(b, ctx) {
  const list = ctx.posts.slice(0, +b.nombre || 3).map((p) => postCard(p, ctx)).join('\n');
  if (!list) return '';
  return section(b, `${sectionHead(b)}<div class="rail" tabindex="0" role="region" aria-label="Derniers articles">${list}</div><p class="sec-more"><a class="link-arrow" href="/blog/">${esc(b.lien_label || 'Tous les articles')}</a></p>`);
}

/* ---------- Fondateurs / équipe ---------- */
function fondateurs(b, ctx) {
  const people = (ctx.data.equipe.membres || []).filter((m) => (b.mode === 'presentations' ? m.presentation : m.mot));
  const cards = people.map((m) => `<article class="person">
${m.photo ? `<span class="person__photo">${img(m.photo, m.alt || m.nom)}</span>` : ''}
<div>
<h3>${esc(m.nom)}</h3>
<p class="person__role">${esc(m.fonction)}${m.parcours ? ` · ${esc(m.parcours)}` : ''}</p>
${b.mode === 'presentations' ? `<p>${inline(m.presentation)}</p>` : `<blockquote><p>${inline(m.mot)}</p></blockquote>`}
</div>
</article>`).join('\n');
  const more = b.lien_url ? `<p class="sec-more"><a class="link-arrow" href="${esc(b.lien_url)}">${esc(b.lien_label)}</a></p>` : '';
  return section(b, `${sectionHead(b)}<div class="people">${cards}</div>${more}`);
}

/* ---------- Organigramme ---------- */
function organigramme(b, ctx) {
  const eq = ctx.data.equipe;
  const organes = (eq.organes || []).map((o) => `<li><h3>${esc(o.nom)}</h3><p>${inline(o.description)}</p></li>`).join('');
  const groupes = {};
  for (const m of eq.membres || []) (groupes[m.groupe || 'Équipe'] = groupes[m.groupe || 'Équipe'] || []).push(m);
  const noms = Object.keys(groupes).map((g) => `<div class="org__group"><h3>${esc(g)}</h3><ul>${groupes[g].map((m) => `<li><b>${esc(m.nom)}</b><span>${esc(m.fonction)}</span></li>`).join('')}</ul></div>`).join('');
  return section(b, `${sectionHead(b)}<div class="org"><div class="org__people">${noms}</div><ol class="org__organs">${organes}</ol></div>`);
}

/* ---------- Partenaires (masqué si vide) ---------- */
function partenaires(b, ctx) {
  const items = (ctx.data.partenaires.items || []);
  if (!items.length) return '';
  const li = items.map((p) => {
    const inner = p.logo ? img(p.logo, p.nom) : `<span>${esc(p.nom)}</span>`;
    return `<li>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.nom)}">${inner}</a>` : inner}</li>`;
  }).join('');
  return section(b, `${sectionHead(b)}<ul class="logos">${li}</ul>`);
}

/* ---------- Événements (liste alimentée par content/data/evenements.yml) ---------- */
function evenementsListe(b, ctx) {
  const items = (ctx.data.evenements.items || []).slice().sort((a, c) => String(a.date).localeCompare(String(c.date)));
  if (!items.length) {
    return section(b, `<div class="narrow">${sectionHead({ eyebrow: b.eyebrow, titre: b.titre_vide, intro: b.intro_vide }, { left: true })}<div class="prose">${block(b.texte_vide)}</div></div>`);
  }
  const cards = items.map((e) => `<article class="card event">
<p class="event__meta">${esc(e.type || 'Événement')} · <time datetime="${esc(e.date)}">${esc(fmtDate(parseDate(e.date)))}</time>${e.heure ? ` · ${esc(e.heure)}` : ''}${e.lieu ? ` · ${esc(e.lieu)}` : ''}</p>
<h3>${esc(e.titre)}</h3>
<p>${inline(e.description || '')}</p>
${e.lien_url ? `<a class="link-arrow" href="${esc(e.lien_url)}">${esc(e.lien_label || 'En savoir plus')}</a>` : ''}
</article>`).join('');
  return section(b, `${sectionHead(b)}<div class="grid grid--2">${cards}</div>`);
}

/* ---------- Ressources (liste alimentée par content/data/ressources.yml) ---------- */
function ressourcesListe(b, ctx) {
  const items = ctx.data.ressources.items || [];
  if (!items.length) return '';
  const li = items.map((r) => `<li><div><p class="event__meta">${esc(r.type || 'Document')}${r.date ? ` · ${esc(fmtDate(parseDate(r.date)))}` : ''}</p><h3>${esc(r.titre)}</h3><p>${inline(r.description || '')}</p></div>${r.fichier ? `<a class="btn btn--ghost btn--sm" href="${esc(r.fichier)}" download>Télécharger</a>` : ''}</li>`).join('');
  return section(b, `${sectionHead(b)}<ul class="docs">${li}</ul>`);
}

/* ---------- Appel à l'action ---------- */
function cta(b) {
  return section(b, `<div class="cta"><h2>${inline(b.titre)}</h2>${b.texte ? `<p>${inline(b.texte)}</p>` : ''}${buttons(b.boutons)}</div>`, 'sec--cta');
}

/* ---------- Formulaires (Netlify Forms) ---------- */
const CONSENT = (extra = '') => `<label class="check"><input type="checkbox" name="consentement" value="oui" required><span>J’accepte que Mecenia traite ces informations pour répondre à ma demande, conformément à la <a href="/mentions-legales/#confidentialite">politique de confidentialité</a>. *</span></label>
<label class="check"><input type="checkbox" name="newsletter" value="oui"><span>Je souhaite recevoir par e-mail la future newsletter mensuelle de Mecenia : actualités de l’association, articles, sélection d’expositions et prochains événements. J’accepte l’utilisation de mon adresse e-mail à cette fin, conformément à la <a href="/mentions-legales/#newsletter">politique de confidentialité</a>. Je pourrai retirer mon consentement à tout moment.</span></label>`;

const field = (id, label, { type = 'text', req = false, auto = '', hint = '', tag = 'input', rows = 6, ph = '' } = {}) => {
  const l = `<label for="${id}">${esc(label)}${req ? ' <abbr title="obligatoire">*</abbr>' : ' <span class="opt">(facultatif)</span>'}</label>`;
  const common = `id="${id}" name="${id}"${req ? ' required' : ''}${auto ? ` autocomplete="${auto}"` : ''}${ph ? ` placeholder="${esc(ph)}"` : ''}`;
  const ctrl = tag === 'textarea' ? `<textarea ${common} rows="${rows}"></textarea>` : `<input type="${type}" ${common}>`;
  return `<div class="field">${l}${ctrl}${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
};

function formAdhesion() {
  return `<form class="form" name="adhesion" method="POST" action="/merci/" data-netlify="true" netlify-honeypot="bot-field">
<input type="hidden" name="form-name" value="adhesion">
<p class="hp" aria-hidden="true"><label>Ne pas remplir : <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
<div class="field"><label for="type-adhesion">Je souhaite <abbr title="obligatoire">*</abbr></label><select id="type-adhesion" name="type-adhesion" required>
<option value="membre-actif">Devenir membre actif (personne physique)</option>
<option value="partenaire">Devenir membre partenaire (personne morale)</option>
<option value="suivre">Suivre les travaux de Mecenia</option></select></div>
<div class="row">${field('prenom', 'Prénom', { req: true, auto: 'given-name' })}${field('nom', 'Nom', { req: true, auto: 'family-name' })}</div>
${field('email', 'Adresse e-mail', { type: 'email', req: true, auto: 'email' })}
<div class="row">${field('telephone', 'Téléphone', { type: 'tel', auto: 'tel' })}${field('organisation', 'Organisation', { auto: 'organization' })}</div>
${field('fonction', 'Fonction ou parcours', { auto: 'organization-title' })}
${field('motivations', 'Votre parcours et vos motivations', { tag: 'textarea', req: true, ph: 'Présentez-vous en quelques lignes et dites-nous ce qui vous attire dans Mecenia.' })}
${CONSENT()}
<button class="btn" type="submit">Envoyer ma demande</button>
<p class="status" role="status" aria-live="polite"></p>
</form>`;
}

function formContact() {
  const opts = ['Question générale', 'Partenariat', 'Presse et médias', 'Proposition d’intervention ou d’événement', 'Autre'];
  return `<form class="form" name="contact" method="POST" action="/merci/" data-netlify="true" netlify-honeypot="bot-field">
<input type="hidden" name="form-name" value="contact">
<p class="hp" aria-hidden="true"><label>Ne pas remplir : <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
${field('nom', 'Nom', { req: true, auto: 'name' })}
${field('email', 'Adresse e-mail', { type: 'email', req: true, auto: 'email' })}
<div class="field"><label for="sujet">Sujet <abbr title="obligatoire">*</abbr></label><select id="sujet" name="sujet" required>${opts.map((o) => `<option>${esc(o)}</option>`).join('')}</select></div>
${field('message', 'Votre message', { tag: 'textarea', req: true })}
${CONSENT()}
<button class="btn" type="submit">Envoyer</button>
<p class="status" role="status" aria-live="polite"></p>
</form>`;
}

function formulaire(b, ctx) {
  const form = b.formulaire === 'adhesion' ? formAdhesion() : formContact();
  const head = `${sectionHead({ eyebrow: b.eyebrow, titre: b.titre }, { left: true })}`;
  if (b.avec_coordonnees) {
    const s = ctx.site;
    const reseaux = (s.reseaux || []).map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.nom)}</a>`).join(' · ');
    const aside = `<aside class="contact-card" aria-label="Coordonnées"><dl><dt>E-mail</dt><dd><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></dd><dt>Localisation</dt><dd>${esc(s.ville)}</dd><dt>Réseaux</dt><dd>${reseaux}</dd></dl>${b.note_adhesion ? `<p>${inline(b.note_adhesion)}</p>` : ''}</aside>`;
    return section(b, `<div class="split split--form"><div>${head}${b.intro ? `<p class="lead lead--left">${inline(b.intro)}</p>` : ''}${form}</div>${aside}</div>`);
  }
  return section(b, `<div class="narrow">${head}${b.intro ? `<p class="lead lead--left">${inline(b.intro)}</p>` : ''}${form}</div>`);
}

const RENDERERS = { hero, texte, texte_long: texteLong, cartes, etapes, faq, chiffres, citation, triptyque, bandeau_oeuvre: bandeauOeuvre, blog_recents: blogRecents, fondateurs, organigramme, partenaires, evenements_liste: evenementsListe, ressources_liste: ressourcesListe, cta, formulaire };

function renderBlocks(blocs, ctx) {
  return (blocs || []).map((b) => {
    const fn = RENDERERS[b.type];
    if (!fn) throw new Error(`Bloc inconnu « ${b.type} » dans ${ctx.page.path}`);
    return fn(b, ctx);
  }).join('\n');
}

module.exports = { renderBlocks, RENDERERS };

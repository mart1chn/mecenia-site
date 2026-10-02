'use strict';
/* Retouches finales robustes : badges des fondateurs, blog et lettre mensuelle parmi les projets. */
const fs = require('fs'), path = require('path');
const OUT = path.join(process.cwd(), 'dist');
function edit(rel, fn) {
  const p = path.join(OUT, rel);
  if (!fs.existsSync(p)) { console.warn('Retouches : page absente ' + rel); return; }
  const before = fs.readFileSync(p, 'utf8'), after = fn(before);
  if (after !== before) fs.writeFileSync(p, after);
}
const chips = list => '<div class="chips">' + list.map(x => '<span class="chip">' + x + '</span>').join('') + '</div>';
function setChips(h, marker, list) {
  const i = h.indexOf(marker);
  if (i < 0) { console.warn('Retouches : fondateur introuvable (' + marker + ')'); return h; }
  const re = /<div class="chips">[\s\S]*?<\/div>/g; re.lastIndex = i;
  const m = re.exec(h);
  if (!m) { console.warn('Retouches : badges introuvables (' + marker + ')'); return h; }
  return h.slice(0, m.index) + chips(list) + h.slice(m.index + m[0].length);
}
edit('equipe/index.html', h => {
  h = setChips(h, 'Pauline Bion</h3>', ['Histoire de l’art', 'École du Louvre', 'Médiation culturelle']);
  return setChips(h, 'Martin Chanteranne</h3>', ['Droit', 'CEIPI', 'Propriété intellectuelle']);
});
const pcard = (tag, title, sub, body, attr) => '<article class="pcard"' + (attr || '') + '><span class="tag">' + tag + '</span><h3>' + title + '</h3><p class="s">' + sub + '</p><button class="plus-btn" type="button" aria-expanded="false" aria-label="Afficher le détail : ' + title + '"><span class="ico" aria-hidden="true"></span></button><div class="plus-panel"><div><div class="plus-inner">' + body + '</div></div></div></article>\n    ';
const BLOG = pcard('Blog', 'Le blog de Mecenia', 'Analyses, comptes rendus et réflexions sur la culture comme richesse économique.', '<p>Notre blog publie des analyses, des comptes rendus d’événements et des réflexions sur la culture comme richesse économique et pouvoir d’influence. Les articles se classent par thématique (cinéma, peinture, sculpture…) et par type (actualité, événement, exposition…). <a class="link" href="/blog/">Lire le blog</a></p>', ' data-proj="blog"');
const LETTRE = pcard('À venir', 'La lettre mensuelle de Mecenia', 'Un rendez-vous pour découvrir nos actualités et notre sélection culturelle.', '<p>À l’étude : une newsletter mensuelle réunissant les nouveautés de Mecenia, les articles publiés dans le mois, une sélection d’expositions à découvrir et nos prochains événements. Son lancement et son calendrier seront annoncés ultérieurement. L’inscription sera facultative.</p>', ' data-proj="lettre"');
function firstCard(h, marker) {
  const a = h.indexOf(marker);
  if (a < 0) { console.warn('Retouches : section introuvable (' + marker + ')'); return null; }
  const b = h.indexOf('</section>', a), f = h.indexOf('<article class="pcard"', a);
  if (b < 0 || f < 0 || f > b) { console.warn('Retouches : liste des projets introuvable (' + marker + ')'); return null; }
  return { a, b, f };
}
edit('index.html', h => {
  if (h.includes('data-proj="blog"')) return h;
  const s = firstCard(h, 'Ce que nous lançons dès à présent');
  return s ? h.slice(0, s.f) + BLOG + h.slice(s.f) : h;
});
edit('nos-projets/index.html', h => {
  if (h.includes('data-proj="blog"')) return h;
  let s = firstCard(h, 'Nos projets, concrètement');
  if (!s) return h;
  const w = h.indexOf('Premier webinaire Mecenia', s.a);
  if (w > 0 && w < s.b) {
    const start = h.lastIndexOf('<article class="pcard"', w), end = h.indexOf('</article>', w) + '</article>'.length;
    if (start >= s.a && end > start) h = h.slice(0, start) + h.slice(end).replace(/^\s+/, '') ;
  }
  s = firstCard(h, 'Nos projets, concrètement');
  return s ? h.slice(0, s.f) + BLOG + LETTRE + h.slice(s.f) : h;
});
console.log('Retouches : badges fondateurs, blog et lettre mensuelle appliqués.');
try { require('./blog-reading.js'); } catch (e) { console.warn('Lecture : étape ignorée', e.message); }

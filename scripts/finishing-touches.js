'use strict';
/* Retouches finales robustes : badges des fondateurs et carte de la future lettre mensuelle. */
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
const TAG = 'À venir', TITLE = 'La lettre mensuelle de Mecenia';
const SUB = 'Un rendez-vous pour découvrir nos actualités et notre sélection culturelle.';
const BODY = '<p>À l’étude : une newsletter mensuelle réunissant les nouveautés de Mecenia, les articles publiés dans le mois, une sélection d’expositions à découvrir et nos prochains événements. Son lancement et son calendrier seront annoncés ultérieurement. L’inscription sera facultative.</p>';
const HEAD = '<span class="pt"><small class="pk">' + TAG + '</small>' + TITLE + '<small class="ps">' + SUB + '</small></span><span class="ico" aria-hidden="true"></span>';
edit('nos-projets/index.html', h => {
  if (h.includes(TITLE)) return h;
  const a = h.indexOf('Nos projets, concrètement');
  if (a < 0) { console.warn('Retouches : section des projets introuvable'); return h; }
  const b = h.indexOf('</section>', a);
  const inner = h.slice(a, b);
  const m = inner.match(/(<\/div>\s*)(<\/div>\s*)$/);
  if (!m) { console.warn('Retouches : fin de la liste des projets introuvable'); return h; }
  const item = inner.includes('<details class="plus-item"')
    ? '<details class="plus-item"><summary class="plus-btn">' + HEAD + '</summary><div class="plus-inner">' + BODY + '</div></details>'
    : '<div class="plus-item"><button class="plus-btn" type="button" aria-expanded="false">' + HEAD + '</button><div class="plus-panel"><div><div class="plus-inner">' + BODY + '</div></div></div></div>';
  const cut = a + inner.length - m[0].length;
  return h.slice(0, cut) + item + h.slice(cut, b) + h.slice(b);
});
console.log('Retouches : badges fondateurs et lettre mensuelle appliqués.');

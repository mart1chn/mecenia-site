'use strict';
/* Étape finale du build : menus déroulants « + » à la place des cartes retournables, et images d'œuvres d'art
   (domaine public / CC0, liées depuis Wikimedia Commons). N'échoue jamais : en cas de souci, le site reste tel quel. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = process.cwd(), OUT = path.join(ROOT, 'dist');
const enc = encodeURIComponent;

/* 1. Accessoires (feuille de style et script des menus déroulants) */
try {
  fs.copyFileSync(path.join(ROOT, 'scripts', 'culture.css'), path.join(OUT, 'assets', 'culture.css'));
  fs.copyFileSync(path.join(ROOT, 'scripts', 'accordion.js'), path.join(OUT, 'assets', 'accordion.js'));
} catch (e) { console.error('Enhance : fichiers annexes introuvables', e.message); process.exit(0); }

/* 2. Images (Wikimedia Commons) */
const ART = {
  monet: { f: 'Claude_Monet,_Impression,_soleil_levant,_1872.jpg', w: 1051, h: 808, lic: 'Domaine public', alt: 'Tableau de Claude Monet : un soleil orange se lève sur un port dans la brume bleutée', cap: 'Claude Monet, <i>Impression, soleil levant</i>, 1872. Musée Marmottan Monet, Paris.' },
  hokusai: { f: 'Great_Wave_off_Kanagawa2.jpg', w: 8242, h: 5640, lic: 'Domaine public', alt: 'Estampe de Hokusai : une immense vague se dresse devant le mont Fuji', cap: 'Katsushika Hokusai, <i>La Grande Vague au large de Kanagawa</i>, vers 1830. Estampe japonaise, Library of Congress.' },
  starry: { f: 'Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', w: 30000, h: 23756, lic: 'Domaine public', alt: 'Tableau de Van Gogh : un ciel nocturne tourbillonnant au-dessus d’un village et d’un cyprès', cap: 'Vincent van Gogh, <i>La Nuit étoilée</i>, 1889. Museum of Modern Art, New York.' },
  robert: { f: 'Hubert_Robert_-_Imaginary_View_of_the_Grande_Galerie_in_the_Louvre_in_Ruins_-_WGA19589.jpg', w: 1224, h: 950, lic: 'Domaine public', alt: 'Peinture de Hubert Robert : la Grande Galerie du Louvre imaginée en ruines, avec des visiteurs et des dessinateurs', cap: 'Hubert Robert, <i>Vue imaginaire de la Grande Galerie du Louvre en ruines</i>, 1796. Musée du Louvre, Paris.' },
  delacroix: { f: 'Eugène_Delacroix_-_Le_28_Juillet._La_Liberté_guidant_le_peuple.jpg', w: 5946, h: 4771, lic: 'Domaine public', alt: 'Tableau de Delacroix : une femme brandissant le drapeau tricolore mène un peuple en armes', cap: 'Eugène Delacroix, <i>La Liberté guidant le peuple</i>, 1830. Musée du Louvre, Paris.' },
  church: { f: 'Parthenon_(1871)_Frederic_Edwin_Church.jpg', w: 5898, h: 3627, lic: 'Domaine public', alt: 'Tableau de Frederic Edwin Church : le Parthénon d’Athènes au coucher du soleil', cap: 'Frederic Edwin Church, <i>Le Parthénon</i>, 1871. Metropolitan Museum of Art, New York.' },
  athens: { f: 'The_School_of_Athens_by_Raffaello_Sanzio_da_Urbino_in_Vatican.jpg', w: 20111, h: 13936, lic: 'CC0', alt: 'Fresque de Raphaël : des philosophes et des savants discutent sous de grandes arcades', cap: 'Raphaël, <i>L’École d’Athènes</i>, 1509-1511. Fresque, Stanza della Segnatura, Vatican.' },
  nightwatch: { f: 'The_Nightwatch_by_Rembrandt_-_Rijksmuseum.jpg', w: 14168, h: 11528, lic: 'Domaine public', alt: 'Tableau de Rembrandt : une compagnie de gardes civiques s’apprête à marcher', cap: 'Rembrandt, <i>La Ronde de nuit</i>, 1642. Rijksmuseum, Amsterdam.' },
  mona: { f: 'Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg', w: 7479, h: 11146, lic: 'Domaine public', portrait: true, alt: 'Portrait de la Joconde par Léonard de Vinci', cap: 'Léonard de Vinci, <i>La Joconde</i>, vers 1503-1519. Musée du Louvre, Paris.' },
  vermeer: { f: 'Johannes_Vermeer_-_Woman_in_Blue_Reading_a_Letter_-_WGA24657.jpg', w: 2502, h: 3000, lic: 'Domaine public', portrait: true, alt: 'Tableau de Vermeer : une femme en bleu lit une lettre dans une pièce silencieuse', cap: 'Johannes Vermeer, <i>La Liseuse en bleu</i>, vers 1663. Rijksmuseum, Amsterdam.' }
};
function thumb(f, w) { const h = crypto.createHash('md5').update(f).digest('hex'); return 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + h[0] + '/' + h.slice(0, 2) + '/' + enc(f) + '/' + w + 'px-' + enc(f); }
function fig(k, cls) {
  const a = ART[k], w = 960, h = Math.round(w * a.h / a.w), small = 500;
  return '<figure class="art-fig' + (cls ? ' ' + cls : '') + '"><img src="' + thumb(a.f, w) + '" srcset="' + thumb(a.f, small) + ' ' + small + 'w, ' + thumb(a.f, w) + ' ' + w + 'w" sizes="' + (a.portrait ? '(max-width:860px) 80vw, 380px' : '(max-width:860px) 92vw, 520px') + '" width="' + w + '" height="' + h + '" alt="' + a.alt + '" loading="lazy" decoding="async">' +
    '<figcaption>' + a.cap + ' <a href="https://commons.wikimedia.org/wiki/File:' + enc(a.f) + '" target="_blank" rel="noopener">' + a.lic + ' · Wikimedia Commons</a></figcaption></figure>';
}
function band(bg, eyebrow, title, text, k, flip) {
  const a = ART[k], cls = a.portrait ? 'art-portrait' : '';
  const copy = '<div class="prose reveal"><span class="eyebrow" style="text-align:left">' + eyebrow + '</span><h2 style="margin-top:0">' + title + '</h2><p>' + text + '</p></div>';
  const img = '<div class="reveal">' + fig(k, cls) + '</div>';
  return '<section class="' + bg + ' art-band"><div class="container"><div class="split">' + (flip ? img + copy : copy + img) + '</div></div></section>\n';
}
const trio = '<section class="bg-white art-band"><div class="container"><span class="eyebrow reveal">Un patrimoine universel</span><h2 class="title reveal">La culture, richesse de tous les peuples</h2>' +
  '<p class="lead reveal">De l’impressionnisme français aux estampes japonaises, des nuits étoilées de Provence aux temples d’Athènes : la création n’a pas de frontière, et ce qu’elle nous laisse est un bien commun.</p>' +
  '<div class="art-trio stagger">' + fig('monet') + fig('hokusai') + fig('starry') + '</div></div></section>\n';

const PAGES = {
  'index.html': { re: /<section>\s*<div class="container">\s*<span class="eyebrow reveal">Notre mission<\/span>/, html: trio },
  'notre-histoire/index.html': { re: /<section class="bg-grad">\s*<div class="container reveal">\s*<span class="eyebrow">La conviction fondatrice<\/span>/,
    html: band('bg-white', 'Le patrimoine, un bien fragile', 'Rien n’est acquis', 'Imaginée en 1796 par Hubert Robert, cette vue de la Grande Galerie du Louvre en ruines rappelle que le patrimoine ne se transmet que si une société décide de le financer, de le protéger et de le partager. C’est tout l’enjeu de Mecenia.', 'robert', true) },
  'notre-mission/index.html': { re: /<section class="bg-dark">\s*<div class="container">\s*<span class="eyebrow reveal">Projection<\/span>/,
    html: band('bg-white', 'La culture et la cité', 'Un imaginaire commun, un enjeu public', 'De <i>La Liberté guidant le peuple</i> aux grandes collections nationales, la culture a toujours nourri l’espace public. Notre mission : lui donner toute sa place dans les décisions économiques et publiques.', 'delacroix', false) },
  'nos-valeurs/index.html': { re: /<section class="bg-white">\s*<div class="container">\s*<span class="eyebrow reveal">Nos principes d’action<\/span>/,
    html: band('bg-beige', 'Enracinement patrimonial', 'Ce que les générations se transmettent', 'Peint par Frederic Edwin Church en 1871, le Parthénon dit l’attachement de générations entières au patrimoine de l’humanité. C’est à cet héritage que Mecenia veut donner les moyens de durer.', 'church', true) },
  'nos-projets/index.html': { re: /<section class="bg-grad">\s*<div class="container">\s*<span class="eyebrow reveal">Nous accompagner<\/span>/,
    html: band('bg-beige', 'L’esprit de nos rencontres', 'Faire dialoguer les disciplines', 'Dans <i>L’École d’Athènes</i>, Raphaël réunit philosophes, mathématiciens et savants qui échangent : l’image même du dialogue entre les mondes. C’est l’esprit de nos webinaires, de nos colloques et des Rencontres de la Culture et des Affaires.', 'athens', false) },
  'equipe/index.html': { re: /<section class="bg-white">\s*<div class="container">\s*<span class="eyebrow reveal">Rejoindre l’équipe<\/span>/,
    html: band('bg-white', 'Un projet humain', 'Des visages derrière la culture', 'Un tableau, c’est d’abord un regard. De la même façon, Mecenia se construit avec des personnes, des parcours et des sensibilités différentes, réunies par la même conviction.', 'mona', true) },
  'adherer/index.html': { re: /<section class="bg-beige">\s*<div class="container">\s*<span class="eyebrow reveal">Questions fréquentes<\/span>/,
    html: band('bg-white', 'Rejoindre une compagnie', 'Chacun y a sa place', 'Dans <i>La Ronde de nuit</i>, Rembrandt peint une compagnie de citoyens qui s’avance ensemble. Mecenia est une communauté du même esprit : des personnes, des entreprises et des institutions qui agissent de concert pour la culture.', 'nightwatch', false) },
  'contact/index.html': { re: /<section class="bg-grad cta">/,
    html: band('bg-beige', 'Écrire, un art à part entière', 'Une idée, une question, un projet ?', 'Comme la liseuse de Vermeer, prenez le temps de nous écrire : nous lisons chaque message avec attention et nous répondons personnellement.', 'vermeer', true) }
};

/* 3. Menus déroulants « + » à la place des cartes retournables */
const FLIP = /<div class="flip"[^>]*>\s*<div class="face front"[^>]*>\s*(?:<span class="tag">([\s\S]*?)<\/span>)?\s*<h3>([\s\S]*?)<\/h3>\s*(?:<p class="sub">([\s\S]*?)<\/p>)?\s*<div class="foot">[\s\S]*?<\/div>\s*<\/div>\s*<div class="face back"[^>]*>\s*<div class="bk">[\s\S]*?<\/div>\s*<div class="txt">([\s\S]*?)<\/div>\s*<div class="foot">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
const GRID = /<div class="grid (?:g2|g3) stagger fgrid"[^>]*>/g;
const SWAPS = [
  ['Cliquez sur une carte pour la retourner et découvrir le détail de chaque projet.', 'Cliquez sur le « + » pour afficher le détail de chaque projet.'],
  ['Cliquez sur une carte pour la retourner.', 'Cliquez sur le « + » pour afficher le détail.'],
  ['Cliquez sur une carte pour découvrir la réponse.', 'Cliquez sur le « + » pour découvrir la réponse.'],
  ['Cliquez sur une carte pour en savoir plus sur les RCA.', 'Cliquez sur le « + » pour en savoir plus sur les RCA.'],
  ['Cliquez sur une carte pour découvrir les objectifs de chaque année.', 'Cliquez sur le « + » pour découvrir les objectifs de chaque année.']
];
function toAccordion(h) {
  let n = 0;
  h = h.replace(FLIP, (m, tag, title, sub, body) => {
    n++;
    return '<div class="plus-item"><button class="plus-btn" type="button" aria-expanded="false"><span class="pt">' + (tag ? '<small class="pk">' + tag + '</small>' : '') + title + (sub ? '<small class="ps">' + sub.replace(/<[^>]+>/g, '') + '</small>' : '') + '</span><span class="ico" aria-hidden="true"></span></button><div class="plus-panel"><div><div class="plus-inner">' + body + '</div></div></div></div>';
  });
  if (n) { h = h.replace(GRID, '<div class="accordion reveal" data-accordion>'); for (const s of SWAPS) h = h.split(s[0]).join(s[1]); }
  return { html: h, n };
}

/* 4. Application page par page */
let acc = 0, imgs = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'admin' && e.name !== 'blog') walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    try {
      const rel = path.relative(OUT, p).split(path.sep).join('/');
      let h = fs.readFileSync(p, 'utf8'); const o = h;
      const r = toAccordion(h); h = r.html; acc += r.n;
      const pg = PAGES[rel];
      if (pg) { if (pg.re.test(h)) { h = h.replace(pg.re, m => pg.html + m); imgs++; } else console.warn('Enhance : repère introuvable dans ' + rel); }
      if (h !== o) {
        if (!h.includes('/assets/culture.css')) h = h.replace('</head>', '<link rel="stylesheet" href="/assets/culture.css">\n</head>');
        if (h.includes('plus-btn') && !h.includes('/assets/accordion.js')) h = h.replace('</body>', '<script src="/assets/accordion.js" defer></script>\n</body>');
        fs.writeFileSync(p, h);
      }
    } catch (err) { console.error('Enhance : page ignorée', p, err.message); }
  }
})(OUT);
console.log('Enhance : ' + acc + ' menu(s) déroulant(s), ' + imgs + ' page(s) illustrée(s).');

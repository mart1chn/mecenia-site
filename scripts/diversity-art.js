'use strict';
/* Diversité des formes de culture : des œuvres de natures différentes, liées à chaque page et à la vision de Mecenia.
   Images du domaine public, CC0 ou sous licence libre créditée, liées depuis Wikimedia Commons. Ne fait jamais échouer le build. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const OUT = path.join(process.cwd(), 'dist');
const enc = encodeURIComponent;
const ART = {
  monet: { f: 'Claude_Monet,_Impression,_soleil_levant,_1872.jpg', w: 1051, h: 808, lic: 'Domaine public', alt: 'Tableau de Claude Monet : un soleil orange se lève sur le port du Havre dans la brume bleutée', cap: 'Claude Monet, <i>Impression, soleil levant</i>, 1872. Musée Marmottan Monet, Paris.' },
  gudea: { f: 'Gudea_statue_I_(AO_3293_and_AO_4108)_-_Musée_du_Louvre_(31064822070).jpg', w: 3456, h: 5184, lic: 'CC BY 2.0', pos: 'center 15%', alt: 'Statue assise de Gudea, prince de Lagash, les mains jointes en prière, coiffé du bonnet royal', cap: '<i>Statue de Gudea dite « Petit Gudea assis »</i>, gabbro, vers 2120-2110 av. J.-C. Mise au jour à Tello (Girsu, Irak actuel) lors des fouilles françaises. Musée du Louvre, Paris. Photo : Fred Romero.' },
  flotte: { f: 'Flotte_normande.jpg', w: 1095, h: 719, lic: 'Domaine public', alt: 'Détail de la Tapisserie de Bayeux : la flotte normande traverse la Manche, voiles gonflées', cap: '<i>Tapisserie de Bayeux</i>, la flotte normande, broderie de laine sur lin, XI<sup>e</sup> siècle.' },
  rembrandt: { f: 'Rembrandt_The_Hundred_Guilder_Print.jpg', w: 5022, h: 3648, lic: 'Domaine public', alt: 'Gravure de Rembrandt : le Christ entouré d’une foule de malades et de curieux', cap: 'Rembrandt, <i>La Gravure aux cent florins</i>, eau-forte, burin et pointe sèche, vers 1647-1649. Rijksmuseum, Amsterdam.' },
  diogene: { f: 'Rencontre_d\'Alexandre_et_de_Diogène_-_Pierre_Puget_-_Musée_du_Louvre_Sculptures_MR_2776.jpg', w: 2943, h: 3308, lic: 'CC0', alt: 'Relief de marbre de Pierre Puget : Alexandre le Grand debout devant Diogène assis près de son tonneau', cap: 'Pierre Puget, <i>Rencontre d’Alexandre et de Diogène</i>, relief en marbre, 1671-1689. Musée du Louvre, Paris.' },
  mode: { f: 'Journal_des_Dames_et_des_Demoiselles,_1_Novembre_1872,_No._1063D,_RP-P-2009-1978-1.jpg', w: 3648, h: 5194, lic: 'Domaine public', portrait: true, alt: 'Planche de mode de 1872 montrant des toilettes de dames avec robes, chapeaux et accessoires', cap: 'Planche de mode du <i>Journal des Dames et des Demoiselles</i>, 1<sup>er</sup> novembre 1872. Rijksmuseum, Amsterdam.' }
};
function thumb(f, w) { const h = crypto.createHash('md5').update(f).digest('hex'); return 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + h[0] + '/' + h.slice(0, 2) + '/' + enc(f) + '/' + w + 'px-' + enc(f); }
function fig(k) {
  const a = ART[k], w = Math.min(960, a.w - 1), small = Math.min(500, w), h = Math.round(w * a.h / a.w);
  const c = ['art-fig', a.portrait ? 'art-portrait' : ''].filter(Boolean).join(' ');
  return '<figure class="' + c + '"><img src="' + thumb(a.f, w) + '" srcset="' + thumb(a.f, small) + ' ' + small + 'w, ' + thumb(a.f, w) + ' ' + w + 'w" sizes="' + (a.portrait ? '(max-width:860px) 80vw, 380px' : '(max-width:860px) 92vw, 520px') + '" width="' + w + '" height="' + h + '" alt="' + a.alt + '"' + (a.pos ? ' style="object-position:' + a.pos + '"' : '') + ' loading="lazy" decoding="async">' +
    '<figcaption>' + a.cap + ' <a href="https://commons.wikimedia.org/wiki/File:' + enc(a.f) + '" target="_blank" rel="noopener">' + a.lic + ' · Wikimedia Commons</a></figcaption></figure>';
}
function band(bg, eyebrow, title, text, k, flip) {
  const copy = '<div class="prose reveal"><span class="eyebrow" style="text-align:left">' + eyebrow + '</span><h2 style="margin-top:0">' + title + '</h2><p>' + text + '</p></div>';
  const img = '<div class="reveal">' + fig(k) + '</div>';
  return '\n<section class="' + bg + ' art-band" data-diversity="1"><div class="container"><div class="split">' + (flip ? img + copy : copy + img) + '</div></div></section>';
}
const home = '<section class="bg-white art-band" data-diversity="1"><div class="container"><span class="eyebrow reveal">Un patrimoine universel</span><h2 class="title reveal">La culture, un seul et même horizon</h2>' +
  '<p class="lead reveal">Un port peint dans la brume du Havre, un prince de Sumer sculpté en prière il y a plus de 4 000 ans, une flotte brodée sur du lin : une peinture, une sculpture et une tapisserie, séparées par des millénaires, naissent pourtant d’une même rencontre entre des artistes, des artisans et ceux qui rendent leur travail possible. Les formes d’art se répondent et se nourrissent les unes les autres : c’est cet ensemble, dans toute sa diversité, que Mecenia veut financer, valoriser et protéger.</p>' +
  '<div class="art-trio diverse-trio stagger">' + fig('monet') + fig('gudea') + fig('flotte') + '</div></div></section>';
const PAGES = {
  'index.html': { marker: 'La culture, richesse de tous les peuples', html: home, replace: true },
  'notre-mission/index.html': { marker: 'Un imaginaire commun, un enjeu public', html: band('bg-beige', 'Culture et économie', 'Quand une gravure devient un marché', 'La <i>Gravure aux cent florins</i> de Rembrandt doit, selon la tradition, son nom au prix élevé qu’elle atteignait de son vivant. Dès cette époque, la création est aussi une valeur économique, portée par des artistes, des éditeurs et des collectionneurs : ce lien entre culture et économie, Mecenia veut le remettre au cœur du débat public.', 'rembrandt', true) },
  'nos-valeurs/index.html': { marker: 'Ce que les générations se transmettent', html: band('bg-beige', 'Équité et humilité', '« Ôte-toi de mon soleil »', 'Dans ce relief, Pierre Puget met en scène la rencontre d’Alexandre le Grand et du philosophe Diogène. Le conquérant lui offre tout ce qu’il désire ; le sage ne demande qu’une chose : qu’on le laisse à sa lumière. Cette réponse résume l’esprit de nos valeurs : agir avec équité et humilité, reconnaître à chaque peuple le droit de se réapproprier sa propre culture, et encourager la recherche de provenance et la restitution lorsque l’histoire des œuvres l’exige.', 'diogene', true), replace: true },
  'equipe/index.html': { marker: 'Des visages derrière la culture', html: band('bg-white', 'La mode, un patrimoine vivant', 'Des savoir-faire, des parcours', 'Les planches de mode du XIX<sup>e</sup> siècle racontent les tenues, les ateliers et les métiers d’une époque. Pauline Bion a exercé en médiation culturelle au Palais Galliera, musée de la Mode de la Ville de Paris : cette attention aux métiers d’art et à la mode fait partie des regards que Mecenia veut réunir.', 'mode', true), replace: true }
};
const CSS = '<style id="mecenia-diversity">.diverse-trio{align-items:stretch}.diverse-trio .art-fig{margin:0}.diverse-trio .art-fig img{aspect-ratio:4/3;object-fit:cover;object-position:center}@media(max-width:860px){.diverse-trio .art-fig{max-width:560px;margin:0 auto}}</style>';
let done = 0;
for (const rel of Object.keys(PAGES)) {
  try {
    const p = path.join(OUT, rel);
    if (!fs.existsSync(p)) { console.warn('Diversité : page absente ' + rel); continue; }
    let h = fs.readFileSync(p, 'utf8');
    if (h.includes('data-diversity')) continue;
    const i = h.indexOf(PAGES[rel].marker);
    const j = i < 0 ? -1 : h.indexOf('</section>', i);
    if (j < 0) { console.warn('Diversité : repère introuvable dans ' + rel); continue; }
    const cut = j + '</section>'.length;
    if (PAGES[rel].replace) {
      const a = h.lastIndexOf('<section', i);
      if (a < 0) { console.warn('Diversité : début de section introuvable dans ' + rel); continue; }
      h = h.slice(0, a) + PAGES[rel].html + h.slice(cut);
    } else h = h.slice(0, cut) + PAGES[rel].html + h.slice(cut);
    if (!h.includes('mecenia-diversity')) h = h.replace('</head>', CSS + '\n</head>');
    fs.writeFileSync(p, h); done++;
  } catch (e) { console.error('Diversité : page ignorée ' + rel, e.message); }
}
console.log('Diversité : ' + done + ' page(s) enrichie(s).');

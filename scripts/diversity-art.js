'use strict';
/* Diversité des formes de culture : une représentation non picturale par page, liée à son propos et à la vision de Mecenia.
   Images du domaine public ou CC0, liées depuis Wikimedia Commons. Ne fait jamais échouer le build. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const OUT = path.join(process.cwd(), 'dist');
const enc = encodeURIComponent;
const ART = {
  beethoven: { f: 'BeethovenSinfonia5autografo.jpg', w: 1064, h: 850, lic: 'Domaine public', fit: true, alt: 'Page du manuscrit autographe de la Cinquième Symphonie de Beethoven, couverte de notes de la main du compositeur', cap: 'Ludwig van Beethoven, manuscrit autographe de la <i>Symphonie n° 5</i>, composée entre 1804 et 1808.' },
  nike: { f: 'Victoire_de_Samothrace_-_Musee_du_Louvre_-_20190812.jpg', w: 3616, h: 4800, lic: 'CC0', portrait: true, alt: 'La Victoire de Samothrace, statue de marbre ailée, en haut de l’escalier Daru du Louvre', cap: '<i>La Victoire de Samothrace</i>, marbre, vers 190 av. J.-C. Musée du Louvre, Paris.' },
  bayeux: { f: 'Bayeux_Tapestry_scene1_Edward.jpg', w: 3570, h: 2405, lic: 'Domaine public', fit: true, alt: 'Scène de la Tapisserie de Bayeux : le roi Édouard reçoit Harold, brodée en laine sur toile de lin', cap: '<i>Tapisserie de Bayeux</i>, scène 1, broderie de laine sur lin, XI<sup>e</sup> siècle.' },
  piranesi: { f: 'Piranesi-16028.jpg', w: 1200, h: 836, lic: 'Domaine public', alt: 'Eau-forte de Piranesi : la place du Quirinal à Rome, avec ses monuments et de petits personnages', cap: 'Giovanni Battista Piranesi, <i>Vue du Quirinal</i>, eau-forte extraite des <i>Vedute di Roma</i>, milieu du XVIII<sup>e</sup> siècle.' },
  rembrandt: { f: 'Rembrandt_The_Hundred_Guilder_Print.jpg', w: 5022, h: 3648, lic: 'Domaine public', alt: 'Gravure de Rembrandt : le Christ entouré d’une foule de malades et de curieux', cap: 'Rembrandt, <i>La Gravure aux cent florins</i>, eau-forte, burin et pointe sèche, vers 1647-1649. Rijksmuseum, Amsterdam.' },
  venus: { f: 'Venus_de_Milo_Louvre_Ma399_n4.jpg', w: 2250, h: 3775, lic: 'Domaine public', portrait: true, alt: 'La Vénus de Milo, statue antique de marbre dont les bras sont brisés', cap: '<i>Vénus de Milo</i>, marbre de Paros, vers 130-100 av. J.-C. Musée du Louvre, Paris.' },
  mucha: { f: "Alphonse_Mucha_-_Poster_for_Victorien_Sardou's_Gismonda_starring_Sarah_Bernhardt.jpg", w: 1200, h: 3493, lic: 'Domaine public', poster: true, alt: 'Affiche d’Alphonse Mucha pour la pièce Gismonda : Sarah Bernhardt en costume byzantin sous une arche ornementée', cap: 'Alphonse Mucha, affiche pour <i>Gismonda</i> avec Sarah Bernhardt, Théâtre de la Renaissance, Paris, lithographie en couleurs, 1894.' },
  mode: { f: 'Journal_des_Dames_et_des_Demoiselles,_1_Novembre_1872,_No._1063D,_RP-P-2009-1978-1.jpg', w: 3648, h: 5194, lic: 'Domaine public', portrait: true, alt: 'Planche de mode de 1872 montrant des toilettes de dames avec robes, chapeaux et accessoires', cap: 'Planche de mode du <i>Journal des Dames et des Demoiselles</i>, 1<sup>er</sup> novembre 1872. Rijksmuseum, Amsterdam.' },
  troupe: { f: 'Detail_of_French_and_Italian_Comedians,_1670_Comédie-Française.jpg', w: 2765, h: 2074, lic: 'Domaine public', alt: 'Gravure de 1670 réunissant des portraits de dramaturges et de comédiens français et italiens', cap: 'Dramaturges et comédiens français et italiens, gravure (détail), 1670. Collections de la Comédie-Française.' },
  mozart: { f: 'Manuscript_of_the_last_page_of_Requiem.jpg', w: 1824, h: 1320, lic: 'Domaine public', alt: 'Page du manuscrit autographe du Requiem de Mozart, écrite à la plume', cap: 'Wolfgang Amadeus Mozart, manuscrit autographe du <i>Requiem</i> (K. 626), 1791. Bibliothèque nationale d’Autriche, Vienne.' }
};
function thumb(f, w) { const h = crypto.createHash('md5').update(f).digest('hex'); return 'https://upload.wikimedia.org/wikipedia/commons/thumb/' + h[0] + '/' + h.slice(0, 2) + '/' + enc(f) + '/' + w + 'px-' + enc(f); }
function fig(k, cls) {
  const a = ART[k], w = a.poster ? 600 : Math.min(960, a.w - 1), small = a.poster ? 400 : Math.min(500, w), h = Math.round(w * a.h / a.w);
  const c = ['art-fig', cls || '', a.fit ? 'fit' : '', a.portrait ? 'art-portrait' : '', a.poster ? 'art-poster' : ''].filter(Boolean).join(' ');
  return '<figure class="' + c + '"><img src="' + thumb(a.f, w) + '" srcset="' + thumb(a.f, small) + ' ' + small + 'w, ' + thumb(a.f, w) + ' ' + w + 'w" sizes="' + (a.poster ? '(max-width:860px) 60vw, 240px' : a.portrait ? '(max-width:860px) 80vw, 380px' : '(max-width:860px) 92vw, 520px') + '" width="' + w + '" height="' + h + '" alt="' + a.alt + '" loading="lazy" decoding="async">' +
    '<figcaption>' + a.cap + ' <a href="https://commons.wikimedia.org/wiki/File:' + enc(a.f) + '" target="_blank" rel="noopener">' + a.lic + ' · Wikimedia Commons</a></figcaption></figure>';
}
function band(bg, eyebrow, title, text, k, flip) {
  const copy = '<div class="prose reveal"><span class="eyebrow" style="text-align:left">' + eyebrow + '</span><h2 style="margin-top:0">' + title + '</h2><p>' + text + '</p></div>';
  const img = '<div class="reveal">' + fig(k) + '</div>';
  return '\n<section class="' + bg + ' art-band" data-diversity="1"><div class="container"><div class="split">' + (flip ? img + copy : copy + img) + '</div></div></section>';
}
const home = '\n<section class="bg-beige art-band" data-diversity="1"><div class="container"><span class="eyebrow reveal">La culture au sens large</span><h2 class="title reveal">Musique, sculpture, métiers d’art : toutes les formes de la création</h2>' +
  '<p class="lead reveal">Mecenia ne défend pas seulement la peinture. La culture, c’est aussi la musique, les arts plastiques, le spectacle, la mode et les métiers d’art. Chacune de ces formes fait vivre des artistes, des artisans, des entreprises et des territoires : c’est cette diversité que nous voulons financer, valoriser et protéger.</p>' +
  '<div class="art-trio diverse-trio stagger">' + fig('beethoven') + fig('nike') + fig('bayeux') + '</div></div></section>';
const PAGES = {
  'index.html': { marker: 'La culture, richesse de tous les peuples', html: home },
  'notre-histoire/index.html': { marker: 'Rien n’est acquis', html: band('bg-beige', 'La mémoire par l’image', 'Ce que l’on grave, on le transmet', 'Au XVIII<sup>e</sup> siècle, les eaux-fortes de Giovanni Battista Piranesi font connaître les monuments de Rome à toute l’Europe. Documenter, montrer, diffuser : c’est déjà une façon de protéger le patrimoine, et c’est l’état d’esprit que Mecenia veut partager.', 'piranesi', false) },
  'notre-mission/index.html': { marker: 'Un imaginaire commun, un enjeu public', html: band('bg-beige', 'Culture et économie', 'Quand une gravure devient un marché', 'La <i>Gravure aux cent florins</i> de Rembrandt doit, selon la tradition, son nom au prix élevé qu’elle atteignait de son vivant. Dès cette époque, la création est aussi une valeur économique, portée par des artistes, des éditeurs et des collectionneurs : ce lien entre culture et économie, Mecenia veut le remettre au cœur du débat public.', 'rembrandt', true) },
  'nos-valeurs/index.html': { marker: 'Ce que les générations se transmettent', html: band('bg-white', 'Universalité', 'Un héritage qui appartient à tous', 'Découverte en 1820 sur l’île de Milo et conservée au Louvre, la Vénus de Milo est admirée par des visiteurs venus du monde entier. Ce chef-d’œuvre de la sculpture grecque rappelle que le patrimoine n’a pas de frontière : il se transmet, se protège et se partage. C’est le sens de nos valeurs.', 'venus', false) },
  'nos-projets/index.html': { marker: 'Faire dialoguer les disciplines', html: band('bg-white', 'Le spectacle vivant', 'Une affiche, une salle, un public', 'En 1894, Alphonse Mucha dessine l’affiche de <i>Gismonda</i>, la pièce jouée par Sarah Bernhardt au Théâtre de la Renaissance, à Paris. Artiste, théâtre, presse, public : une création qui rencontre son audience, c’est l’esprit de nos webinaires, de nos colloques et des futures Rencontres de la Culture et des Affaires.', 'mucha', true) },
  'equipe/index.html': { marker: 'Des visages derrière la culture', html: band('bg-beige', 'La mode, un patrimoine vivant', 'Des savoir-faire, des parcours', 'Les planches de mode du XIX<sup>e</sup> siècle racontent les tenues, les ateliers et les métiers d’une époque. Pauline Bion a exercé en médiation culturelle au Palais Galliera, musée de la Mode de la Ville de Paris : cette attention aux métiers d’art et à la mode fait partie des regards que Mecenia veut réunir.', 'mode', false) },
  'adherer/index.html': { marker: 'Chacun y a sa place', html: band('bg-beige', 'Une troupe, des talents', 'Chacun joue son rôle', 'Cette gravure de 1670 rassemble des dramaturges et des comédiens français et italiens. Une troupe n’existe que par la réunion de talents différents : comme Mecenia, qui accueille membres actifs, partenaires et lecteurs, chacun avec son rôle dans la défense de la culture.', 'troupe', true) },
  'contact/index.html': { marker: 'Une idée, une question, un projet ?', html: band('bg-white', 'L’écriture à la main', 'Chaque message compte', 'Cette page est tirée du manuscrit du <i>Requiem</i> de Mozart, écrit à la plume. Une idée jetée sur le papier peut devenir une œuvre ; de la même façon, un message, une question ou une proposition de projet peut devenir le début d’une collaboration.', 'mozart', false) }
};
const CSS = '<style id="mecenia-diversity">.diverse-trio .art-fig img{aspect-ratio:4/5;object-fit:cover;object-position:center top}.diverse-trio .art-fig.fit img{object-fit:contain;padding:10px;background:var(--beige)}.diverse-trio .art-fig.art-portrait{max-width:none;margin:0}.art-poster{max-width:240px;margin:0 auto}.art-fig.fit img{background:var(--beige)}@media(max-width:860px){.diverse-trio .art-fig{max-width:420px;margin:0 auto}.art-poster{max-width:220px}}</style>';
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
    h = h.slice(0, cut) + PAGES[rel].html + h.slice(cut);
    if (!h.includes('mecenia-diversity')) h = h.replace('</head>', CSS + '\n</head>');
    fs.writeFileSync(p, h); done++;
  } catch (e) { console.error('Diversité : page ignorée ' + rel, e.message); }
}
console.log('Diversité : ' + done + ' page(s) enrichie(s).');

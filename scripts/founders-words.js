"use strict";
/* Accueil : remplace la section « L’équipe fondatrice » par « Le mot des fondateurs » (deux cartes horizontales).
   Remplacement sur dist/index.html ; styles des arrondis sur les pages publiques de dist/. */
const fs = require("fs"), path = require("path");
const FILE = path.join(process.cwd(), "dist", "index.html");

const CSS = '<style id="mecenia-founders-css">' +
  '.founders-words{display:grid;gap:22px;max-width:880px;margin:36px auto 0}' +
  '.founders-words .fw-card{display:grid;grid-template-columns:140px minmax(0,1fr);gap:30px;align-items:center;text-align:left;padding:30px 34px}' +
  '.founders-words .fw-card:nth-child(2){grid-template-columns:minmax(0,1fr) 140px}.founders-words .fw-card:nth-child(2) .fw-photo{grid-column:2;grid-row:1}.founders-words .fw-card:nth-child(2)>div{grid-column:1;grid-row:1}' +
  '.founders-words .fw-photo{width:140px;height:140px;border-radius:50%;object-fit:cover;display:block;border:1px solid var(--line)}' +
  '.founders-words .fw-head{margin:0 0 4px;font-family:"Playfair Display",Georgia,serif;font-size:21px}' +
  '.founders-words .fw-role{display:block;margin-bottom:14px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--bronze,#9A5F37)}' +
  '.founders-words .fw-text{margin:0;text-align:justify;text-justify:inter-word;hyphens:auto;-webkit-hyphens:auto;font-size:16.5px;line-height:1.7}' +
  '#contenu .card,#contenu .dark-card,#contenu .pcard,#contenu .chart,#contenu .quote,#contenu .stats,#contenu .news-view,#contenu .art-fig img{border-radius:8px}#contenu .stats,#contenu .news-view{overflow:hidden}' +
  '@media(max-width:700px){.founders-words .fw-card,.founders-words .fw-card:nth-child(2){grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center;padding:26px 22px}.founders-words .fw-photo{width:112px;height:112px}.founders-words .fw-card:nth-child(2) .fw-photo,.founders-words .fw-card:nth-child(2)>div{grid-column:auto;grid-row:auto}.founders-words .fw-text{text-align:justify}}' +
  '</style>';

function card(img, alt, name, role, text) {
  return '<article class="card fw-card reveal"><img class="fw-photo" src="' + img + '" width="140" height="140" loading="lazy" alt="' + alt + '"><div><h3 class="fw-head">' + name + '</h3><span class="fw-role">' + role + '</span><p class="fw-text">' + text + '</p></div></article>';
}

const SECTION = '<section class="bg-beige" data-founders-words="1"><div class="container">' +
  '<span class="eyebrow reveal">L’équipe fondatrice</span>' +
  '<h2 class="title reveal">Le mot des fondateurs</h2>' +
  '<div class="founders-words">' +
  card('/assets/img/pauline-bion.jpg', 'Pauline Bion, Présidente de Mecenia', 'Pauline Bion', 'Présidente · Histoire de l’art',
    'Une œuvre n’existe pleinement que lorsqu’elle rencontre un public, et cette rencontre est toujours le fruit d’un travail : celui des médiateurs, des conservateurs, des restaurateurs, des artisans d’art. Ces métiers transmettent une mémoire et des savoir-faire qui demandent du temps et des moyens. Avec Mecenia, nous souhaitons que ceux qui financent voient clairement ce qu’ils rendent possible, et que ceux qui créent ou transmettent puissent parler aux entreprises sans rien céder de leur exigence.') +
  card('/assets/img/martin-chanteranne.jpg', 'Martin Chanteranne, Vice-Président et Trésorier de Mecenia', 'Martin Chanteranne', 'Vice-Président et Trésorier · Droit de la propriété intellectuelle',
    'Derrière chaque œuvre, il y a un auteur, des droits et des contrats. En somme, tout ce qui permet à la création de se financer, de circuler et de durer. Le droit de la propriété intellectuelle m’a appris qu’une création n’a de valeur durable que si ses règles sont claires pour tous. De cette manière, à Mecenia, nous veillons à une gestion désintéressée, transparente, et une séparation nette des rôles entre ceux qui décident et ceux qui financent.') +
  '</div>' +
  '<p class="center reveal" style="margin-top:36px"><a class="arrow-link" href="/equipe/">Rencontrer l’équipe et voir l’organigramme</a></p>' +
  '</div></section>';

try {
  if (!fs.existsSync(FILE)) { console.warn("Fondateurs : accueil absent."); }
  else {
    let h = fs.readFileSync(FILE, "utf8");
    if (h.includes('data-founders-words')) { console.log("Fondateurs : section déjà remplacée."); }
    else {
      let m = h.indexOf("L’équipe fondatrice");
      if (m < 0) m = h.indexOf("L'équipe fondatrice");
      const start = m < 0 ? -1 : h.lastIndexOf("<section", m);
      const end = m < 0 ? -1 : h.indexOf("</section>", m);
      if (start < 0 || end < 0) { console.warn("Fondateurs : section « L’équipe fondatrice » introuvable, accueil inchangé."); }
      else {
        h = h.slice(0, start) + SECTION + h.slice(end + "</section>".length);
        if (!h.includes('id="mecenia-founders-css"')) h = h.replace("</head>", () => CSS + "\n</head>");
        fs.writeFileSync(FILE, h);
        console.log("Fondateurs : section « Le mot des fondateurs » ajoutée à l’accueil.");
      }
    }
  }
} catch (e) { console.error("Fondateurs : étape ignorée", e.message); }

// Même arrondi discret sur les cadres des pages publiques, sans toucher au contenu.
const ROUND_CSS = '<style id="mecenia-soft-corners">#contenu .card,#contenu .dark-card,#contenu .pcard,#contenu .chart,#contenu .quote,#contenu .stats,#contenu .news-view,#contenu .formbox,#contenu .org-node,#contenu .post-cover,#contenu .mag-box,#contenu .mag-fig img,#contenu .art-fig img,#contenu .post p>img:not(.avatar):not(.fw-photo),#contenu .post figure>img:not(.avatar):not(.fw-photo){border-radius:8px}#contenu .stats,#contenu .news-view,#contenu .post-cover{overflow:hidden}</style>';
function roundPages(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'admin') roundPages(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('id="contenu"') || html.includes('id="mecenia-soft-corners"') || !html.includes('</head>')) continue;
    fs.writeFileSync(file, html.replace('</head>', () => ROUND_CSS + '\n</head>'));
  }
}
try {
  const out = path.dirname(FILE);
  if (fs.existsSync(out)) roundPages(out);
} catch (e) { console.error('Arrondis : étape ignorée', e.message); }

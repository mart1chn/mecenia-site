'use strict';
/* Prépare le blog dynamique : mémorise l'en-tête, le pied de page et le bandeau du blog actuel pour la fonction Netlify,
   et conserve une copie de secours du blog statique. Ne fait jamais échouer le build. */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), OUT = path.join(ROOT, 'dist');
try {
  const f = path.join(OUT, 'blog', 'index.html');
  if (!fs.existsSync(f)) { console.warn('Blog dynamique : page modèle absente, mise en page de secours utilisée.'); process.exit(0); }
  const h = fs.readFileSync(f, 'utf8');
  const ih = h.indexOf('</head>'), im = h.indexOf('<main id="contenu">'), ie = h.indexOf('</main>');
  if (ih < 0 || im < 0 || ie < 0) { console.warn('Blog dynamique : structure inattendue, mise en page de secours utilisée.'); process.exit(0); }
  const main = h.slice(im + 19, ie);
  const shell = { head: h.slice(0, ih), header: h.slice(ih + 7, im + 19), foot: h.slice(ie).replace(/<script id="mecenia-blog-filters">[\s\S]*?<\/script>\n?/, ''), listHero: (main.match(/<section class="hero small">[\s\S]*?<\/section>/) || [''])[0] };
  const dir = path.join(ROOT, 'netlify', 'functions', 'blog');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'shell.json'), JSON.stringify(shell));
  fs.rmSync(path.join(OUT, '_blog-static'), { recursive: true, force: true });
  fs.cpSync(path.join(OUT, 'blog'), path.join(OUT, '_blog-static'), { recursive: true });
  console.log('Blog dynamique : modèle de page et copie de secours enregistrés.');
} catch (e) { console.error('Blog dynamique : étape ignorée', e.message); }

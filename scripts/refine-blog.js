'use strict';
/* Dernière finition visuelle du blog : reprend le hero illustré du site et l'état vide d'origine. */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd(), OUT = path.join(ROOT, 'dist');
const blogFile = path.join(OUT, 'blog', 'index.html');
const homeFile = path.join(OUT, 'index.html');
if (!fs.existsSync(blogFile) || !fs.existsSync(homeFile)) process.exit(0);
let blog = fs.readFileSync(blogFile, 'utf8');
const home = fs.readFileSync(homeFile, 'utf8');
const decoMatch = home.match(/<div class="hero-deco"[\s\S]*?<\/svg><\/div>/);
const deco = decoMatch ? decoMatch[0] : '';
/* Même décor graphique que les autres hero, inséré une seule fois. */
if (deco && !blog.includes('mecenia-blog-hero-deco')) {
  const marked = deco.replace('class="hero-deco"', 'class="hero-deco mecenia-blog-hero-deco"');
  blog = blog.replace('<section class="hero small"><div class="container hero-content">', '<section class="hero small">' + marked + '<div class="container hero-content">');
}
/* État vide : carte d'accueil du blog, seulement quand aucun article n'a été généré. */
const empty = '<div class="card blog-empty"><h2>Les premiers articles arrivent bientôt</h2><p>Notre blog ouvre prochainement. En attendant, découvrez <a class="link" href="/notre-mission/">notre mission</a> ou <a class="link" href="/adherer/?type=suivre#formulaire">inscrivez-vous pour suivre nos travaux</a>.</p></div>';
if (!blog.includes('class="blog-card"')) {
  blog = blog.replace('<p class="lead">Les premiers articles arrivent bientôt.</p>', empty);
  blog = blog.replace('<p class="lead" style="text-align:center">Les premiers articles arrivent bientôt</p>', empty);
}
if (!blog.includes('mecenia-blog-refine')) {
  const css = '<style id="mecenia-blog-refine">.blog-empty{max-width:640px;margin:0 auto;text-align:center;padding:48px 38px}.blog-empty h2{font-size:27px;margin-bottom:14px}.blog-empty p{text-align:center;color:var(--gray);font-size:16px}.blog-empty a{color:var(--caramel-dark);border-bottom:1px solid rgba(154,95,55,.35)}.blog-card{transition:transform .35s var(--ease),box-shadow .35s var(--ease)}.blog-card:hover{transform:translateY(-6px);box-shadow:0 18px 36px rgba(46,33,20,.1)}</style>';
  blog = blog.replace('</head>', css + '\n</head>');
}
fs.writeFileSync(blogFile, blog);
console.log('Blog : hero illustré et état vide restaurés.');

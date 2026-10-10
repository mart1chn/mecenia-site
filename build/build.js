'use strict';
/* Générateur du site Mecenia : contenu (YAML / Markdown) + gabarits → dossier dist/. */
const fs = require('fs');
const path = require('path');
const { ROOT, DIST, esc, write, copyDir, outFile, fmtDate, isoDate, read } = require('./lib/util');
const C = require('./lib/content');
const assetsLib = require('./lib/assets');
const remote = require('./lib/remote');
const { addDims } = require('./lib/images');
const seo = require('./lib/seo');
const { inline } = require('./lib/md');
const layout = require('./templates/layout');
const { renderBlocks } = require('./templates/blocks');
const blog = require('./templates/blog');
const expo = require('./templates/exposition');

const plain = (s) => String(s || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '');

/* Anciennes adresses : redirections permanentes vers la page « À propos » (ancres conservées). */
const REDIRECTS = [
  ['/notre-histoire', '/a-propos/#histoire'],
  ['/notre-mission', '/a-propos/#mission'],
  ['/nos-valeurs', '/a-propos/#valeurs'],
  ['/nos-projets', '/a-propos/#projets'],
  ['/equipe', '/a-propos/#equipe']
];

async function main() {
  const t0 = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(path.join(ROOT, 'static'), DIST);

  const assets = assetsLib.build();
  const site = C.loadSite();
  const data = C.loadData();
  const pages = C.loadPages();
  const posts = C.loadPosts();
  const expos = C.loadExpositions();

  // Images distantes (Wikimedia) : copie locale quand c'est possible
  const raw = [];
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(ya?ml|md)$/.test(f) && raw.push(read(p)); } };
  walk(path.join(ROOT, 'content'));
  const rem = await remote.localize(raw);

  const ctx0 = { site, data, posts, fmt: fmtDate };
  const emit = (urlPath, html) => write(outFile(urlPath), addDims(remote.rewrite(html, rem.map)));
  const sitemapEntries = [];
  const today = isoDate(new Date());
  const indexable = [];

  // Pages éditoriales
  for (const p of pages) {
    const page = { path: p.chemin, title: p.titre_seo, description: p.description, noindex: !!p.noindex, crumb: p.crumb };
    const ctx = Object.assign({}, ctx0, { page });
    const content = renderBlocks(p.blocs, ctx);
    page.jsonld = seo.pageLd(site, page, p.titre_seo, p.description, seo.faqLd(p.blocs, plain));
    emit(p.chemin, layout.document(site, assets, page, content));
    if (!p.noindex) { sitemapEntries.push({ path: p.chemin, lastmod: today }); indexable.push({ path: p.chemin, titre_seo: p.titre_seo, description: p.description, crumb: p.crumb }); }
  }

  // Blog : liste + articles
  {
    const page = { path: '/blog/', title: 'Blog — Culture, économie et mécénat | Mecenia', description: 'Le blog de Mecenia : analyses, comptes rendus et réflexions sur la culture comme richesse économique et pouvoir d’influence pour la France.', crumb: 'Blog' };
    const ctx = Object.assign({}, ctx0, { page });
    page.jsonld = seo.pageLd(site, page, page.title, page.description, [{ '@type': 'Blog', '@id': site.url + '/blog/#blog', url: site.url + '/blog/', name: 'Le blog de Mecenia', inLanguage: 'fr-FR', publisher: { '@id': site.url + '/#organization' } }]);
    emit('/blog/', layout.document(site, assets, page, blog.renderIndex(ctx)));
    sitemapEntries.push({ path: '/blog/', lastmod: posts.length ? isoDate(posts[0].date) : today });
  }
  for (const p of posts) {
    const url = `/blog/${p.slug}/`;
    const page = { path: url, title: `${p.title} | Blog Mecenia`, description: p.description || p.title, image: p.image, article: true, bodyClass: 'is-post', crumb: p.title };
    const ctx = Object.assign({}, ctx0, { page });
    const absImg = p.image ? (/^https?:/.test(p.image) ? p.image : site.url + p.image) : site.url + '/assets/img/og-image.jpg';
    page.jsonld = seo.pageLd(site, page, page.title, page.description, [{ '@type': 'BlogPosting', '@id': site.url + url + '#article', headline: p.title, description: page.description, datePublished: isoDate(p.date), dateModified: isoDate(p.date), inLanguage: 'fr-FR', mainEntityOfPage: site.url + url, image: absImg, author: { '@id': site.url + '/#organization' }, publisher: { '@id': site.url + '/#organization' } }]);
    page.jsonld['@graph'] = page.jsonld['@graph'].map((n) => (n['@type'] === 'BreadcrumbList' ? seo.crumbs(site, [['/', 'Accueil'], ['/blog/', 'Blog'], [url, p.title]]) : n));
    emit(url, layout.document(site, assets, page, blog.renderPost(p, ctx)));
    sitemapEntries.push({ path: url, lastmod: isoDate(p.date) });
  }

  // Exposition numérique (la plus récente publiée)
  if (expos.length) {
    const e = expos[0];
    const page = { path: '/exposition/', title: `${e.title} | Exposition Mecenia`, description: e.seo_description || e.hero_subtitle, crumb: 'Exposition', bodyClass: 'is-expo' };
    page.jsonld = seo.pageLd(site, page, page.title, page.description);
    emit('/exposition/', layout.document(site, assets, page, expo.render(e)));
    sitemapEntries.push({ path: '/exposition/', lastmod: today });
    indexable.push({ path: '/exposition/', titre_seo: page.title, description: page.description, crumb: 'Exposition' });
  }

  // Fichiers techniques
  sitemapEntries.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : 0));
  write(path.join(DIST, 'sitemap.xml'), seo.sitemap(site, sitemapEntries));
  write(path.join(DIST, 'robots.txt'), seo.robots(site));
  write(path.join(DIST, 'llms.txt'), seo.llms(site, indexable, posts));
  const redirects = REDIRECTS.flatMap(([from, to]) => [`${from}/ ${to} 301!`, `${from} ${to} 301!`]).join('\n') + '\n';
  write(path.join(DIST, '_redirects'), redirects);

  const nfiles = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? nfiles(path.join(d, e.name)) : 1), 0);
  console.log(`Mecenia : ${pages.length} pages, ${posts.length} article(s), ${expos.length ? 'exposition, ' : ''}${nfiles(DIST)} fichiers dans dist/ (${Date.now() - t0} ms).`);
  console.log(`Images Wikimedia : ${rem.ok}/${rem.urls.length} rapatriées en local${rem.ok < rem.urls.length ? ' (les autres restent liées à Wikimedia)' : ''}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

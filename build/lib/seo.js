'use strict';
const { esc, isoDate } = require('./util');

const ORG = (site) => ({
  '@type': 'NGO',
  '@id': site.url + '/#organization',
  name: site.nom,
  url: site.url + '/',
  logo: site.url + '/assets/img/mecenia-icon.png',
  email: site.email,
  address: { '@type': 'PostalAddress', addressLocality: 'Paris', postalCode: '75009', addressCountry: 'FR' },
  sameAs: (site.reseaux || []).map((r) => r.url)
});

const crumbs = (site, items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([u, n], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: site.url + u }))
});

function pageLd(site, page, title, description, extra = []) {
  const url = site.url + page.path;
  const graph = [ORG(site)];
  if (page.path === '/') graph.push({ '@type': 'WebSite', '@id': site.url + '/#website', url: site.url + '/', name: site.nom, inLanguage: 'fr-FR', publisher: { '@id': site.url + '/#organization' } });
  graph.push({ '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, inLanguage: 'fr-FR', isPartOf: { '@id': site.url + '/#website' } });
  if (page.path !== '/') graph.push(crumbs(site, [['/', 'Accueil'], [page.path, page.crumb || title.split(/ [—|] /)[0]]]));
  return { '@context': 'https://schema.org', '@graph': graph.concat(extra) };
}

/** FAQPage à partir des blocs « faq » (texte brut des réponses). */
function faqLd(blocs, plain) {
  const qs = [];
  for (const b of blocs || []) if (b.type === 'faq' && !b.etiquette_seule) for (const q of b.questions || []) if (!q.etiquette) qs.push({ '@type': 'Question', name: plain(q.question), acceptedAnswer: { '@type': 'Answer', text: plain(q.reponse) } });
  return qs.length ? [{ '@type': 'FAQPage', mainEntity: qs }] : [];
}

function sitemap(site, entries) {
  const rows = entries.map((e) => `  <url><loc>${esc(site.url + e.path)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

const robots = (site) => `# Les pages publiques et le blog sont accessibles aux robots de recherche et aux robots IA.
# L'administration et la page de confirmation de formulaire ne doivent pas être explorées.
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /merci/

Sitemap: ${site.url}/sitemap.xml
`;

function llms(site, pages, posts) {
  const main = pages.filter((p) => !p.noindex && p.path !== '/mentions-legales/' && p.path !== '/');
  return `# ${site.nom}

> ${site.description_defaut}

## Pages principales
- [Accueil](${site.url}/) : présentation de Mecenia et de ses engagements
${main.map((p) => `- [${p.crumb || p.titre_seo.split(/ [—|] /)[0]}](${site.url}${p.path}) : ${p.description}`).join('\n')}

## Blog et articles
- [Le blog de Mecenia](${site.url}/blog/) : liste des articles publics, analyses et actualités sur la culture, l’économie et le mécénat
${posts.map((p) => `- [${p.title}](${site.url}/blog/${p.slug}/) : ${p.description}`).join('\n')}

## Découverte et lecture
- [Sitemap XML](${site.url}/sitemap.xml) : toutes les pages publiques, générées à chaque déploiement
- Consulter les pages originales pour le texte intégral, les signatures, les dates et les références.
- Distinguer les propositions et ambitions de Mecenia des faits et initiatives attribués à d’autres organisations.
- Ce fichier est un guide complémentaire ; il ne garantit ni indexation, ni classement, ni citation par les moteurs ou les systèmes d’IA.
`;
}

module.exports = { pageLd, faqLd, crumbs, ORG, sitemap, robots, llms };

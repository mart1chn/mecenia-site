"use strict";
/* Génère le blog (liste + articles) à partir de content/blog/*.md, ajoute le lien « Blog » au menu
   et met à jour le sitemap. Sortie : dossier dist/ (publié par Netlify). Aucune dépendance. */
const fs = require("fs"), path = require("path");
const ROOT = process.cwd(), OUT = path.join(ROOT, "dist"), BASE = "https://www.mecenia.org";
const SKIP = new Set(["node_modules", "dist", "scripts", "content", "netlify.toml", "package.json", "package-lock.json", "README.md", "LICENSE", "CNAME"]);
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rep = (s, re, v) => s.replace(re, () => v);

/* 1. Copie du site dans dist/ */
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
for (const e of fs.readdirSync(ROOT)) { if (SKIP.has(e) || e[0] === ".") continue; fs.cpSync(path.join(ROOT, e), path.join(OUT, e), { recursive: true }); }

/* 2. Lien « Blog » dans le menu et le pied de page de toutes les pages */
function inject(file) {
  let h = fs.readFileSync(file, "utf8"); const i = h.indexOf('<footer class="site">');
  if (i < 0 || h.includes('href="/blog/"')) return;
  let a = h.slice(0, i), b = h.slice(i);
  a = rep(a, /<li><a href="\/contact\/"/, '<li><a href="/blog/">Blog</a></li><li><a href="/contact/"');
  b = rep(b, /<li><a href="\/equipe\/">L’équipe<\/a><\/li>/, '<li><a href="/equipe/">L’équipe</a></li><li><a href="/blog/">Blog</a></li>');
  fs.writeFileSync(file, a + b);
}
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".html")) inject(p); } })(OUT);

/* 3. Mini convertisseur Markdown */
function inline(t) {
  t = esc(t);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, a, u) => '<img src="' + u + '" alt="' + a + '" loading="lazy">');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, a, u) => '<a href="' + u + '"' + (/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : "") + ">" + a + "</a>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/(^|[^_\w])_([^_\s][^_]*)_(?!\w)/g, "$1<em>$2</em>");
  return t;
}
function md(src) {
  const L = src.replace(/\r/g, "").split("\n"), out = []; let i = 0;
  const blank = l => /^\s*$/.test(l), ul = /^\s*[-*+]\s+/, ol = /^\s*\d+[.)]\s+/, starter = /^(#{1,6}\s|```|>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+|\s*(-{3,}|\*{3,})\s*$)/;
  while (i < L.length) {
    const l = L[i]; let m;
    if (blank(l)) { i++; continue; }
    if (/^```/.test(l)) { const c = []; i++; while (i < L.length && !/^```/.test(L[i])) c.push(L[i++]); i++; out.push("<pre><code>" + esc(c.join("\n")) + "</code></pre>"); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { out.push("<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">"); i++; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
    if (/^>\s?/.test(l)) { const q = []; while (i < L.length && /^>\s?/.test(L[i])) q.push(L[i++].replace(/^>\s?/, "")); out.push("<blockquote>" + md(q.join("\n")) + "</blockquote>"); continue; }
    if (ul.test(l)) { const it = []; while (i < L.length && ul.test(L[i])) it.push("<li>" + inline(L[i++].replace(ul, "")) + "</li>"); out.push("<ul>" + it.join("") + "</ul>"); continue; }
    if (ol.test(l)) { const it = []; while (i < L.length && ol.test(L[i])) it.push("<li>" + inline(L[i++].replace(ol, "")) + "</li>"); out.push("<ol>" + it.join("") + "</ol>"); continue; }
    const p = [L[i++]]; while (i < L.length && !blank(L[i]) && !starter.test(L[i])) p.push(L[i++]);
    out.push("<p>" + inline(p.join(" ")) + "</p>");
  }
  return out.join("\n");
}
function parse(raw) {
  const m = raw.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/); const data = {};
  if (!m) return { data, body: raw };
  m[1].split(/\r?\n/).forEach(line => { const k = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/); if (!k) return; let v = k[2].trim();
    if (/^".*"$/.test(v)) v = v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\"); else if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/''/g, "'");
    data[k[1]] = v; });
  return { data, body: m[2] };
}

/* 4. Lecture des articles */
const dir = path.join(ROOT, "content", "blog"), posts = [];
if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) {
  if (!/\.md$/i.test(f)) continue;
  const { data, body } = parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (!data.title || data.draft === "true") continue;
  let d = new Date(data.date); if (isNaN(d)) d = fs.statSync(path.join(dir, f)).mtime;
  posts.push({ slug: f.replace(/\.md$/i, "").replace(/^\d{4}-\d{2}-\d{2}-/, ""), title: data.title, desc: data.description || "", image: data.image || "", date: d, html: md(body) });
}
posts.sort((a, b) => b.date - a.date);
const fmt = d => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const iso = d => d.toISOString().slice(0, 10);

/* 5. Gabarit repris d'une page existante (en-tête, menu, pied de page) */
const tpl = fs.readFileSync(path.join(OUT, "mentions-legales", "index.html"), "utf8");
const MAIN = '<main id="contenu">', iHead = tpl.indexOf("</head>"), iMain = tpl.indexOf(MAIN), iFoot = tpl.indexOf("</main>");
const headHtml = tpl.slice(0, iHead);
const headerHtml = rep(tpl.slice(iHead + 7, iMain + MAIN.length), /<li><a href="\/blog\/">Blog<\/a><\/li>/, '<li><a href="/blog/" aria-current="page">Blog</a></li>');
const footerHtml = tpl.slice(iFoot);
const deco = (tpl.match(/<div class="hero-deco"[\s\S]*?<\/svg><\/div>/) || [""])[0];
const hero = (crumb, h1, sub) => '<section class="hero small">' + deco + '<div class="container hero-content"><div class="breadcrumb rise">' + crumb + '</div><h1 class="rise d1">' + esc(h1) + "</h1>" + (sub ? '<p class="sub rise d2">' + esc(sub) + "</p>" : "") + "</div></section>\n";
const cta = '<section class="bg-dark cta"><div class="container reveal"><h2>Envie de participer à la conversation ?</h2><p>Rejoignez Mecenia ou écrivez-nous : nous construisons ce dialogue entre culture et économie avec nos premiers membres et partenaires.</p><div class="btn-row"><a class="btn" href="/adherer/">Adhérer à Mecenia</a><a class="btn-outline" href="/contact/">Nous contacter</a></div></div></section>\n';

function page(o) {
  const url = BASE + o.path, img = o.image ? (/^https?:/.test(o.image) ? o.image : BASE + o.image) : BASE + "/assets/img/og-image.jpg";
  let h = headHtml;
  h = rep(h, /<title>[\s\S]*?<\/title>/, "<title>" + esc(o.title) + "</title>");
  h = rep(h, /<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(o.desc) + '">');
  h = rep(h, /<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">');
  h = rep(h, /<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="' + (o.article ? "article" : "website") + '">');
  h = rep(h, /<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(o.title) + '">');
  h = rep(h, /<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(o.desc) + '">');
  h = rep(h, /<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">');
  h = rep(h, /<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + img + '">');
  h = rep(h, /<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + esc(o.title) + '">');
  h = rep(h, /<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + esc(o.desc) + '">');
  h = rep(h, /<meta name="twitter:image" content="[^"]*">/, '<meta name="twitter:image" content="' + img + '">');
  h = rep(h, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">\n' + JSON.stringify(o.ld, null, 1) + "\n</script>");
  h += '<link rel="stylesheet" href="/assets/blog.css">\n</head>\n';
  const file = path.join(OUT, o.path, "index.html"); fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, h + headerHtml + "\n" + o.body + footerHtml);
}
const ORG = { "@id": BASE + "/#organization", "@type": "NGO", name: "Mecenia", url: BASE + "/" };
const crumbs = items => ({ "@type": "BreadcrumbList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x[1], item: BASE + x[0] })) });

/* 6. Page « Blog » */
const cards = posts.map(p => '<article class="card blog-card"><a href="/blog/' + p.slug + '/">' + (p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy" width="800" height="450">' : "") + '<span class="tag">' + fmt(p.date) + "</span><h3>" + esc(p.title) + "</h3><p>" + esc(p.desc) + '</p><span class="arrow-link">Lire l’article</span></a></article>').join("\n");
const listBody = hero('<a href="/">Accueil</a> &nbsp;/&nbsp; Blog', "Le blog de Mecenia", "Analyses, comptes rendus et réflexions sur la culture comme richesse économique et pouvoir d’influence pour la France.") +
  '<section class="bg-white"><div class="container">' + (posts.length ? '<div class="grid g3 stagger">' + cards + "</div>" : '<div class="card" style="max-width:640px;margin:0 auto;text-align:center"><h3>Les premiers articles arrivent bientôt</h3><p style="text-align:center">Notre blog ouvre prochainement. En attendant, découvrez <a class="link" href="/notre-mission/">notre mission</a> ou <a class="link" href="/adherer/?type=suivre#formulaire">inscrivez-vous pour suivre nos travaux</a>.</p></div>') + "</div></section>\n" + cta;
page({ path: "/blog/", title: "Blog — Culture, économie et mécénat | Mecenia", desc: "Le blog de Mecenia : analyses, comptes rendus et réflexions sur la culture comme richesse économique et pouvoir d’influence pour la France.",
  body: listBody, ld: { "@context": "https://schema.org", "@graph": [ORG, { "@type": "Blog", "@id": BASE + "/blog/#blog", url: BASE + "/blog/", name: "Le blog de Mecenia", inLanguage: "fr-FR", publisher: { "@id": ORG["@id"] } }, crumbs([["/", "Accueil"], ["/blog/", "Blog"]])] } });

/* 7. Pages des articles */
for (const p of posts) {
  const path_ = "/blog/" + p.slug + "/", desc = p.desc || p.title;
  const body = hero('<a href="/">Accueil</a> &nbsp;/&nbsp; <a href="/blog/">Blog</a>', p.title, "Publié le " + fmt(p.date)) +
    '<section class="bg-white"><div class="container narrow">' + (p.image ? '<figure class="post-cover"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" width="1200" height="675"></figure>' : "") +
    '<article class="prose post">' + p.html + '</article><p class="center" style="margin-top:36px"><a class="arrow-link" href="/blog/">Tous les articles</a></p></div></section>\n' + cta;
  page({ path: path_, title: p.title + " | Blog Mecenia", desc, image: p.image, article: true, body,
    ld: { "@context": "https://schema.org", "@graph": [ORG, { "@type": "BlogPosting", "@id": BASE + path_ + "#article", headline: p.title, description: desc, datePublished: iso(p.date), dateModified: iso(p.date), inLanguage: "fr-FR", mainEntityOfPage: BASE + path_, image: p.image ? (/^https?:/.test(p.image) ? p.image : BASE + p.image) : BASE + "/assets/img/og-image.jpg", author: { "@id": ORG["@id"] }, publisher: { "@id": ORG["@id"] } }, crumbs([["/", "Accueil"], ["/blog/", "Blog"], [path_, p.title]])] } });
}

/* 8. Feuille de style du blog */
fs.writeFileSync(path.join(OUT, "assets", "blog.css"), `.blog-card{padding:0;overflow:hidden}.blog-card>a{display:block;padding:30px 28px;height:100%}
.blog-card img{width:calc(100% + 56px);max-width:none;margin:-30px -28px 22px;aspect-ratio:16/9;object-fit:cover}
.blog-card h3{font-family:'Playfair Display',serif;font-size:21px;margin:8px 0 10px}.blog-card .arrow-link{margin-top:14px}
.post-cover{margin:0 0 34px;border:1px solid var(--line)}.post-cover img{width:100%;aspect-ratio:16/9;object-fit:cover}
.post h2{font-size:clamp(24px,3vw,30px);margin:44px 0 16px}.post h3{font-size:21px;margin:30px 0 10px}.post h4{font-size:18px;margin:24px 0 8px}
.post ul,.post ol{margin:0 0 20px 22px;color:var(--ink);font-size:17px}.post li{margin-bottom:8px}
.post blockquote{border-left:3px solid var(--caramel);background:var(--beige);padding:18px 24px;margin:0 0 20px;font-family:'Playfair Display',serif;font-style:italic}
.post blockquote p{margin:0}.post img{margin:24px auto;border:1px solid var(--line)}
.post pre{background:var(--beige);padding:16px;overflow-x:auto;margin-bottom:20px;font-size:14px}.post code{background:var(--beige);padding:2px 6px;font-size:.92em}.post pre code{padding:0;background:none}
.post hr{border:0;border-top:1px solid var(--line);margin:32px 0}
`);

/* 9. Sitemap */
const sm = path.join(OUT, "sitemap.xml");
if (fs.existsSync(sm)) {
  const today = iso(new Date()); let x = fs.readFileSync(sm, "utf8");
  x = x.replace(/\s*<url><loc>[^<]*\/blog\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "");
  const add = ['<url><loc>' + BASE + '/blog/</loc><lastmod>' + (posts.length ? iso(posts[0].date) : today) + "</lastmod></url>"].concat(posts.map(p => "<url><loc>" + BASE + "/blog/" + p.slug + "/</loc><lastmod>" + iso(p.date) + "</lastmod></url>"));
  fs.writeFileSync(sm, x.replace("</urlset>", "  " + add.join("\n  ") + "\n</urlset>"));
}
console.log("Blog : " + posts.length + " article(s) publié(s).");

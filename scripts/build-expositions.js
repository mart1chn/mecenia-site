"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE_DIR = path.join(ROOT, "content", "expositions");
const IMAGE_DIR = path.join(DIST, "assets", "img", "exposition");
const IMAGE_URL = "/assets/img/exposition";
const PAGE_URL = "https://www.mecenia.org/exposition/";
const USER_AGENT = "MeceniaSite/1.0 (https://mecenia.org; contact@mecenia.org)";

const esc = (value) =>
  String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const plain = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

function link(url, label) {
  if (!/^https:\/\//.test(url || "")) {
    throw new Error("Lien invalide (https requis) : " + url);
  }
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

function loadExposition() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error("Dossier introuvable : content/expositions");
  }

  const published = fs
    .readdirSync(SOURCE_DIR)
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => ({
      name,
      data: yaml.load(fs.readFileSync(path.join(SOURCE_DIR, name), "utf8"))
    }))
    .filter((item) => item.data && item.data.draft !== true);

  if (!published.length) {
    throw new Error("Aucune exposition publiée dans content/expositions.");
  }

  published.sort((a, b) =>
    String(b.data.period || "").localeCompare(String(a.data.period || ""))
  );

  return published[0];
}

function validate(data, name) {
  const fail = (message) => {
    throw new Error(`Exposition ${name} : ${message}`);
  };

  if (!data.title) fail("titre manquant.");
  if (!Array.isArray(data.acts) || !data.acts.length) fail("aucune étape.");
  if (!Array.isArray(data.works) || !data.works.length) fail("aucune œuvre.");

  const actNumbers = new Set(data.acts.map((act) => Number(act.n)));
  const ids = new Set();

  data.works.forEach((work) => {
    if (!/^[a-z0-9-]+$/.test(work.id || "")) {
      fail(`identifiant d’œuvre invalide : « ${work.id} ».`);
    }
    if (ids.has(work.id)) fail(`identifiant en double : ${work.id}.`);
    ids.add(work.id);
    if (!actNumbers.has(Number(work.act))) {
      fail(`l’œuvre « ${work.title} » pointe vers une étape inexistante.`);
    }
    if (!work.image && !work.commons_file) {
      fail(`l’œuvre « ${work.title} » n’a ni image ni fichier Commons.`);
    }
    if (!/^https:\/\//.test(work.source || "")) {
      fail(`source institutionnelle invalide pour « ${work.title} ».`);
    }
  });
}

async function request(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} : ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function fetchFromCommons(work) {
  const title = "File:" + work.commons_file;
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    titles: title
  });

  const payload = await (
    await request("https://commons.wikimedia.org/w/api.php?" + query)
  ).json();

  const pages = Object.values((payload.query && payload.query.pages) || {});
  const info = pages[0] && pages[0].imageinfo && pages[0].imageinfo[0];

  if (
    !info ||
    info.mime !== "image/jpeg" ||
    !/^https:\/\/upload\.wikimedia\.org\//.test(info.url)
  ) {
    throw new Error("Reproduction introuvable sur Commons : " + title);
  }

  const buffer = Buffer.from(await (await request(info.url)).arrayBuffer());
  if (buffer.length < 1000 || buffer[0] !== 255 || buffer[1] !== 216) {
    throw new Error("Fichier JPEG invalide : " + title);
  }

  const meta = info.extmetadata || {};
  const value = (key) => plain(meta[key] && meta[key].value);
  const file = work.id + ".jpg";
  fs.writeFileSync(path.join(IMAGE_DIR, file), buffer);

  return {
    src: `${IMAGE_URL}/${file}`,
    artist: value("Artist"),
    license: value("LicenseShortName"),
    licenseUrl: value("LicenseUrl"),
    source: info.descriptionurl || ""
  };
}

async function prepareImage(work) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  if (work.image) {
    const local = path.join(ROOT, String(work.image).replace(/^\//, ""));
    if (fs.existsSync(local)) {
      const file = work.id + path.extname(local).toLowerCase();
      fs.copyFileSync(local, path.join(IMAGE_DIR, file));
      return { src: `${IMAGE_URL}/${file}` };
    }
  }

  if (!work.commons_file) {
    throw new Error(`Image introuvable pour « ${work.title} » : ${work.image}`);
  }

  return fetchFromCommons(work);
}

const CSS = `<style id="mecenia-exposition-css">
.expo-page .expo-intro,.expo-page .expo-method{max-width:820px;margin:auto}.expo-page p{text-align:justify;hyphens:auto;text-wrap:pretty;margin-bottom:18px}.expo-page .hero p,.expo-page .cta p{text-align:center}.expo-page [id]{scroll-margin-top:110px}.expo-page h2{font-size:clamp(26px,3.8vw,38px);margin-bottom:22px}.expo-page h3{font-size:27px;margin:12px 0 20px}.expo-page h4{font-size:19px;margin-bottom:12px}.expo-page .expo-note,.expo-page .expo-reading{background:var(--beige);border-left:3px solid var(--caramel);padding:24px;border-radius:10px;margin:24px 0}.expo-page .expo-index{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:32px}.expo-page .expo-index a{border:1px solid var(--line);padding:10px 16px;border-radius:24px;font-size:13px}.expo-page .expo-act{max-width:760px;margin:0 auto 38px;text-align:center}.expo-page .expo-works{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start}.expo-page .expo-work{background:var(--white);border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 12px 32px #2e21140a}.expo-page .expo-figure{background:var(--offwhite)}.expo-page .expo-figure img{width:100%;height:350px;object-fit:contain;padding:20px}.expo-page figcaption,.expo-page .expo-sources{font-size:12px;color:var(--gray);padding:16px;border-top:1px solid var(--line)}.expo-page figcaption a,.expo-page .expo-sources a{text-decoration:underline;color:var(--caramel-dark)}.expo-page .expo-body{padding:28px}.expo-page .expo-number{font-size:11px;letter-spacing:2px;color:var(--bronze)}.expo-page .expo-status{display:inline-block;font-size:11px;padding:6px 10px;background:var(--beige);border:1px solid var(--line);border-radius:20px;margin-bottom:18px}.expo-page .editorial{border-style:dashed}.expo-page .expo-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;border-block:1px solid var(--line);padding:18px 0;margin-bottom:20px;font-size:13px}.expo-page dt{font-size:11px;color:var(--bronze);margin-bottom:4px}.expo-page dd{margin:0}.expo-page .expo-body p{font-size:15px}.expo-page summary{cursor:pointer;color:var(--caramel-dark);padding:16px 0;font-size:14px;min-height:44px}.expo-page details{border-top:1px solid var(--line)}.expo-page .expo-transition{font-style:italic;color:var(--gray)}.expo-page .expo-method ul{padding-left:20px}.expo-page .expo-method li{margin-bottom:12px}.expo-page .expo-source-date{font-size:12px;color:var(--gray)}
@media(max-width:860px){.expo-page .expo-works{grid-template-columns:1fr}.expo-page .expo-figure img{height:320px}.expo-page .expo-body{padding:24px}}@media(max-width:420px){.expo-page .expo-meta{grid-template-columns:1fr}.expo-page .expo-figure img{height:280px}.expo-page .expo-body{padding:20px}}
</style>`;

function renderWork(work, index, image, data) {
  const license = image.licenseUrl
    ? link(image.licenseUrl, image.license)
    : esc(image.license);

  const creditParts = [
    esc(image.artist),
    license,
    image.source ? link(image.source, "Photographie source") : "",
    "Affichage intégral, sans recadrage."
  ].filter(Boolean);

  const contrepoint = work.contrepoint === true;

  return `<article class="expo-work" id="oeuvre-${esc(work.id)}"><figure class="expo-figure"><a href="${esc(image.src)}" target="_blank" rel="noopener" aria-label="Voir ${esc(work.title)} en grand"><img src="${esc(image.src)}" alt="${esc(work.alt)}" loading="lazy" decoding="async"></a><figcaption>${creditParts.join(" · ")}</figcaption></figure><div class="expo-body"><span class="expo-number">Œuvre ${String(index + 1).padStart(2, "0")}</span><h3>${esc(work.title)}</h3><span class="expo-status${contrepoint ? " editorial" : ""}">${esc(work.status)}</span><dl class="expo-meta"><div><dt>Datation</dt><dd>${esc(work.date)}</dd></div><div><dt>Technique / inventaire</dt><dd>${esc(work.medium)}</dd></div><div><dt>Origine</dt><dd>${esc(work.origin)}</dd></div><div><dt>Collection</dt><dd>Musée du Louvre</dd></div></dl><p>${esc(work.notice)}</p>${work.complement ? `<p>${esc(work.complement)} ${link(data.project_url, "Présentation du Louvre")}</p>` : ""}<details><summary>Lire le regard de Mecenia et les sources</summary><div class="expo-reading"><h4>Le regard de Mecenia</h4><p>${esc(work.reading)}</p></div><p class="expo-transition">${esc(work.transition)}</p><div class="expo-sources">${link(work.source, "Consulter la source institutionnelle")}<p>${contrepoint ? "Contrepoint choisi par Mecenia ; aucun déplacement dans la cour n’est annoncé." : "Ensemble présenté dans le projet du Louvre ; cette exposition ne constitue pas un plan d’accrochage."}</p></div></details></div></article>`;
}

function renderPage(data, images, shell) {
  const works = data.works;

  const acts = data.acts
    .map((act) => {
      const cards = works
        .filter((work) => Number(work.act) === Number(act.n))
        .map((work) => renderWork(work, works.indexOf(work), images[work.id], data))
        .join("\n");

      return `<section class="${Number(act.n) === 2 ? "bg-beige" : "bg-white"}" id="etape-${act.n}"><div class="container"><div class="expo-act"><span class="eyebrow">Étape ${act.n} / ${data.acts.length}</span><h2>${esc(act.title)}</h2><p>${esc(act.text)}</p></div><div class="expo-works">${cards}</div></div></section>`;
    })
    .join("\n");

  const paragraphs = (data.intro_paragraphs || []).map((p, i) =>
    i === 0
      ? `<p>${esc(p)} ${link(data.project_url, data.project_link_label || "Découvrir le projet officiel")}</p>`
      : `<p>${esc(p)}</p>`
  ).join("");

  const index = data.acts
    .map((act) => `<a href="#etape-${act.n}">${act.n}. ${esc(act.title)}</a>`)
    .join("");

  const intro = `<section class="bg-white"><div class="container"><div class="expo-intro"><span class="eyebrow">L’intention curatoriale</span><h2>${esc(data.intro_title)}</h2>${paragraphs}<aside class="expo-note" aria-label="Statut de l’exposition"><p>${esc(data.note)}</p></aside></div><nav class="expo-index" aria-label="Étapes de l’exposition">${index}<a href="#sources-exposition">Méthode et sources</a></nav></div></section>`;

  const sourceItems = [
    `<li>${link(data.project_url, "Louvre — Histoire de la cour, chantier et ensembles annoncés")}</li>`,
    ...works
      .filter((work) => work.source !== data.project_url)
      .map((work) => `<li>${link(work.source, "Louvre — " + work.title)}</li>`)
  ].join("");

  const method = `<section class="bg-beige" id="sources-exposition"><div class="container expo-method"><span class="eyebrow">Pour approfondir</span><h2 class="title">${esc(data.method_title)}</h2><p>${esc(data.method_text)}</p><h3>Sources et reproductions</h3><ul>${sourceItems}</ul><p>${esc(data.images_text)}</p><p class="expo-source-date">${esc(data.update_note)}</p></div></section>`;

  const articleButton = data.article_url
    ? `<a class="btn-outline" href="${esc(data.article_url)}">Lire notre article</a>`
    : "";

  const pageTitle = `${data.title} — Exposition | Mecenia`;
  const firstImage = images[works[0].id].src;
  const structured = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: data.seo_description,
    url: PAGE_URL,
    inLanguage: "fr-FR"
  };

  return `<!DOCTYPE html><html lang="fr" class="no-js"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(pageTitle)}</title><meta name="description" content="${esc(data.seo_description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${PAGE_URL}"><meta name="theme-color" content="#2E2114"><meta property="og:type" content="website"><meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(data.seo_description)}"><meta property="og:image" content="https://www.mecenia.org${esc(firstImage)}"><link rel="icon" href="/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${shell.styles}${CSS}<script type="application/ld+json">${JSON.stringify(structured)}</script></head><body><a class="skip" href="#contenu">Aller au contenu</a>${shell.header}<main id="contenu" class="expo-page"><section class="hero small"><div class="container hero-content"><div class="breadcrumb"><a href="/">Accueil</a> / <a href="/blog/">Le blog</a> / L’exposition</div><span class="eyebrow">${esc(data.eyebrow)}</span><h1>${esc(data.title)}</h1><p class="sub">${esc(data.hero_subtitle)}</p><div class="btn-row"><a class="btn" href="#etape-1">Commencer la visite</a>${articleButton}</div></div></section>${intro}${acts}${method}<section class="bg-dark cta"><div class="container"><h2>${esc(data.cta_title)}</h2><p>${esc(data.cta_text)}</p><div class="btn-row"><a class="btn" href="/notre-mission/">Découvrir notre mission</a><a class="btn-outline" href="/contact/">Échanger avec nous</a></div></div></section></main>${shell.footer}<script src="/assets/main.js" defer></script></body></html>`;
}

function readShell() {
  const homePath = path.join(DIST, "index.html");
  if (!fs.existsSync(homePath)) {
    throw new Error("dist/index.html introuvable : le build du site doit précéder ce script.");
  }

  const home = fs.readFileSync(homePath, "utf8");
  const header = home.match(/<header\b[\s\S]*?<\/header>/i);
  const footer = home.match(/<footer\b[\s\S]*?<\/footer>/i);
  const headMatch = home.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);

  if (!header || !footer || !headMatch) {
    throw new Error("En-tête, pied de page ou <head> introuvable dans dist/index.html.");
  }

  const styles = (
    headMatch[1].match(
      /<link\b[^>]*rel=["']stylesheet["'][^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/gi
    ) || []
  ).join("\n");

  return { header: header[0], footer: footer[0], styles };
}

function updateSitemap() {
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) return;

  let xml = fs.readFileSync(file, "utf8");
  if (!/<loc>https:\/\/(?:www\.)?mecenia\.org\/exposition\/<\/loc>/.test(xml)) {
    xml = xml.replace(
      "</urlset>",
      `<url><loc>${PAGE_URL}</loc></url>\n</urlset>`
    );
    fs.writeFileSync(file, xml);
  }
}

(async function main() {
  const { name, data } = loadExposition();
  validate(data, name);

  const shell = readShell();
  const images = {};

  for (const work of data.works) {
    images[work.id] = await prepareImage(work);
  }

  const html = renderPage(data, images, shell);
  const target = path.join(DIST, "exposition", "index.html");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
  updateSitemap();

  console.log(
    `Exposition : ${data.works.length} œuvres, ${data.acts.length} étapes générées depuis ${name}.`
  );
})().catch((error) => {
  console.error("Exposition : échec de la génération —", error.message);
  process.exit(1);
});

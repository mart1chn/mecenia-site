"use strict";
/* Mesure d'audience sans cookie + bandeau d'information. Inactif tant que scripts/analytics.config.json
   ne contient pas d'adresse de script. Ne modifie que dist/ et ne fait jamais échouer le build. */
const fs = require("fs"), path = require("path");
const ROOT = process.cwd(), OUT = path.join(ROOT, "dist");
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = '<style id="mecenia-privacy-css">#mecenia-privacy{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:0 auto;background:#2E2114;color:#F5EFE6;border:1px solid rgba(217,166,127,.5);box-shadow:0 10px 30px rgba(0,0,0,.28);padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;font:400 14px/1.55 Inter,system-ui,sans-serif}#mecenia-privacy p{margin:0;flex:1 1 320px;color:#F5EFE6;text-align:left;hyphens:none}#mecenia-privacy a{color:#D9A67F;text-decoration:underline;text-underline-offset:2px}#mecenia-privacy button{flex:0 0 auto;background:#9A5F37;color:#fff;border:0;padding:10px 20px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}#mecenia-privacy button:hover,#mecenia-privacy button:focus-visible{background:#B77646}#mecenia-privacy a:focus-visible,#mecenia-privacy button:focus-visible{outline:2px solid #D9A67F;outline-offset:2px}</style>';
const JS = '<script id="mecenia-privacy-js">(function(){var K="mecenia-privacy-ack";try{if(localStorage.getItem(K))return}catch(e){}var d=document.createElement("div");d.id="mecenia-privacy";d.setAttribute("role","region");d.setAttribute("aria-label","Information sur la confidentialité");d.innerHTML=\'<p>Ce site ne dépose aucun cookie. Il mesure sa fréquentation avec des données limitées et anonymisées, sans suivi publicitaire. <a href="/mentions-legales/#confidentialite">En savoir plus dans notre politique de confidentialité</a>.</p><button type="button">J’ai compris</button>\';d.querySelector("button").addEventListener("click",function(){try{localStorage.setItem(K,"1")}catch(e){}d.remove()});document.body.appendChild(d)})();</script>';

function policy(cfg) {
  const name = esc(cfg.providerName || "un outil de mesure d’audience"), host = cfg.hostingNote ? " " + esc(cfg.hostingNote) : "";
  return '<h2 id="audience">Cookies, mesure d’audience et polices</h2>' +
    '<p>Ce site ne dépose aucun cookie. Pour savoir quelles pages sont consultées et améliorer nos contenus, il utilise ' + name + ', un outil de mesure d’audience sans cookie.' + host + ' Seules des données limitées et anonymisées sont collectées : pages consultées, site d’origine (domaine uniquement), type d’appareil, navigateur, système d’exploitation et pays. Aucun identifiant n’est enregistré sur votre appareil, vos visites ne sont pas suivies d’un site à l’autre, et ces données ne sont ni revendues ni utilisées à des fins publicitaires.</p>' +
    '<p>Cette mesure repose sur l’intérêt légitime de l’association à connaître la fréquentation de son site. Vous pouvez vous y opposer en écrivant à <a href="mailto:contact@mecenia.org">contact@mecenia.org</a>.</p>' +
    '<p>Lors de votre première visite, un bandeau vous informe de cette mesure. Le fait de le fermer est mémorisé dans le stockage local de votre navigateur (clé « mecenia-privacy-ack »), uniquement pour ne plus afficher le bandeau : cette information ne contient aucune donnée personnelle.</p>' +
    '<p>Les polices Playfair Display et Inter sont chargées depuis Google Fonts, ce qui transmet votre adresse IP à Google.</p>';
}
const OLD = /<h2>Cookies et polices<\/h2><p>[\s\S]*?<\/p>/;

function walk(d, fn) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== "admin") walk(p, fn); } else if (e.name.endsWith(".html")) fn(p); } }

try {
  const cfgFile = path.join(ROOT, "scripts", "analytics.config.json");
  const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, "utf8")) : {};
  if (!cfg.scriptSrc || !/^https:\/\//.test(cfg.scriptSrc)) { console.log("Audience : inactive (aucune adresse de script dans scripts/analytics.config.json)."); }
  else if (!fs.existsSync(OUT)) { console.warn("Audience : dossier dist absent."); }
  else {
    const legal = path.join(OUT, "mentions-legales", "index.html");
    let ok = false;
    if (fs.existsSync(legal)) {
      let h = fs.readFileSync(legal, "utf8");
      if (h.includes('id="audience"')) ok = true;
      else if (OLD.test(h)) { h = h.replace(OLD, () => policy(cfg)); fs.writeFileSync(legal, h); ok = true; }
    }
    if (!ok) console.warn("Audience : politique de confidentialité introuvable ou modifiée, mesure non activée.");
    else {
      const attrs = Object.entries(cfg.attributes || {}).map(([k, v]) => /^[a-z][a-z0-9-]*$/i.test(k) ? " " + k + '="' + esc(v) + '"' : "").join("");
      const tag = '<script id="mecenia-analytics" ' + (cfg.async ? "async" : "defer") + ' src="' + esc(cfg.scriptSrc) + '"' + attrs + "></script>" + (cfg.initSnippet ? '<script id="mecenia-analytics-init">' + String(cfg.initSnippet).replace(/<\/script/gi, "<\\/script") + "</script>" : "");
      let n = 0;
      walk(OUT, p => {
        let h = fs.readFileSync(p, "utf8"), o = h;
        if (!h.includes('id="mecenia-analytics"') && h.includes("</head>")) h = h.replace("</head>", () => tag + "\n</head>");
        if (!h.includes('id="mecenia-privacy-css"') && h.includes("</head>")) h = h.replace("</head>", () => CSS + "\n</head>");
        if (!h.includes('id="mecenia-privacy-js"') && h.includes("</body>")) h = h.replace("</body>", () => JS + "\n</body>");
        if (h !== o) { fs.writeFileSync(p, h); n++; }
      });
      console.log("Audience : mesure sans cookie et bandeau ajoutés à " + n + " page(s).");
    }
  }
} catch (e) { console.error("Audience : étape ignorée", e.message); }

"use strict";
/* Articles du blog : images d'illustration (hors infographies SVG) limitées en hauteur, centrées.
   Ne modifie que dist/ et ne fait jamais échouer le build. */
const fs = require("fs"), path = require("path");
const BLOG = path.join(process.cwd(), "dist", "blog");
const CSS = '<style id="mecenia-article-images">' +
  '.post p>img:not([src$=".svg"]),.post figure:not(.mag-fig)>img:not([src$=".svg"]){display:block;width:auto;height:auto;max-width:100%;max-height:min(48vh,380px);margin:24px auto;object-fit:contain}' +
  '.post-cover img:not([src$=".svg"]){max-height:min(52vh,400px)}' +
  '</style>';
try {
  let n = 0;
  if (fs.existsSync(BLOG)) for (const e of fs.readdirSync(BLOG, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const f = path.join(BLOG, e.name, "index.html");
    if (!fs.existsSync(f)) continue;
    const h = fs.readFileSync(f, "utf8");
    if (h.includes('id="mecenia-article-images"') || !h.includes("</head>")) continue;
    fs.writeFileSync(f, h.replace("</head>", () => CSS + "\n</head>")); n++;
  }
  console.log("Images d'articles : hauteur limitée sur " + n + " article(s).");
} catch (e) { console.error("Images d'articles : étape ignorée", e.message); }

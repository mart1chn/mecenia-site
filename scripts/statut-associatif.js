"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DIST = path.join(process.cwd(), "dist");

const clean = (html) =>
  html
    .replace(
      /Association loi 1901 en cours de formation\./g,
      "Association loi 1901."
    )
    .replace(
      /basée à Paris \(en cours de formation\)/g,
      "basée à Paris"
    );

let changed = 0;

function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== "admin") visit(file);
    } else if (/\.(html|json|txt|xml)$/.test(entry.name)) {
      const before = fs.readFileSync(file, "utf8");
      const after = clean(before);
      if (after !== before) {
        fs.writeFileSync(file, after);
        changed++;
      }
    }
  }
}

if (fs.existsSync(DIST)) visit(DIST);

console.log(`Statut associatif corrigé dans ${changed} fichier(s).`);

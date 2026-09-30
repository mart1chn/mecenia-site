'use strict';
/* Dernière étape du build : fixe l'ambition culturelle de Mecenia à 5 % du PIB en 2040.
   Scanne la version générée du site afin de couvrir textes, compteurs et graphique,
   sans modifier les autres éléments. */
const fs = require('fs'), path = require('path');
const OUT = path.join(process.cwd(), 'dist');
let changes = 0;
function replaceAll(s) {
  const before = s;
  /* Textes et contenus structurés : uniquement la cible de pourcentage. */
  s = s.replace(/10\s*%\s+du\s+PIB/gi, '5 % du PIB');
  s = s.replace(/à\s+10\s*%/gi, 'à 5 %');
  s = s.replace(/de\s+10\s*%/gi, 'de 5 %');
  /* Compteur animé de l'accueil : data-count contrôle le nombre affiché par JavaScript. */
  s = s.replace(/data-count=(['"])10\1/g, (m, quote) => 'data-count=' + quote + '5' + quote);
  /* Données du graphique : couvrent les attributs HTML encodés et le JSON brut. */
  s = s.replace(/(&quot;value&quot;|["']value["'])\s*:\s*10(?=\s*[,}])/g, (m, key) => key + ':5');
  if (s !== before) changes++;
  return s;
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(p); continue; }
    if (!/\.(html|txt|xml|js|json)$/i.test(entry.name)) continue;
    const src = fs.readFileSync(p, 'utf8'), out = replaceAll(src);
    if (out !== src) fs.writeFileSync(p, out);
  }
}
if (fs.existsSync(OUT)) walk(OUT);
console.log('Objectif culturel : 5 % du PIB en 2040 (' + changes + ' fichier(s) mis à jour.');

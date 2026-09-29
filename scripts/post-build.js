'use strict';
/* Après la génération du site : branche les formulaires sur Netlify Forms et met à jour les textes correspondants. */
const fs = require('fs'), path = require('path');
const OUT = path.join(process.cwd(), 'dist');
fs.rmSync(path.join(OUT, 'netlify'), { recursive: true, force: true });
fs.copyFileSync(path.join(process.cwd(), 'scripts', 'forms.js'), path.join(OUT, 'assets', 'forms.js'));
const TAG = '<script src="/assets/forms.js" defer></script>';
const SWAPS = [
  ['Votre demande est envoyée directement à contact@mecenia.org.', 'Votre demande est transmise directement à l’équipe de Mecenia.'],
  ['Votre message est envoyé directement à contact@mecenia.org.', 'Votre message est transmis directement à l’équipe de Mecenia.'],
  ['sont transmis par e-mail à l’association par le service FormSubmit (avec Netlify Forms en solution de secours).', 'sont enregistrés par le service Netlify Forms, puis dans un espace privé et sécurisé de l’association, hébergé chez GitHub.']
];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'admin') walk(p); }
    else if (e.name.endsWith('.html')) {
      const o = fs.readFileSync(p, 'utf8'); let h = o;
      if (h.includes('</body>') && !h.includes('/assets/forms.js')) h = h.replace('</body>', TAG + '\n</body>');
      for (const s of SWAPS) h = h.split(s[0]).join(s[1]);
      if (h !== o) fs.writeFileSync(p, h);
    }
  }
})(OUT);
console.log('Formulaires : envoi via Netlify Forms activé.');

'use strict';
/* Dernière sécurisation des panneaux : conversion en <details>/<summary> natifs.
   Pas de dépendance JavaScript côté visiteur : fonctionne avec cache, mobile et accessibilité native. */
const fs = require('fs'), path = require('path');
const OUT = path.join(process.cwd(), 'dist');
const CSS = `<style id="mecenia-native-accordion">
/* Panneaux natifs : les styles existants restent, mais l'ouverture est assurée par HTML. */
details.plus-item{border-bottom:1px solid var(--line)}
details.plus-item:first-child{border-top:1px solid var(--line)}
summary.plus-btn{list-style:none;width:100%;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:24px 4px;background:none;border:0;cursor:pointer;text-align:left;font:600 17px/1.4 Inter,system-ui,sans-serif;color:inherit}
summary.plus-btn::-webkit-details-marker{display:none}
summary.plus-btn .ico{position:relative;flex:0 0 34px;width:34px;height:34px;border:1px solid rgba(154,95,55,.55);border-radius:50%;transition:transform .35s ease,background .3s ease}
summary.plus-btn .ico::before,summary.plus-btn .ico::after{content:'';position:absolute;left:50%;top:50%;width:12px;height:1.5px;background:#9A5F37;transform:translate(-50%,-50%)}
summary.plus-btn .ico::after{transform:translate(-50%,-50%) rotate(90deg);transition:transform .35s ease}
details.plus-item[open] .ico{background:#9A5F37;transform:rotate(180deg)}
details.plus-item[open] .ico::before,details.plus-item[open] .ico::after{background:#fff}
details.plus-item[open] .ico::after{transform:translate(-50%,-50%) rotate(0deg)}
details.plus-item .plus-inner{padding:0 4px 26px;color:var(--gray);animation:mecenia-panel-in .32s ease both}
@keyframes mecenia-panel-in{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
.bg-dark details.plus-item,.bg-grad details.plus-item{border-color:rgba(255,255,255,.16)}
.bg-dark summary.plus-btn .ico,.bg-grad summary.plus-btn .ico{border-color:rgba(217,166,127,.6)}
.bg-dark summary.plus-btn .ico::before,.bg-dark summary.plus-btn .ico::after,.bg-grad summary.plus-btn .ico::before,.bg-grad summary.plus-btn .ico::after{background:#D9A67F}
.bg-dark details.plus-item[open] .ico,.bg-grad details.plus-item[open] .ico{background:#D9A67F}
.bg-dark details.plus-item[open] .ico::before,.bg-dark details.plus-item[open] .ico::after,.bg-grad details.plus-item[open] .ico::before,.bg-grad details.plus-item[open] .ico::after{background:#2E2114}
/* Contraste : texte clair pour les panneaux dépliés sur les fonds brun et dégradé. */
.bg-dark details.plus-item .plus-inner,.bg-grad details.plus-item .plus-inner{color:#F5EFE6}
.bg-dark details.plus-item .plus-inner strong,.bg-grad details.plus-item .plus-inner strong{color:#FFFFFF}
</style>`;
const JS = `<script id="mecenia-native-exclusive">(function(){document.querySelectorAll('details.plus-item').forEach(function(item){item.addEventListener('toggle',function(){if(!item.open)return;var group=item.closest('[data-accordion]');if(!group)return;group.querySelectorAll('details.plus-item[open]').forEach(function(other){if(other!==item)other.open=false})})})})();</script>`;
/* Markup attendu après scripts/enhance.js : plus-item > bouton + panneau > plus-inner. */
const PANEL = /<div class="plus-item">\s*<button class="plus-btn" type="button" aria-expanded="false">([\s\S]*?)<\/button>\s*<div class="plus-panel"><div><div class="plus-inner">([\s\S]*?)<\/div><\/div><\/div><\/div>/g;
let count = 0;
function processFile(file) {
  let h = fs.readFileSync(file, 'utf8'), before = h;
  h = h.replace(PANEL, (m, heading, body) => { count++; return '<details class="plus-item"><summary class="plus-btn">' + heading + '</summary><div class="plus-inner">' + body + '</div></details>'; });
  if (h.includes('<details class="plus-item">') && !h.includes('mecenia-native-accordion')) h = h.replace('</head>', CSS + '\n</head>');
  if (h.includes('<details class="plus-item">') && !h.includes('mecenia-native-exclusive')) h = h.replace('</body>', JS + '\n</body>');
  if (h !== before) fs.writeFileSync(file, h);
}
function walk(dir) { for (const e of fs.readdirSync(dir, {withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()){if(e.name!=='admin')walk(p)} else if(e.name.endsWith('.html'))processFile(p); } }
if (fs.existsSync(OUT)) walk(OUT);
console.log('Panneaux natifs : ' + count + ' menu(s) converti(s).');

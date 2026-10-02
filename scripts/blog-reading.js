'use strict';
/* Blog : temps de lecture estimé et barre de progression de lecture sur les articles.
   Ajout purement côté navigateur : aucun contenu n'est modifié. Ne fait jamais échouer le build. */
const fs = require('fs'), path = require('path');
const DIR = path.join(process.cwd(), 'dist', 'blog');
const CSS = '<style id="mecenia-reading-css">.read-progress{position:fixed;top:0;left:0;right:0;height:4px;z-index:2000;background:rgba(46,33,20,.08);pointer-events:none;opacity:0;transition:opacity .25s ease}.read-progress.on{opacity:1}.read-progress span{display:block;height:100%;background:linear-gradient(90deg,#9A5F37,#D9A67F);transform:scaleX(0);transform-origin:left center;will-change:transform}.read-time{white-space:nowrap}@media print{.read-progress{display:none}}</style>';
const JS = '<script id="mecenia-reading-js">(function(){var art=document.querySelector("article.prose.post");if(!art)return;var text=(art.innerText||art.textContent||"").replace(/\\s+/g," ").trim();var words=text?text.split(" ").length:0;var min=Math.max(1,Math.ceil(words/220));var sub=document.querySelector(".hero .sub");if(sub&&!sub.querySelector(".read-time")){var t=document.createElement("span");t.className="read-time";t.textContent=" \u00b7 "+min+" min de lecture";sub.appendChild(t)}var bar=document.createElement("div");bar.className="read-progress";bar.setAttribute("role","progressbar");bar.setAttribute("aria-label","Progression de la lecture");bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax","100");bar.setAttribute("aria-valuenow","0");var fill=document.createElement("span");bar.appendChild(fill);document.body.appendChild(bar);var ticking=false,last=-1;function update(){ticking=false;var r=art.getBoundingClientRect(),vh=window.innerHeight||document.documentElement.clientHeight,p=r.height>0?(vh*0.6-r.top)/r.height:0;p=Math.max(0,Math.min(1,p));fill.style.transform="scaleX("+p+")";bar.classList.toggle("on",p>0.002);var pct=Math.round(p*100);if(pct!==last){last=pct;bar.setAttribute("aria-valuenow",String(pct))}}function req(){if(!ticking){ticking=true;window.requestAnimationFrame(update)}}window.addEventListener("scroll",req,{passive:true});window.addEventListener("resize",req);window.addEventListener("load",req);update()})();</script>';
function walk(d, out) {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
let n = 0;
for (const f of walk(DIR, [])) {
  try {
    let h = fs.readFileSync(f, 'utf8');
    if (h.includes('mecenia-reading-js') || !h.includes('</head>') || !h.includes('</body>')) continue;
    h = h.replace('</head>', CSS + '\n</head>').replace('</body>', JS + '\n</body>');
    fs.writeFileSync(f, h); n++;
  } catch (e) { console.error('Lecture : page ignorée', f, e.message); }
}
console.log('Lecture : ' + n + ' page(s) du blog équipée(s) du temps de lecture et de la barre de progression.');

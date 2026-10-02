'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const OUT = path.join(process.cwd(), 'dist');
function polish(h) {
  if (!h.includes('article class="prose post"')) return h;
  h = h.replace(/(<article class="prose post">)([\s\S]*?)(<\/article>)/, (m,a,x,b) => {
    x = x.replace(/&lt;small&gt;([\s\S]*?)&lt;\/small&gt;/g, '<small>$1</small>');
    x = x.replace(/<p>_((?:(?!<\/p>)[\s\S])*?)_<\/p>/g, '<p><em>$1</em></p>');
    x = x.split(/(<[^>]+>)/).map(s => s.charAt(0)==='<' ? s : s.replace(/(^|[\s(«])_([^_\s](?:[^_]*[^_\s])?)_(?=$|[\s.,;:!?)»])/g,'$1<em>$2</em>')).join('');
    x = x.replace(/<p>-#\s+((?:(?!<\/p>)[\s\S])*?)<\/p>/g,'<p class="small">$1</p>');
    x = x.replace(/(<p>(?:<a [^>]*>)?<img [^>]*>(?:<\/a>)?<\/p>\s*)<p>(<em>(?:(?!<\/p>)[\s\S])*?<\/em>)<\/p>/g,'$1<p class="legende">$2</p>');
    return a+x+b;
  });
  if (!h.includes('mecenia-post-polish')) h=h.replace('</head>','<style id="mecenia-post-polish">.post small{font-size:.82em;color:var(--gray)}.post p.small{font-size:13.5px;line-height:1.55;color:var(--gray);text-align:left}.post p.legende{font-size:13.5px;line-height:1.5;color:var(--gray);text-align:center;margin:-10px auto 30px;max-width:680px}</style>\n</head>');
  return h;
}
function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const a=fs.readFileSync(p,'utf8'),b=polish(a);if(a!==b)fs.writeFileSync(p,b)}}}
function thumb(f,w){const h=crypto.createHash('md5').update(f).digest('hex');return 'https://upload.wikimedia.org/wikipedia/commons/thumb/'+h[0]+'/'+h.slice(0,2)+'/'+encodeURIComponent(f)+'/'+w+'px-'+encodeURIComponent(f)}
const babel='Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project_-_edited.jpg';
const babelFig='<figure class="art-fig"><img src="'+thumb(babel,960)+'" srcset="'+thumb(babel,500)+' 500w, '+thumb(babel,960)+' 960w" sizes="(max-width:860px) 92vw, 520px" width="960" height="703" alt="Tableau de Pieter Bruegel l’Ancien : le roi Nemrod visite le chantier de la tour de Babel, immense édifice en spirale grouillant d’ouvriers" loading="lazy" decoding="async"><figcaption>Pieter Bruegel l’Ancien, <i>La Tour de Babel</i>, 1563. Kunsthistorisches Museum, Vienne. <a href="https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(babel)+'" target="_blank" rel="noopener">Domaine public · Wikimedia Commons</a></figcaption></figure>';
const home=path.join(OUT,'index.html');
if(fs.existsSync(home)){let h=fs.readFileSync(home,'utf8');const start=h.indexOf('<section',h.indexOf('La culture, un seul et même horizon')-5000);const marker=h.indexOf('La culture, un seul et même horizon');const end=marker<0?-1:h.indexOf('</section>',marker);if(start>=0&&end>=0){const section='<section class="bg-white art-band" data-diversity="1"><div class="container"><span class="eyebrow reveal">Un patrimoine universel</span><h2 class="title reveal">La culture, un seul et même horizon</h2><p class="lead reveal">Un prince de Sumer, bâtisseur de temples, sculpté en prière il y a plus de 4 000 ans ; une flotte de conquête brodée sur du lin au XIe siècle ; un roi qui inspecte le chantier de la tour de Babel, peint par Bruegel en 1563 : une sculpture, une tapisserie et une peinture, séparées par des siècles, racontent pourtant la même histoire, celle des commanditaires et des artisans qui bâtissent ensemble. Les formes d’art se répondent et se nourrissent les unes les autres : c’est cet ensemble, dans toute sa diversité, que Mecenia veut financer, valoriser et protéger.</p><div class="art-trio diverse-trio stagger"><figure class="art-fig"><img src="'+thumb('Gudea_statue_I_(AO_3293_and_AO_4108)_-_Musée_du_Louvre_(31064822070).jpg',960)+'" alt="Statue assise de Gudea" loading="lazy" decoding="async"></figure><figure class="art-fig"><img src="'+thumb('Flotte_normande.jpg',960)+'" alt="Flotte normande de la Tapisserie de Bayeux" loading="lazy" decoding="async"></figure>'+babelFig+'</div></div></section>';h=h.slice(0,start)+section+h.slice(end+10);fs.writeFileSync(home,h)}}
walk(path.join(OUT,'blog'));console.log('Articles : italique, notes et légendes corrigés ; accueil : triptyque chronologique actualisé.');

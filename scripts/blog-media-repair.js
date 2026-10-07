'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const yaml = require('js-yaml'), MarkdownIt = require('markdown-it');
const ROOT = process.cwd(), OUT = path.join(ROOT, 'dist'), DIR = path.join(ROOT, 'content', 'blog');
const md = new MarkdownIt({html:false, linkify:false, typographer:false});
const esc = s => md.utils.escapeHtml(String(s == null ? '' : s));
const fallback = [
  ['mecenia-formes-soutien-culture.svg', 'Infographie Mecenia — Quatre façons de soutenir la culture. Source : [ministère de la Culture](https://www.culture.gouv.fr/thematiques/mecenat/entreprises/le-regime-fiscal-general).'],
  ['mecenia-modeles-culture-international.svg', 'Infographie Mecenia — Trois approches du soutien culturel. Synthèse des sources institutionnelles et juridiques citées dans cette section ; elle ne présente pas un classement des pays.'],
  ['Fondation_Beyeler_2011_B.JPG', 'Fondation Beyeler, Riehen, Suisse. Photographie : Louis-Fabrice Jean — [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Fondation_Beyeler_2011_B.JPG), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Fichier source non modifié ; affichage redimensionné.']
];
function clean(s) {return String(s || '').replace(/&#(?:32|x20);/gi, ' ');}
const imageRule = md.renderer.rules.image;
md.renderer.rules.image = function(t,i,o,e,r) {t[i].attrSet('loading','lazy');t[i].attrSet('decoding','async');return imageRule(t,i,o,e,r);};
function render(source) {
  const tokens = md.parse(clean(source), {});
  for (let i=0;i<tokens.length-2;i++) {
    const p=tokens[i], inline=tokens[i+1], end=tokens[i+2];
    if (p.type!=='paragraph_open' || inline.type!=='inline' || end.type!=='paragraph_close') continue;
    const children=(inline.children || []).filter(t=>!(t.type==='text' && !t.content.trim()));
    if (children.length!==1 || children[0].type!=='image') continue;
    const image=children[0], src=image.attrGet('src') || '';
    let caption=image.attrGet('title') || '', count=3;
    const next=tokens[i+4];
    if (tokens[i+3] && tokens[i+3].type==='paragraph_open' && next && next.type==='inline' && tokens[i+5] && tokens[i+5].type==='paragraph_close' && /Photograph|Photo\s*:|Source\s*:|Infographie|Wikimedia|domaine public|CC0|CC BY/i.test(next.content)) {
      if (!caption) caption=next.content;
      count=6;
    }
    if (!caption) {let decoded=src;try{decoded=decodeURIComponent(src);}catch(e){}const f=fallback.find(x=>decoded.includes(x[0]));if(f)caption=f[1];}
    image.attrs=(image.attrs || []).filter(x=>x[0]!=='title');
    const svg=/\.svg(?:[?#]|$)/i.test(src);
    const html='<figure class="media-figure '+(svg?'media-infographic':'media-photo')+'">'+md.renderer.renderInline([image],md.options,{})+(caption?'<figcaption>'+md.renderInline(clean(caption))+'</figcaption>':'')+'</figure>\n';
    const token=new p.constructor('html_block','',0);token.content=html;
    tokens.splice(i,count,token);
  }
  return md.renderer.render(tokens,md.options,{});
}
function figure(b,cls) {
  if (!b.image) return '';
  const src=String(b.image);
  if (!md.validateLink(src)) return '';
  const type=/\.svg(?:[?#]|$)/i.test(src)?' media-infographic':' media-photo';
  return '<figure class="mag-fig media-figure '+cls+type+'"><img src="'+esc(src)+'" alt="'+esc(b.alt || '')+'" loading="lazy" decoding="async">'+(b.legende?'<figcaption>'+md.renderInline(clean(b.legende))+'</figcaption>':'')+'</figure>';
}
function block(b) {
  if (!b || typeof b!=='object') return '';
  if (b.type==='texte') return '<div class="mag mag-text">'+render(b.texte)+'</div>';
  if (b.type==='image') return '<div class="mag">'+figure(b,({panoramique:'wide',paysage:'land'})[b.format] || 'full')+'</div>';
  if (b.type==='texte_image') {
    const w=({etroite:'30%',moyenne:'40%',large:'50%'})[b.largeur] || '40%';
    return '<div class="mag mag-side '+(b.cote==='gauche'?'left':'right')+'" style="--w:'+w+'">'+figure(b,b.cadrage==='original'?'side':'side crop')+'<div class="mag-text">'+render(b.texte)+'</div></div>';
  }
  if (b.type==='galerie') {
    const images=(Array.isArray(b.images)?b.images:[]).filter(x=>x && x.image).slice(0,3);
    if (!images.length) return '';
    const cls=({portrait:'crop',paysage:'land',carre:'square'})[b.cadrage] || 'full';
    return '<div class="mag mag-gallery n'+images.length+'">'+images.map(x=>figure(x,cls)).join('')+'</div>';
  }
  if (b.type==='citation') return '<blockquote class="mag-quote"><p>'+md.renderInline(clean(b.texte))+'</p>'+(b.auteur?'<cite>'+esc(b.auteur)+'</cite>':'')+'</blockquote>';
  if (b.type==='encadre') return '<aside class="mag-box">'+(b.titre?'<h3>'+esc(b.titre)+'</h3>':'')+render(b.texte)+'</aside>';
  return '';
}
function tests() {
  const assert=require('assert');
  let h=render('![Alt](https://example.org/photo_(test).jpg "Crédit")');
  assert(h.includes('photo_(test).jpg'));assert(h.includes('<figcaption>Crédit</figcaption>'));
  h=render('![Alt](/assets/photo.jpg)\n\n_Photo : Auteur — [Source](https://example.org/)._');
  assert(h.includes('<figcaption>'));assert.strictEqual((h.match(/Photo : Auteur/g)||[]).length,1);
  h=render('Entreprise :&#32;[contact](/contact/)');assert(!h.includes('&amp;#32;'));assert(h.includes('href="/contact/"'));
  assert(render('[test](javascript:alert(1))').indexOf('href="javascript:')===-1);
  assert(render('![Graphique](/assets/img/blog/mecenia-formes-soutien-culture.svg)').includes('Infographie Mecenia'));
  assert(block({type:'image',image:'/a.jpg',legende:'Photo : [source](https://example.org/)'}).includes('<figcaption>'));
}
const CSS='<style id="mecenia-media-repair">.post .media-figure{margin:28px auto;max-width:100%;min-width:0}.post .media-figure img{display:block;margin:0 auto;border:1px solid var(--line);max-width:100%}.post .media-figure.media-photo:not(.mag-fig) img{width:auto;height:auto;max-height:min(55vh,440px);object-fit:contain}.post .media-figure.media-infographic img{width:100%;height:auto;max-height:none;aspect-ratio:auto;object-fit:contain}.post .media-figure figcaption{display:block;visibility:visible;opacity:1;height:auto;max-height:none;overflow:visible;font-size:13.5px;line-height:1.6;color:var(--gray);text-align:left;margin:12px auto 0;max-width:760px}.post .media-figure figcaption p{font-size:inherit;margin:0}.post .mag-fig.media-figure{margin:0}.post .mag-fig.media-infographic img{aspect-ratio:auto;object-fit:contain}.post .media-figure figcaption a{color:var(--caramel-dark);overflow-wrap:anywhere}</style>';
function wikimedia(src) {
  try {
    const u=new URL(src);
    if (u.hostname==='upload.wikimedia.org') return u.href;
    if (u.hostname!=='commons.wikimedia.org') return null;
    const match=u.pathname.match(/\/Special:Redirect\/file\/(.+)$/i);if(!match)return null;
    const filename=decodeURIComponent(match[1]).replace(/ /g,'_');
    const hash=crypto.createHash('md5').update(filename).digest('hex');
    return 'https://upload.wikimedia.org/wikipedia/commons/'+hash[0]+'/'+hash.slice(0,2)+'/'+encodeURIComponent(filename);
  } catch(e) {return null;}
}
const cache=new Map();
async function localImage(src) {
  const url=wikimedia(src);if(!url)return src;
  if (cache.has(url))return cache.get(url);
  const job=(async()=>{
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'MeceniaBlogBuild/1.0 (https://www.mecenia.org/contact/)'}});
      if(!response.ok)throw Error('HTTP '+response.status);
      const type=(response.headers.get('content-type') || '').split(';')[0];
      const ext=({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'})[type];if(!ext)throw Error('type non pris en charge : '+type);
      const reader=response.body.getReader(), chunks=[];let size=0;
      for(;;){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>30*1024*1024){await reader.cancel();throw Error('image trop volumineuse');}chunks.push(Buffer.from(x.value));}
      if(!size)throw Error('image vide');
      const name=crypto.createHash('sha256').update(url).digest('hex').slice(0,24)+ext;
      const dir=path.join(OUT,'assets','img','blog-cache');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name),Buffer.concat(chunks));
      return '/assets/img/blog-cache/'+name;
    } catch(e) {console.warn('Média Wikimedia conservé à distance : '+src+' ('+e.message+')');return url;}
  })();cache.set(url,job);return job;
}
async function cacheImages(html) {
  const matches=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
  for(const match of matches){const src=md.utils.unescapeAll(match[1]), local=await localImage(src);if(local!==src)html=html.replace(match[0],match[0].replace('src="'+match[1]+'"','src="'+esc(local)+'"'));}
  return html;
}
async function run() {
  tests();
  if(!fs.existsSync(DIR))return;
  let count=0;
  for(const file of fs.readdirSync(DIR)) {
    if(!/\.md$/i.test(file))continue;
    const raw=fs.readFileSync(path.join(DIR,file),'utf8');
    const match=raw.replace(/^\uFEFF/,'').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);if(!match)continue;
    const data=yaml.load(match[1]) || {};if(String(data.draft).toLowerCase()==='true')continue;
    const slug=file.replace(/\.md$/i,'').replace(/^\d{4}-\d{2}-\d{2}-/,'');
    const target=path.join(OUT,'blog',slug,'index.html');if(!fs.existsSync(target))continue;
    let html=fs.readFileSync(target,'utf8');
    const marker=/<article class="prose post">[\s\S]*?<\/article>/;if(!marker.test(html)){console.warn('Médias : article introuvable pour '+slug);continue;}
    let body=render(match[2])+(Array.isArray(data.blocks)?data.blocks.map(block).join('\n'):'');
    body=await cacheImages(body);
    html=html.replace(marker,()=>'<article class="prose post">'+body+'</article>');
    if(!html.includes('id="mecenia-media-repair"'))html=html.replace('</head>',()=>CSS+'\n</head>');
    fs.writeFileSync(target,html);count++;
  }
  console.log('Médias : rendu commun et légendes sur '+count+' article(s). Tests de régression réussis.');
}
run().catch(e=>{console.error('Échec du correctif médias :',e);process.exitCode=1;});

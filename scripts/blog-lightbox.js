"use strict";
/* Aperçu et zoom des images des articles, sans modifier leur affichage normal. */
const fs = require("fs"), path = require("path");
const BLOG = path.join(process.cwd(), "dist", "blog");
const CSS = `<style id="mecenia-lightbox-css">
.lb-zoomable{cursor:zoom-in}.lb-zoomable:focus-visible{outline:2px solid #9A5F37;outline-offset:3px}
#mecenia-lightbox{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:rgba(24,16,8,.96);color:#F5EFE6;overflow:auto;z-index:10000}
#mecenia-lightbox::backdrop{background:rgba(24,16,8,.8)}
#mecenia-lightbox .lb-stage{box-sizing:border-box;min-height:100%;display:flex;padding:72px 16px 64px}
#mecenia-lightbox .lb-img{display:block;flex:none;margin:auto;width:auto;height:auto;max-width:100%;max-height:calc(100vh - 136px);max-height:calc(100dvh - 136px);background:#fff;cursor:zoom-in;box-shadow:0 12px 40px rgba(0,0,0,.45)}
#mecenia-lightbox.lb-zoomed .lb-img{max-width:none;max-height:none;cursor:zoom-out}
#mecenia-lightbox .lb-close{position:fixed;top:14px;right:14px;width:44px;height:44px;padding:0;border:1px solid #D9A67F;border-radius:50%;background:#2E2114;color:#F5EFE6;font:400 28px/1 Inter,system-ui,sans-serif;cursor:pointer;z-index:2}
#mecenia-lightbox .lb-zoom{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);padding:8px 16px;border:1px solid #D9A67F;background:#2E2114;color:#F5EFE6;font:400 14px/1.4 Inter,system-ui,sans-serif;cursor:pointer;z-index:2}
#mecenia-lightbox button:focus-visible,#mecenia-lightbox .lb-img:focus-visible{outline:2px solid #D9A67F;outline-offset:3px}
</style>`;
const JS = `<script id="mecenia-lightbox-js">(function(){
if(typeof HTMLDialogElement==='undefined')return;
var images=[].slice.call(document.querySelectorAll('.post img,.post-cover img,.mag-fig img')).filter(function(i){return !i.closest('a')});
if(!images.length)return;
var dialog,stage,big,closeButton,zoomButton,last,overflow='',active=false;
function restore(){if(!active||dialog.open)return;active=false;fit();big.removeAttribute('src');document.documentElement.style.overflow=overflow;if(last)last.focus()}
function closePreview(){dialog.close();restore()}
function fit(){big.style.width='';dialog.classList.remove('lb-zoomed');zoomButton.textContent='Agrandir';zoomButton.setAttribute('aria-pressed','false')}
function zoom(){if(dialog.classList.contains('lb-zoomed')){fit();return}var width=big.getBoundingClientRect().width;dialog.classList.add('lb-zoomed');big.style.width=Math.round(Math.max(big.naturalWidth||0,width*2,1500))+'px';zoomButton.textContent='Réduire';zoomButton.setAttribute('aria-pressed','true')}
function build(){
 dialog=document.createElement('dialog');dialog.id='mecenia-lightbox';dialog.setAttribute('aria-label','Aperçu agrandi de l’image');
 closeButton=document.createElement('button');closeButton.type='button';closeButton.className='lb-close';closeButton.textContent='×';closeButton.setAttribute('aria-label','Fermer l’aperçu');
 zoomButton=document.createElement('button');zoomButton.type='button';zoomButton.className='lb-zoom';zoomButton.textContent='Agrandir';zoomButton.setAttribute('aria-pressed','false');
 stage=document.createElement('div');stage.className='lb-stage';big=document.createElement('img');big.className='lb-img';big.alt='';big.tabIndex=0;big.setAttribute('role','button');big.setAttribute('aria-label','Agrandir ou réduire l’image');stage.appendChild(big);
 dialog.appendChild(closeButton);dialog.appendChild(stage);dialog.appendChild(zoomButton);document.body.appendChild(dialog);
 closeButton.addEventListener('click',closePreview);zoomButton.addEventListener('click',zoom);
 stage.addEventListener('click',function(e){if(e.target===big)zoom();else if(e.target===stage)closePreview()});
 dialog.addEventListener('click',function(e){if(e.target===dialog)closePreview()});
 big.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();zoom()}});
 dialog.addEventListener('cancel',function(e){e.preventDefault();closePreview()});
 dialog.addEventListener('close',restore);
 dialog.addEventListener('keydown',function(e){if(e.key==='Tab'){var nodes=[closeButton,big,zoomButton],i=nodes.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();zoomButton.focus()}else if(!e.shiftKey&&i===2){e.preventDefault();closeButton.focus()}}});
}
function open(image){if(!dialog)build();if(dialog.open)return;restore();active=true;last=image;fit();big.src=image.currentSrc||image.src;big.alt=image.alt||'';overflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';dialog.showModal();dialog.scrollTop=0;dialog.scrollLeft=0;closeButton.focus()}
images.forEach(function(image){image.classList.add('lb-zoomable');image.tabIndex=0;image.setAttribute('role','button');image.setAttribute('aria-haspopup','dialog');image.setAttribute('aria-label','Agrandir l’image'+(image.alt?' : '+image.alt:''));image.addEventListener('click',function(){open(image)});image.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(image)}})});
})();</script>`;
try {
 let count=0;
 if(fs.existsSync(BLOG))for(const entry of fs.readdirSync(BLOG,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const file=path.join(BLOG,entry.name,"index.html");if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,"utf8"),before=html;
  if(!html.includes('id="mecenia-lightbox-css"'))html=html.replace("</head>",()=>CSS+"\n</head>");
  if(!html.includes('id="mecenia-lightbox-js"'))html=html.replace("</body>",()=>JS+"\n</body>");
  if(html!==before){fs.writeFileSync(file,html);count++}
 }
 console.log("Aperçu des images : "+count+" article(s) équipé(s).");
}catch(e){console.error("Aperçu des images : étape ignorée",e.message)}

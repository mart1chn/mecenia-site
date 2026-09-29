
(function(){'use strict';
document.documentElement.classList.remove('no-js');
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var burger=document.querySelector('.burger'),nav=document.getElementById('mainNav');
function closeNav(){if(nav){nav.classList.remove('open');}if(burger){burger.setAttribute('aria-expanded','false');}document.body.style.overflow='';}
if(burger&&nav){burger.addEventListener('click',function(){var o=nav.classList.toggle('open');burger.setAttribute('aria-expanded',o?'true':'false');document.body.style.overflow=o?'hidden':'';});
nav.addEventListener('click',function(e){if(e.target.closest('a'))closeNav();});window.addEventListener('keydown',function(e){if(e.key==='Escape')closeNav();});
window.addEventListener('resize',function(){if(window.innerWidth>980)closeNav();});}
var header=document.querySelector('header.site'),deco=document.getElementById('heroDeco'),ticking=false;
function onScroll(){var y=window.scrollY||0;if(header)header.classList.toggle('scrolled',y>16);if(deco&&!reduce&&y<900)deco.style.transform='translate3d(0,'+(y*0.22)+'px,0)';ticking=false;}
window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});onScroll();
var reduceM=reduce;
function flipCard(f){if(f._busy)return;var h0=f.offsetHeight;
function swap(){var on=f.classList.toggle('on');f.setAttribute('aria-pressed',on?'true':'false');var fr=f.querySelector('.front'),bk=f.querySelector('.back');if(fr)fr.setAttribute('aria-hidden',on?'true':'false');if(bk)bk.setAttribute('aria-hidden',on?'false':'true');}
if(reduceM){swap();return;}
f._busy=true;f.style.height=h0+'px';f.classList.add('out');
setTimeout(function(){swap();f.classList.remove('out');f.classList.add('pre');f.style.height='auto';var h1=f.offsetHeight;f.style.height=h0+'px';void f.offsetHeight;
f.classList.remove('pre');f.classList.add('in');f.style.height=h1+'px';
setTimeout(function(){f.classList.remove('in');f.style.height='';f._busy=false;},380);},290);}
document.querySelectorAll('.flip').forEach(function(f){
f.addEventListener('click',function(e){if(e.target.closest('a'))return;var sel=window.getSelection?String(window.getSelection()):'';if(sel&&sel.length>0&&f.classList.contains('on'))return;flipCard(f);});
f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flipCard(f);}});});
function countUp(el){var end=parseFloat(el.getAttribute('data-count')),dec=(el.getAttribute('data-dec')|0),suf=el.getAttribute('data-suffix')||'';
function fmt(v){return v.toLocaleString('fr-FR',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;}
if(reduce||isNaN(end)){return;}var t0=null,dur=1600;function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=fmt(end*e);if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
var NS='';function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function fr(n,d){return Number(n).toLocaleString('fr-FR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
function niceMax(m){var s=[5,10,20,25,50,60,100];for(var i=0;i<s.length;i++)if(m<=s[i])return s[i];return Math.ceil(m/10)*10;}
function lineChart(c){var W=640,H=320,L=48,R=22,T=22,B=36,min=c.min||0,max=c.max||50,n=c.labels.length;
var xs=function(i){return L+(W-L-R)*i/(n-1);},ys=function(v){return T+(H-T-B)*(1-(v-min)/(max-min));};var g='<g class="ch-axis">',i,k;
for(k=0;k<=5;k++){var v=min+(max-min)*k/5,y=ys(v);g+='<line class="ch-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end">'+fr(v)+'</text>';}
for(i=0;i<n;i++)g+='<text x="'+xs(i)+'" y="'+(H-10)+'" text-anchor="middle">'+esc(c.labels[i])+'</text>';g+='</g>';
c.series.forEach(function(s){var d='';s.values.forEach(function(v,j){d+=(j?'L':'M')+xs(j).toFixed(1)+' '+ys(v).toFixed(1)+' ';});g+='<path class="ch-line" d="'+d+'" stroke="'+s.color+'"/>';
s.values.forEach(function(v,j){g+='<circle class="ch-dot" cx="'+xs(j).toFixed(1)+'" cy="'+ys(v).toFixed(1)+'" r="4" fill="#fff" stroke="'+s.color+'" stroke-width="2.2"/>';
if(j===n-1||j===0)g+='<text class="ch-val" x="'+xs(j).toFixed(1)+'" y="'+(ys(v)-11).toFixed(1)+'" text-anchor="'+(j?'end':'start')+'" style="fill:'+s.color+'">'+fr(v)+(c.unit||'')+'</text>';});});
return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(c.aria||'')+'">'+g+'</svg>';}
function barChart(c){var items=c.items,n=items.length,W=640,H=320,L=48,R=18,T=28,B=58,max=c.max||niceMax(Math.max.apply(null,items.map(function(o){return o.value;})));
var step=(W-L-R)/n,bw=Math.min(86,step*0.6),ys=function(v){return T+(H-T-B)*(1-v/max);},g='<g class="ch-axis">',k;
for(k=0;k<=4;k++){var v=max*k/4,y=ys(v);g+='<line class="ch-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end">'+fr(v)+'</text>';}g+='</g>';
items.forEach(function(o,i){var x=L+step*i+(step-bw)/2,y=ys(o.value),h=ys(0)-y;
g+='<rect class="ch-bar" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" fill="'+(o.color||'#B5754A')+'" rx="2" style="animation-delay:'+(0.12*i).toFixed(2)+'s"/>';
g+='<text class="ch-val" x="'+(x+bw/2).toFixed(1)+'" y="'+(y-8).toFixed(1)+'" text-anchor="middle">'+fr(o.value,o.dec||0)+(c.unit||'')+'</text>';
String(o.label).split(' / ').forEach(function(w,j){g+='<text class="ch-lab" x="'+(x+bw/2).toFixed(1)+'" y="'+(H-36+j*14)+'" text-anchor="middle" style="font-family:Inter,sans-serif;font-size:11.5px;fill:#3D3226">'+esc(w)+'</text>';});});
return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(c.aria||'')+'">'+g+'</svg>';}
function barhChart(c){var items=c.items,n=items.length,rowH=54,W=640,L=170,R=64,H=n*rowH+20,max=c.max||100,g='';
items.forEach(function(o,i){var y=10+i*rowH,w=(W-L-R)*o.value/max;
g+='<text class="ch-lab" x="'+(L-12)+'" y="'+(y+24)+'" text-anchor="end" style="font-family:Inter,sans-serif;font-size:13px;fill:#3D3226">'+esc(o.label)+'</text>';
g+='<rect x="'+L+'" y="'+(y+6)+'" width="'+(W-L-R)+'" height="26" fill="#F5EFE6" rx="2"/>';
g+='<rect class="ch-barh" x="'+L+'" y="'+(y+6)+'" width="'+w.toFixed(1)+'" height="26" fill="'+(o.color||'#B5754A')+'" rx="2" style="animation-delay:'+(0.12*i).toFixed(2)+'s"/>';
g+='<text class="ch-val" x="'+(L+w+8).toFixed(1)+'" y="'+(y+25)+'">'+fr(o.value)+(c.unit||'')+'</text>';});
return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(c.aria||'')+'">'+g+'</svg>';}
document.querySelectorAll('[data-chart]').forEach(function(fig){try{var c=JSON.parse(fig.getAttribute('data-chart')),host=fig.querySelector('.chart-svg');if(!host)return;
host.innerHTML=c.type==='line'?lineChart(c):(c.type==='barh'?barhChart(c):barChart(c));
host.querySelectorAll('.ch-line').forEach(function(p){var len=p.getTotalLength?Math.ceil(p.getTotalLength()):1200;p.style.setProperty('--len',len);});}catch(e){}});
var targets=document.querySelectorAll('.reveal, .stagger, .chart, .tl-item, [data-count]');
if('IntersectionObserver' in window&&!reduce){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;var el=en.target;el.classList.add('in');if(el.hasAttribute('data-count'))countUp(el);io.unobserve(el);});},{threshold:0.14,rootMargin:'0px 0px -6% 0px'});targets.forEach(function(el){io.observe(el);});}
else{targets.forEach(function(el){el.classList.add('in');});}
document.querySelectorAll('form[data-netlify]').forEach(function(form){var status=form.querySelector('.status'),btn=form.querySelector('button[type="submit"]'),fname=form.getAttribute('name');
function okMsg(){form.reset();if(status){status.className='status ok';status.textContent='Merci ! Votre message a bien été envoyé à Mecenia. Nous vous répondons très vite.';}}
function failMsg(payload){var lines=[];for(var k in payload){if(k.charAt(0)!=='_')lines.push(k+' : '+payload[k]);}
var href='mailto:contact@mecenia.org?subject='+encodeURIComponent(payload._subject||'Message depuis le site')+'&body='+encodeURIComponent(lines.join('\n'));
if(status){status.className='status err';status.innerHTML='L’envoi automatique a échoué. <a class="link" href="'+href+'">Cliquez ici pour envoyer ce message avec votre messagerie</a> (pré-rempli), ou écrivez à contact@mecenia.org.';}}
form.addEventListener('submit',function(ev){ev.preventDefault();if(!form.checkValidity()){form.reportValidity();return;}
var data=new FormData(form),body=new URLSearchParams(),payload={};
if(data.get('bot-field')){okMsg();return;}
payload._subject=fname==='adhesion'?'[Site Mecenia] Nouvelle demande d’adhésion':'[Site Mecenia] Nouveau message de contact';payload._template='table';payload._captcha='false';payload._url=location.href;
data.forEach(function(v,k){if(k==='bot-field'||k==='form-name')return;payload[k]=v;body.append(k,v);});body.append('form-name',fname);
if(btn){btn.disabled=true;btn.dataset.label=btn.textContent;btn.textContent='Envoi en cours…';}if(status){status.className='status';status.textContent='';}
fetch('https://formsubmit.co/ajax/contact@mecenia.org',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)})
.then(function(r){return r.json();}).then(function(j){if(!(j&&(j.success===true||j.success==='true'))){console.warn('FormSubmit:',j);throw new Error('formsubmit');}})
.catch(function(){return fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()}).then(function(r){if(!r.ok)throw new Error('netlify '+r.status);});})
.then(okMsg).catch(function(){failMsg(payload);})
.finally(function(){if(btn){btn.disabled=false;btn.textContent=btn.dataset.label||'Envoyer';}});});});
var sel=document.getElementById('type-adhesion');if(sel){var p=new URLSearchParams(location.search).get('type');if(p){for(var i=0;i<sel.options.length;i++)if(sel.options[i].value===p)sel.selectedIndex=i;}}
})();

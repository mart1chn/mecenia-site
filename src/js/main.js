/* Mecenia — scripts du site. Sans dépendance ; le site reste lisible sans JavaScript. */
(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* Menu mobile */
  var toggle = $('.menu-toggle'), menu = $('#menu');
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); toggle.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1020) closeMenu(); });
  }

  /* En-tête compact au défilement + barre de lecture */
  var header = $('.site-header'), prog = $('.read-progress span'), ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('is-stuck', y > 24);
    if (prog) {
      var h = d.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Apparition douce des blocs situés sous la ligne de flottaison */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    $$('.sec-head,.card,.stat,.post-card,.person,.steps li,.acc,.tri,.work,.docs li,.org__organs li,.bigquote,.cta').forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.setAttribute('data-rv', ''); io.observe(el); }
    });
    // Filet de sécurité : rien ne reste masqué si l'observateur tarde
    setTimeout(function () { $$('[data-rv]:not(.in)').forEach(function (el) { el.classList.add('in'); }); }, 6000);
  }

  /* Filtres du blog */
  var filters = $('.filters');
  if (filters) {
    filters.hidden = false;
    var cards = $$('.post-card'), count = $('.filters__count'), empty = $('.empty');
    var state = { kind: '', theme: '' };
    function apply() {
      var n = 0;
      cards.forEach(function (c) {
        var okK = !state.kind || c.dataset.kind === state.kind;
        var okT = !state.theme || (c.dataset.themes || '').split('|').indexOf(state.theme) > -1;
        var show = okK && okT;
        c.hidden = !show;
        if (show) n++;
      });
      if (count) count.textContent = n + ' article' + (n > 1 ? 's' : '');
      if (empty) empty.hidden = n > 0;
    }
    $$('.filter', filters).forEach(function (f) {
      var key = f.dataset.filter;
      $$('.chip', f).forEach(function (chip) {
        chip.addEventListener('click', function () {
          var on = chip.getAttribute('aria-pressed') === 'true';
          $$('.chip', f).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          state[key] = on ? '' : chip.dataset.value;
          if (!on) chip.setAttribute('aria-pressed', 'true');
          apply();
        });
      });
    });
    apply();
  }

  /* Visionneuse d'images (articles) */
  var zoomables = $$('.post .fig img, .gallery img, .mag img');
  if (zoomables.length && typeof HTMLDialogElement === 'function') {
    var dlg = d.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Image agrandie');
    dlg.innerHTML = '<div class="lightbox__in"><img alt=""><p></p></div><button type="button" aria-label="Fermer">×</button>';
    d.body.appendChild(dlg);
    var big = $('img', dlg), cap = $('p', dlg);
    zoomables.forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      var open = function () {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        var fc = img.closest('figure') && img.closest('figure').querySelector('figcaption');
        cap.textContent = fc ? fc.textContent : '';
        dlg.showModal();
      };
      img.addEventListener('click', open);
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    dlg.addEventListener('click', function () { dlg.close(); });
  }

  /* Formulaires Netlify : envoi sans rechargement, repli sur l'envoi classique */
  var typeSel = $('#type-adhesion');
  if (typeSel) {
    var wanted = new URLSearchParams(location.search).get('type');
    if (wanted) $$('option', typeSel).forEach(function (o, i) { if (o.value === wanted) typeSel.selectedIndex = i; });
  }
  $$('form[data-netlify]').forEach(function (form) {
    var status = $('.status', form), btn = $('button[type="submit"]', form);
    form.addEventListener('submit', function (ev) {
      if (!window.fetch || !window.URLSearchParams) return; // envoi classique
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form), body = new URLSearchParams();
      data.forEach(function (v, k) { body.append(k, v); });
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
      if (status) { status.className = 'status'; status.textContent = ''; }
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
        .then(function (r) { if (!r.ok) throw new Error(r.status); location.href = form.getAttribute('action') || '/merci/'; })
        .catch(function () {
          if (status) {
            status.className = 'status err';
            status.innerHTML = 'L’envoi a échoué. Vous pouvez réessayer ou nous écrire à <a href="mailto:contact@mecenia.org">contact@mecenia.org</a>.';
          }
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });
})();

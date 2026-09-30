(function () {
  'use strict';
  /* Menus déroulants « + » : un seul élément ouvert à la fois par liste. */
  document.querySelectorAll('.plus-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.plus-item'); if (!item) return;
      var group = item.closest('[data-accordion]'), open = !item.classList.contains('open');
      if (group && open) group.querySelectorAll('.plus-item.open').forEach(function (o) {
        if (o !== item) { o.classList.remove('open'); var b = o.querySelector('.plus-btn'); if (b) b.setAttribute('aria-expanded', 'false'); }
      });
      item.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();

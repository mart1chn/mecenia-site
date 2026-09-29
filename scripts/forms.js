(function () {
  'use strict';
  /* Envoi des formulaires vers Netlify Forms (sans e-mail) : la réponse est ensuite enregistrée dans /admin. */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.matches || !form.matches('form[data-netlify]')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var status = form.querySelector('.status'), btn = form.querySelector('button[type="submit"]');
    var data = new FormData(form), body = new URLSearchParams();
    data.forEach(function (v, k) { body.append(k, v); });
    if (!body.has('form-name')) body.append('form-name', form.getAttribute('name'));
    function ok() { form.reset(); if (status) { status.className = 'status ok'; status.textContent = 'Merci ! Votre message a bien été transmis à l’équipe de Mecenia. Nous vous répondons très vite.'; } }
    function fail() {
      var lines = []; data.forEach(function (v, k) { if (k !== 'bot-field' && k !== 'form-name' && k !== 'consentement') lines.push(k + ' : ' + v); });
      var href = 'mailto:contact@mecenia.org?subject=' + encodeURIComponent('Message depuis le site') + '&body=' + encodeURIComponent(lines.join('\n'));
      if (status) { status.className = 'status err'; status.innerHTML = 'L’envoi a échoué. <a class="link" href="' + href + '">Cliquez ici pour envoyer ce message avec votre messagerie</a> (pré-rempli), ou écrivez à contact@mecenia.org.'; }
    }
    if (data.get('bot-field')) { ok(); return; }
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Envoi en cours…'; }
    if (status) { status.className = 'status'; status.textContent = ''; }
    fetch(location.pathname, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); ok(); })
      .catch(fail)
      .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Envoyer'; } });
  }, true);
})();

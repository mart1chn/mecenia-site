'use strict';
/* Déclenchée automatiquement par Netlify Forms à chaque envoi valide (hors spam).
   Enregistre le message dans content/messages/ du dépôt GitHub (privé) : il apparaît alors dans /admin. */
const OWNER = 'mart1chn', REPO = 'mecenia-site', BRANCH = 'main';
const y = v => JSON.stringify(String(v == null ? '' : v));
const headers = () => ({ Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'mecenia-forms', 'Content-Type': 'application/json' });

exports.handler = async (event) => {
  try {
    if (!process.env.GITHUB_TOKEN) { console.error('Variable GITHUB_TOKEN absente : message non enregistré dans la console.'); return { statusCode: 200, body: 'no token' }; }
    const p = (JSON.parse(event.body) || {}).payload || {};
    const d = p.data || {};
    const form = String(p.form_name || 'formulaire').replace(/[^a-z0-9-]/gi, '');
    const repo = await (await fetch('https://api.github.com/repos/' + OWNER + '/' + REPO, { headers: headers() })).json();
    if (!repo.private) { console.error('Enregistrement refusé : dépôt public ou inaccessible (' + (repo.message || 'public') + ').'); return { statusCode: 200, body: 'repo not private' }; }
    const now = new Date(p.created_at || Date.now());
    const adhesion = form === 'adhesion';
    const name = adhesion ? [d.prenom, d.nom].filter(Boolean).join(' ') : (d.nom || '');
    const kinds = { 'membre-actif': 'Membre actif', partenaire: 'Membre partenaire', suivre: 'Suivre les travaux' };
    const kind = adhesion ? (kinds[d['type-adhesion']] || 'Adhésion') : 'Contact';
    const title = kind + ' — ' + (name || d.email || 'anonyme');
    const text = (adhesion ? d.motivations : d.message) || '';
    const newsletter = d.newsletter === 'oui';
    const md = ['---', 'title: ' + y(title), 'date: ' + y(now.toISOString()), 'form: ' + y(form), 'status: nouveau', 'name: ' + y(name), 'email: ' + y(d.email),
      'phone: ' + y(d.telephone), 'organisation: ' + y(d.organisation), 'role: ' + y(d.fonction), 'type: ' + y(adhesion ? kind : d.sujet), 'newsletter: ' + y(newsletter ? 'oui' : 'non'), 'newsletter_consent_at: ' + y(newsletter ? now.toISOString() : ''), 'newsletter_consent_version: ' + y(newsletter ? '2026-09-30' : ''), '---', text, ''].join('\n');
    const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-') + '-' + Math.random().toString(36).slice(2, 5);
    const res = await fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/content/messages/' + stamp + '-' + form + '.md', {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ message: 'Nouveau message reçu (' + form + ')', branch: BRANCH, content: Buffer.from(md, 'utf8').toString('base64') })
    });
    if (!res.ok) { console.error('GitHub ' + res.status + ' : ' + (await res.text())); return { statusCode: 500, body: 'github error' }; }
    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'error' };
  }
};

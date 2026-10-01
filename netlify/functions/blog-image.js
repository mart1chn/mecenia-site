'use strict';
/* Sert les images du blog directement depuis GitHub (dépôt privé), sans nouveau déploiement. */
const OWNER = 'mart1chn', REPO = 'mecenia-site', BRANCH = process.env.CONTENT_BRANCH || 'main';
const TYPES = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif' };
const fail = (code, msg) => ({ statusCode: code, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, body: msg });
exports.handler = async (event) => {
  let name = (event.queryStringParameters && event.queryStringParameters.path) || '';
  try { name = decodeURIComponent(name); } catch (e) {}
  name = name.replace(/^\/+/, '');
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!/^[\w][\w.\-]*$/.test(name) || !TYPES[ext]) return fail(400, 'Image invalide');
  try {
    const r = await fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/assets/img/blog/' + encodeURIComponent(name) + '?ref=' + encodeURIComponent(BRANCH), { headers: { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'mecenia-blog' } });
    if (r.status === 404) return fail(404, 'Image introuvable');
    if (!r.ok) return fail(502, 'GitHub ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 4500000) return fail(413, 'Image trop lourde');
    return { statusCode: 200, headers: { 'Content-Type': TYPES[ext], 'Cache-Control': 'public, max-age=3600', 'Netlify-CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }, body: buf.toString('base64'), isBase64Encoded: true };
  } catch (e) { console.error('Image du blog :', e.message); return fail(502, 'Erreur'); }
};

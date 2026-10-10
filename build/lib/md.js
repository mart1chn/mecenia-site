'use strict';
const MarkdownIt = require('markdown-it');
const { esc, isExternal, slugify } = require('./util');

/* Markdown sans HTML brut : les rédacteurs ne peuvent pas casser les pages. */
const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: false });

const defaultLinkOpen = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const t = tokens[idx];
  const href = t.attrGet('href') || '';
  if (isExternal(href) && !/^https?:\/\/(www\.)?mecenia\.org/i.test(href)) {
    t.attrSet('target', '_blank');
    t.attrSet('rel', 'noopener');
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

const defaultImage = md.renderer.rules.image || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const t = tokens[idx];
  t.attrSet('loading', 'lazy');
  t.attrSet('decoding', 'async');
  return defaultImage(tokens, idx, options, env, self);
};


/* Titres : identifiant automatique, ou explicite avec « ## Titre {#ancre} ». */
md.core.ruler.push('heading_ids', (state) => {
  const seen = new Set();
  const toks = state.tokens;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].type !== 'heading_open') continue;
    const inl = toks[i + 1];
    let id = '';
    const m = inl.content.match(/\s*\{#([\w-]+)\}\s*$/);
    if (m) {
      id = m[1];
      inl.content = inl.content.replace(m[0], '');
      const last = inl.children[inl.children.length - 1];
      if (last && last.type === 'text') last.content = last.content.replace(/\s*\{#[\w-]+\}\s*$/, '');
    } else {
      id = slugify(inl.content);
    }
    if (!id) continue;
    let u = id, n = 2;
    while (seen.has(u)) u = id + '-' + n++;
    seen.add(u);
    toks[i].attrSet('id', u);
  }
});

/* Typographie française : espaces insécables avant « : ; ! ? % » et après « (hors balises). */
const NB = '\u00A0', NNB = '\u202F';
const typo = (html) => html.split(/(<[^>]+>)/).map((part) => (part.startsWith('<') ? part
  : part.replace(/ ([:»])/g, NB + '$1').replace(/ ([;!?%])/g, NNB + '$1').replace(/« /g, '«' + NB).replace(/(\d) (?=\d{3}\b)/g, '$1' + NNB))).join('');
const block = (src) => (src ? typo(md.render(String(src))) : '');
const inline = (src) => (src ? typo(md.renderInline(String(src))) : '');

/**
 * Transforme « image seule dans un paragraphe + paragraphe en italique » en <figure><figcaption>.
 * Les images sont zoomables (classe lb) ; la légende reste lisible par les lecteurs d'écran.
 */
function figures(html) {
  return html.replace(
    /<p>(<img [^>]+>)<\/p>\s*(?:<p><em>([\s\S]*?)<\/em><\/p>)?/g,
    (m, img, cap) => `<figure class="fig">${img}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>\n`
  );
}

/** Nombre de mots → minutes de lecture (220 mots/min). */
const readingMinutes = (text) => Math.max(1, Math.round(String(text).split(/\s+/).filter(Boolean).length / 220));

module.exports = { md, block, inline, figures, readingMinutes, esc };

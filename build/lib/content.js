'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { ROOT, read, exists, parseDate } = require('./util');

const C = path.join(ROOT, 'content');

const loadYaml = (file) => yaml.load(read(file)) || {};

/** Fichier Markdown avec en-tête YAML (--- … ---). */
function loadFrontmatter(file) {
  const raw = read(file).replace(/^﻿/, '');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  return { data: yaml.load(m[1]) || {}, body: m[2] };
}

function loadSite() {
  return Object.assign(loadYaml(path.join(C, 'site.yml')), {});
}

function loadData() {
  const d = {};
  const dir = path.join(C, 'data');
  for (const f of fs.readdirSync(dir)) if (/\.ya?ml$/.test(f)) d[f.replace(/\.ya?ml$/, '')] = loadYaml(path.join(dir, f));
  return d;
}

function loadPages() {
  const dir = path.join(C, 'pages');
  const pages = [];
  for (const f of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, f);
    if (/\.ya?ml$/.test(f)) {
      const p = loadYaml(file);
      p.slug = f.replace(/\.ya?ml$/, '');
      pages.push(p);
    } else if (/\.md$/.test(f)) {
      const { data, body } = loadFrontmatter(file);
      data.slug = f.replace(/\.md$/, '');
      data.blocs = [
        { type: 'hero', variante: 'page', titre: data.titre, sous_titre: data.sous_titre },
        { type: 'texte_long', fond: 'blanc', texte: body }
      ];
      pages.push(data);
    }
  }
  return pages;
}

function loadPosts() {
  const dir = path.join(C, 'blog');
  const posts = [];
  if (!exists(dir)) return posts;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.md$/i.test(f)) continue;
    const { data, body } = loadFrontmatter(path.join(dir, f));
    if (!data.title || data.draft === true || data.draft === 'true') continue;
    const date = parseDate(data.date) || fs.statSync(path.join(dir, f)).mtime;
    posts.push({
      file: f,
      slug: f.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''),
      title: data.title,
      description: data.description || '',
      image: data.image || '',
      themes: [].concat(data.themes || []),
      kind: data.kind || '',
      blocks: Array.isArray(data.blocks) ? data.blocks : [],
      date,
      body
    });
  }
  return posts.sort((a, b) => b.date - a.date);
}

function loadExpositions() {
  const dir = path.join(C, 'expositions');
  const items = [];
  if (!exists(dir)) return items;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    const e = loadYaml(path.join(dir, f));
    if (e.draft === true || !e.title) continue;
    items.push(e);
  }
  return items.sort((a, b) => String(b.period).localeCompare(String(a.period)));
}

module.exports = { loadSite, loadData, loadPages, loadPosts, loadExpositions };

# Mecenia — site web

Site de l'association Mecenia (www.mecenia.org), hébergé sur Netlify.

- Pages : fichiers HTML à la racine (dossiers `adherer/`, `equipe/`, etc.).
- Blog : articles Markdown dans `content/blog/`, gérés depuis `/admin/` (Decap CMS). Le script `scripts/build-blog.js` génère les pages du blog à chaque déploiement (dossier `dist/`).
- Publication : automatique à chaque commit sur `main`.

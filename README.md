# Mecenia — site web (refonte)

Site de l'association Mecenia (www.mecenia.org), hébergé sur Netlify. Cette branche remplace l'empilement de scripts de post-traitement par **un seul générateur** : le contenu (YAML / Markdown) et les gabarits produisent le site entier dans `dist/`.

## Architecture

| Dossier | Rôle |
|---|---|
| `content/pages/` | Une page = un fichier YAML : une suite de **blocs** (en-tête, texte, cartes, questions, citation, formulaire…) |
| `content/blog/` | Articles en Markdown (catégories, légendes, infographies, visionneuse d'images) |
| `content/data/` | Listes partagées : chiffres clés, équipe, événements, ressources, partenaires |
| `content/site.yml` | Menu, pied de page, coordonnées, réseaux |
| `content/expositions/` | Exposition numérique |
| `build/` | Générateur Node (sans framework) : `build.js`, gabarits de blocs, SEO, sitemap, `llms.txt`, redirections |
| `src/css`, `src/js`, `src/fonts` | Design system, scripts, polices hébergées en local (aucun appel à un tiers) |
| `static/` | Fichiers copiés tels quels : images, `_headers`, favicon, **`/admin`** (CMS) |
| `netlify/functions/` | Notification des formulaires |

## Commandes

```bash
npm install
npm run build        # génère dist/
```

Les images Wikimedia citées dans les contenus sont rapatriées en local au moment du build (mode dégradé : le lien d'origine est conservé si le téléchargement échoue).

## Modifier le contenu sans code

Tout se fait depuis `/admin` : articles, expositions, **pages**, réglages (menu, pied de page), chiffres clés, équipe, événements, ressources, partenaires, mentions légales.

## Design system « Parchemin & arcade »

- Papier beige (`--paper`, `--linen`), encre brune, bronze et caramel hérités de l'identité actuelle.
- Titres en Lora allégée, étiquettes en Inter capitales espacées, polices locales.
- Signatures : arcade du logo (motif répété et fenêtres en arche), filets d'imprimerie, chapitres en chiffres romains, colonnes à filet à la place des cartes encadrées.
- Fonds sombres réservés aux citations, valeurs, appels à l'action et au pied de page.
- Accessibilité : contrastes AA, focus visibles, navigation clavier, `prefers-reduced-motion`, accordéons natifs.

## Redirections

Les anciennes adresses (`/notre-histoire`, `/notre-mission`, `/nos-valeurs`, `/nos-projets`, `/equipe`) redirigent en 301 vers les ancres de `/a-propos/` (voir `build/build.js`).

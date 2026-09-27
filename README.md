# Building Service – site vitrine

Site de **Building Service**, entreprise de construction, rénovation et aménagement intérieur au Cameroun (Yaoundé & Douala).

- Site vitrine multi-pages : 13 services, réalisations documentées, vidéos, prise de rendez-vous, contact.
- **Bilingue français / anglais**, extensible à d’autres langues.
- **Espace d’administration en ligne** (`/admin`), protégé par mot de passe : textes, images, vidéos, traductions et messages se gèrent sans toucher au code, et le site est à jour immédiatement.
- **Confidentialité des clients** : noms réels, notes et brouillons ne sont jamais envoyés aux visiteurs.
- **Production Docker** : une image autonome (Node 22, aucune dépendance au démarrage), testée et publiée automatiquement.

Stack : React 19, TypeScript, Vite 7, React Router 7, lucide-react. Serveur : Node 22 sans dépendance. Aucune base de données : les données sont des fichiers JSON dans un volume.

---

## Sommaire

1. [Démarrer en local](#démarrer-en-local)
2. [Commandes](#commandes)
3. [Pages du site](#pages-du-site)
4. [Administration du contenu](#administration-du-contenu)
5. [Confidentialité des clients](#confidentialité-des-clients)
6. [Langues](#langues)
7. [Vidéos et réseaux sociaux](#vidéos-et-réseaux-sociaux)
8. [Personnaliser l’apparence](#personnaliser-lapparence)
9. [Mise en production (Docker)](#mise-en-production-docker)
10. [Intégration et livraison continues](#intégration-et-livraison-continues)
11. [Structure du projet](#structure-du-projet)
12. [Dépannage](#dépannage)
13. [Limites connues](#limites-connues)

---

## Démarrer en local

Prérequis : **Node.js 22** (voir `.nvmrc`) et npm.

```bash
npm install
npm run dev
```

- Site : <http://localhost:5173> — administration : <http://localhost:5173/admin> (ou triple clic sur le logo).
- À la première ouverture de `/admin` en local, vous créez le mot de passe.
- En local, les données sont rangées dans le projet : `src/content/content.json` (contenu public, sert aussi de contenu initial en production), `public/uploads/` (médias), `content-private/` (clients, brouillons, mot de passe, messages — hors Git).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Site en local avec rechargement automatique, API et administration |
| `npm run check` | Mêmes contrôles que la CI : lint + tests + TypeScript + build |
| `npm test` | Tests automatiques (`tests/`) : confidentialité des clients, référencement, formulaires, admin, versions, statistiques |
| `npm run apercu` | Contrôles, puis lancement de la **vraie version de production** (serveur Node) sur <http://localhost:8080> |
| `npm run build` | Construit le site dans `dist/` |
| `npm start` | Lance le serveur de production (après `npm run build`) |
| `npm run lint` | Analyse ESLint seule (site et serveur) |

## Pages du site

| Adresse | Contenu |
|---|---|
| `/` | Accueil : diaporama plein écran, carrousel de réalisations, services mis en avant, tous les métiers, chiffres, méthode, vidéos, FAQ |
| `/a-propos` | Présentation, valeurs, chiffres |
| `/services` et `/services/:slug` | Les 13 services par catégorie, et la fiche de chacun |
| `/realisations` et `/realisations/:slug` | Réalisations filtrables par service, fiche projet avec galerie, client, journal de chantier, vidéos, partage |
| `/videos` | Toutes les vidéos du site, filtrables par réseau |
| `/maintenance` | Formules de maintenance et partenaires |
| `/contact` | Formulaire (enregistré dans l’admin + WhatsApp), coordonnées, carte |
| `/rdv` | Prise de rendez-vous : appel ou visite, date et créneau |
| `/admin` | Administration |
| `/sitemap.xml`, `/robots.txt` | Générés automatiquement pour les moteurs de recherche |

Sur l’accueil, le menu indique la section affichée pendant le défilement, et une barre de progression apparaît sous l’en-tête.

## Administration du contenu

### Connexion et mot de passe

- **En production**, le premier mot de passe est fourni au serveur par la variable `ADMIN_PASSWORD` (8 caractères minimum). Il n’est **pas possible** de le créer depuis Internet.
- Il se change ensuite dans l’onglet *Sécurité* ; la variable est alors ignorée.
- Sécurité : mot de passe haché (scrypt), session de 8 h, blocage de 15 min après 5 échecs de connexion.
- **Mot de passe oublié** : supprimer `private/admin.json` dans le volume de données, puis redémarrer avec `ADMIN_PASSWORD`.

### Onglets

| Onglet | Ce qu’on y gère |
|---|---|
| Général | Coordonnées, WhatsApp, réseaux sociaux, étiquette, texte et photos du diaporama d’accueil, chiffres clés |
| Services | Ajouter, modifier, réordonner, supprimer ; catégorie, icône, mise en avant, image, prestations, étapes, vidéos |
| Réalisations | Chantiers publiés ou brouillons : client et confidentialité, galerie, journal de chantier, vidéos |
| Vidéos | Vidéos mises en avant + récapitulatif de toutes les vidéos |
| FAQ | Questions / réponses |
| Traductions | Version anglaise de tous les textes modifiables, avec avancement |
| Messages | Demandes reçues par les formulaires Contact et Rendez-vous (statut, réponse WhatsApp, export) |
| Sécurité | Mot de passe, déconnexion |
| Guide | Mode d’emploi et règles de confidentialité |

**Enregistrer** met le site à jour immédiatement (le contenu est lu par chaque visiteur au chargement). La version précédente est sauvegardée à chaque enregistrement (30 dernières). **Exporter** télécharge tout le contenu en JSON.

### Où sont les données

| En production (volume `/data`) | En local | Contenu | Envoyé aux visiteurs ? |
|---|---|---|---|
| `content.json` | `src/content/content.json` | Contenu public | Oui |
| `uploads/` | `public/uploads/` | Images et vidéos envoyées depuis l’admin | Oui |
| `private/private.json` | `content-private/private.json` | Noms réels des clients, notes internes, brouillons | **Non** |
| `private/messages.json` | `content-private/messages.json` | Messages des formulaires | **Non** |
| `private/admin.json` | `content-private/admin.json` | Mot de passe haché | **Non** |
| `private/sauvegardes/` | `content-private/sauvegardes/` | Versions précédentes du contenu | **Non** |

> **Sauvegardez le volume `/data`** (ou au minimum utilisez régulièrement *Exporter*) : c’est la seule copie des données vivantes.

## Confidentialité des clients

- Un nouveau chantier est un **brouillon** : il n’est jamais publié tant que *Publier sur le site* n’est pas coché.
- Le **nom réel** et les **notes** restent dans la zone privée. Sur le site, le client apparaît au choix : *anonyme* (« Particulier »), *initiales* (« Client J. P. M. ») ou *nom complet* (uniquement avec l’accord écrit du client).
- Indiquer la ville ou le quartier, **jamais l’adresse** ; pas de visages sans accord, ni plaques, numéros de rue ou documents sur les photos et vidéos.
- La séparation public / privé est faite par le serveur ([shared/privacy.js](shared/privacy.js)) à chaque enregistrement.
- Les messages des formulaires contiennent des données personnelles : ils ne sont accessibles qu’après connexion à l’admin.

## Langues

Le site est en **français** (langue de référence) et en **anglais**.

- **Sélecteur FR / EN** dans l’en-tête (dans le menu sur mobile). Choix mémorisé ; à la première visite, langue du navigateur.
- **Lien dans une langue** : ajouter `?lang=en`. Les boutons de partage conservent la langue.
- **Textes fixes** (menus, boutons, formulaires) : [src/i18n/ui.ts](src/i18n/ui.ts).
- **Textes modifiables** : onglet *Traductions* de l’admin. Une traduction manquante affiche le texte français.
- **Ajouter une langue** : l’ajouter à `translatedLanguages` dans [src/content/types.ts](src/content/types.ts), créer sa section dans [src/i18n/ui.ts](src/i18n/ui.ts) (TypeScript signale toute clé manquante) et son nom dans `languageNames`, puis traduire dans l’admin.

## Vidéos et réseaux sociaux

- **Liens** YouTube, TikTok, Instagram, Facebook (réseau détecté automatiquement) ou **fichiers** MP4 / WebM / MOV envoyés depuis l’admin.
- YouTube et fichiers se lisent sur le site (avance rapide possible) ; les autres ouvrent le réseau social.
- Vidéos mises en avant (accueil + `/videos`) et vidéos propres à chaque service ou réalisation.
- Les icônes de réseaux sociaux n’apparaissent que si le lien est renseigné dans *Général*.

> Pour les vidéos lourdes, préférez un lien YouTube : un fichier envoyé est servi par votre serveur.

## Personnaliser l’apparence

En haut de [src/index.css](src/index.css) :

```css
--color-dark: #1f1a17;      /* blocs sombres : en-tête, réalisations, footer */
--color-accent: #dc2626;    /* rouge Building Service : boutons, liens actifs */
--color-soft: #fbf1ec;      /* fond crème des cartes */
--font-heading: 'Poppins', …;
--font-body: 'Inter', …;
--watermark-size: min(90vmin, 760px);   /* logo en filigrane */
--watermark-opacity: 0.06;
```

Le logo s’affiche en filigrane fixe dans les sections sans image de fond, et remplace toute image manquante.

## Mise en production (Docker)

> **Sur un VPS, sans nom de domaine** : suivez [deploy/README.md](deploy/README.md) — installation en une commande, HTTPS automatique avec une adresse `…sslip.io`, mise à jour à chaque push, alertes Telegram / e-mail / WhatsApp / SMS, sauvegardes quotidiennes.

### Avec Docker Compose (serveur ou VPS)

```bash
cp .env.example .env          # renseigner ADMIN_PASSWORD et SITE_URL
docker compose up -d          # image publiée par la CI (ou construite localement)
```

Le site écoute sur le port **8080**. Placez devant un proxy HTTPS (Caddy, nginx, Traefik) ou utilisez celui de votre hébergeur.

**Mettre à jour** : `docker compose pull && docker compose up -d` — le volume de données est conservé.

### Sans Compose

```bash
docker build -t building-service .
docker run -d --name building-service -p 8080:8080 \
  -e ADMIN_PASSWORD='un-mot-de-passe-solide' -e SITE_URL=https://www.exemple.cm -e TRUST_PROXY=1 \
  -v building-service-data:/data --restart unless-stopped building-service
```

### Hébergeurs (Render, Railway, Coolify, CapRover…)

Déployer l’image `ghcr.io/reborn-spaceline/buildingservices:latest` (ou le `Dockerfile`), port **8080**, avec un **disque persistant monté sur `/data`** — sans lui, contenus, médias et messages seraient perdus à chaque redéploiement.

### Variables d’environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `ADMIN_PASSWORD` | Mot de passe admin créé au **premier** démarrage | — (obligatoire au premier lancement) |
| `SITE_URL` | Adresse publique, pour le sitemap | — |
| `TRUST_PROXY` | `1` derrière un proxy / hébergeur (IP réelle pour les limites anti-abus) | désactivé |
| `MAX_UPLOAD_MB` | Taille maximale d’un fichier envoyé | `300` |
| `PORT` | Port d’écoute | `8080` |
| `DATA_DIR` | Dossier des données | `/data` dans l’image |

### Ce que fait le serveur

Site et routes React, API, médias ; compression gzip ; cache long pour les fichiers versionnés ; lecture partielle des vidéos ; en-têtes de sécurité ; `sitemap.xml` et `robots.txt` générés depuis le contenu ; point de santé `/healthz` (utilisé par Docker) ; arrêt propre. Au premier démarrage, le contenu initial est copié depuis `src/content/content.json`.

## Intégration et livraison continues

Pipeline : [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml).

| Événement | Étapes |
|---|---|
| Pull Request | **Vérification** (lint, TypeScript, build) → **image Docker** construite et **testée** (démarrage, pages, API, admin fermée) → publiée en aperçu sous le tag `pr-<numéro>` |
| Fusion dans `main` | Vérification → image testée → publiée (`latest` + identifiant du commit) → **déploiement** si `DEPLOY_HOOK_URL` est configuré |

Rien n’est publié si une étape échoue.

**Voir une PR avant de la valider** : le résumé de l’exécution CI donne la commande, par exemple :

```bash
docker run --rm -p 8080:8080 -e ADMIN_PASSWORD=test1234 ghcr.io/reborn-spaceline/buildingservices:pr-12
```

ou, depuis la branche : `npm run apercu`.

**Configuration GitHub**
- Images publiées dans *Packages* du dépôt (GitHub Container Registry, jeton automatique).
- Déploiement automatique : secret `DEPLOY_HOOK_URL` (URL de redéploiement fournie par Render, Coolify, Portainer…). Sans lui, redéployer à la main : `docker compose pull && docker compose up -d`.
- Recommandé : protéger `main` (*Settings → Branches*) en exigeant les vérifications « Vérification » et « Image Docker ».

## Structure du projet

```
Dockerfile, docker-compose.yml, .env.example   Production
server/
  index.js               Serveur de production (fichiers, API, sitemap, santé)
  api.js                 API : contenu, formulaires, administration (commune dev / prod)
shared/privacy.js        Anonymisation des clients (commune site / serveur)
admin-server.js          Branche l'API sur `npm run dev`
public/images/           Photos d'origine
src/
  admin/                 Espace d'administration (chargé seulement sur /admin)
  components/            En-tête, footer, hero, cartes, médias, composants d'interface
  content/               Modèle de contenu, contenu initial, localisation
  data/site.ts           Contenu du site dans la langue affichée + navigation
  i18n/                  Langues : dictionnaire, sélecteur, contexte
  pages/                 Pages du site
  styles/                Feuilles de style
.github/workflows/       CI / CD
```

## Dépannage

| Problème | Solution |
|---|---|
| `/admin` : « Mot de passe à définir » | Démarrer le serveur avec `ADMIN_PASSWORD` (8 caractères min.) |
| Mot de passe oublié | Supprimer `private/admin.json` dans le volume, redémarrer avec `ADMIN_PASSWORD` |
| « Trop de tentatives » | Attendre 15 minutes (protection contre les attaques par force brute) |
| Contenu perdu après un redéploiement | Le volume `/data` n’était pas persistant : en monter un, puis réimporter un export |
| Revenir à une version précédente | Copier un fichier de `private/sauvegardes/` à la place de `content.json` (volume), puis recharger |
| « Session expirée » en enregistrant | Se reconnecter : les modifications en cours sont conservées |
| La CI échoue | Lancer `npm run check` en local pour voir la même erreur |

## Limites connues

- **Polices** : chargées depuis Google Fonts ; sans connexion, polices du système.
- **Photos** : plusieurs photos d’origine dépassent 1,5 Mo ; les compresser accélère le site sur mobile.
- **Maintenance** : les tarifs de la page Maintenance sont en euros et se modifient dans [src/i18n/ui.ts](src/i18n/ui.ts), pas dans l’admin.
- **Un seul serveur** : les données étant des fichiers, ne lancez pas plusieurs copies du conteneur sur le même volume.
- **Référencement** : le site est une application React ; les moteurs modernes l’indexent, le sitemap les y aide.

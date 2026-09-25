# Building Service – site vitrine

Site de **Building Service**, entreprise de construction, rénovation et aménagement intérieur au Cameroun (Yaoundé & Douala).

- Site vitrine multi-pages : 13 services, réalisations documentées, vidéos, prise de rendez-vous, contact.
- **Espace d’administration local** (`/admin`) protégé par mot de passe : textes, images et vidéos se modifient sans toucher au code.
- **Confidentialité des clients** : noms réels, notes et brouillons ne sont jamais publiés.
- **Intégration et déploiement continus** : chaque modification est vérifiée et prévisualisée en ligne avant la mise en production.

Stack : React 19, TypeScript, Vite 7, React Router 7, lucide-react. Hébergement : Firebase Hosting. Aucune base de données.

---

## Sommaire

1. [Démarrer](#démarrer)
2. [Commandes](#commandes)
3. [Pages du site](#pages-du-site)
4. [Administration du contenu](#administration-du-contenu)
5. [Confidentialité des clients](#confidentialité-des-clients)
6. [Vidéos et réseaux sociaux](#vidéos-et-réseaux-sociaux)
7. [Personnaliser l’apparence](#personnaliser-lapparence)
8. [Intégration et déploiement continus](#intégration-et-déploiement-continus)
9. [Structure du projet](#structure-du-projet)
10. [Dépannage](#dépannage)
11. [Limites connues](#limites-connues)

---

## Démarrer

Prérequis : **Node.js 22** (voir `.nvmrc` ; Vite 7 demande au minimum Node 20.19) et npm.

```bash
npm install
npm run dev
```

- Site : <http://localhost:5173>
- Administration : <http://localhost:5173/admin> (double-clic sur le logo du site pour y accéder aussi)

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Site en local avec rechargement automatique **et** API d’administration |
| `npm run check` | Mêmes contrôles que la CI : lint + TypeScript + build |
| `npm run apercu` | Contrôles puis ouverture de la **version de production** dans le navigateur |
| `npm run build` | Construit le site de production dans `dist/` |
| `npm run preview` | Sert le dossier `dist/` déjà construit |
| `npm run lint` | Analyse ESLint seule |

## Pages du site

| Adresse | Contenu |
|---|---|
| `/` | Accueil : diaporama plein écran, carrousel de réalisations, services mis en avant, tous les métiers, chiffres, méthode, vidéos, FAQ |
| `/a-propos` | Présentation, valeurs, chiffres |
| `/services` | Les 13 services, par catégorie |
| `/services/:slug` | Fiche d’un service : prestations, déroulement, vidéos, projets liés, devis |
| `/realisations` | Toutes les réalisations publiées, filtrables par service |
| `/realisations/:slug` | Fiche projet : galerie plein écran, client, durée, surface, journal de chantier, vidéos, partage |
| `/videos` | Toutes les vidéos du site, filtrables par réseau |
| `/maintenance` | Formules de maintenance et partenaires |
| `/contact` | Formulaire (envoi WhatsApp), coordonnées, carte |
| `/rdv` | Prise de rendez-vous : appel découverte ou visite sur site, date et créneau |
| `/admin` | Administration (voir ci-dessous) |

Sur l’accueil, le menu indique la section affichée pendant le défilement, et une barre de progression apparaît sous l’en-tête.

## Administration du contenu

L’administration fonctionne **en local**, sur l’ordinateur qui contient le projet : pas de base de données, pas de compte externe. Elle n’existe qu’avec `npm run dev` ; sur le site en ligne, `/admin` affiche seulement un message d’information.

### Première connexion et mot de passe

1. Lancer `npm run dev`, ouvrir <http://localhost:5173/admin>.
2. À la première ouverture, **créer le mot de passe** (8 caractères minimum).
3. Il est ensuite demandé à chaque ouverture. La session se ferme après 8 h d’inactivité ou à la fermeture de l’onglet.

- **Changer le mot de passe** : onglet *Sécurité* (le mot de passe actuel est demandé ; les autres sessions sont déconnectées).
- **Se déconnecter** : bouton *Déconnexion* dans l’en-tête de l’admin.
- **Mot de passe oublié** : supprimer `content-private/admin.json`, puis rouvrir `/admin` pour en créer un nouveau.

Le mot de passe n’est jamais stocké en clair (hachage scrypt). L’API refuse toute requête qui ne vient pas de l’ordinateur lui-même.

### Onglets

| Onglet | Ce qu’on y gère |
|---|---|
| Général | Coordonnées, WhatsApp, réseaux sociaux, texte et photos du diaporama d’accueil, chiffres clés |
| Services | Ajouter, modifier, réordonner, supprimer ; catégorie, icône, mise en avant sur l’accueil, image, prestations, étapes, vidéos |
| Réalisations | Documenter les chantiers (publiés ou brouillons) : client et confidentialité, galerie, journal de chantier, vidéos |
| Vidéos | Vidéos mises en avant + récapitulatif de toutes les vidéos liées |
| FAQ | Questions / réponses |
| Messages | Copies des demandes envoyées depuis ce navigateur |
| Sécurité | Mot de passe, déconnexion |
| Guide | Mode d’emploi et règles de confidentialité |

**Enregistrer** écrit directement dans les fichiers du projet ; le site local se met à jour immédiatement. Une sauvegarde de la version précédente est gardée à chaque enregistrement (30 dernières). **Exporter** télécharge tout le contenu en JSON.

### Où sont les données

| Fichier / dossier | Contenu | Publié ? | Dans Git ? |
|---|---|---|---|
| `src/content/content.json` | Contenu public du site | Oui | Oui |
| `public/uploads/` | Images et vidéos envoyées depuis l’admin | Oui | Oui |
| `public/images/` | Photos d’origine du site | Oui | Oui |
| `content-private/private.json` | Noms réels des clients, notes internes, chantiers en brouillon | **Non** | **Non** |
| `content-private/admin.json` | Mot de passe haché | **Non** | **Non** |
| `content-private/sauvegardes/` | Versions précédentes du contenu | **Non** | **Non** |

> **Important** : `content-private/` n’est ni publié ni envoyé sur GitHub. Sauvegardez-le régulièrement sur un support sûr.

### Mettre en ligne une modification

Après avoir enregistré dans l’admin, les fichiers modifiés (`src/content/content.json`, `public/uploads/…`) sont à commiter puis à envoyer via une Pull Request (voir [Intégration et déploiement continus](#intégration-et-déploiement-continus)).

## Confidentialité des clients

- Un nouveau chantier est un **brouillon** : il n’est jamais publié tant que *Publier sur le site* n’est pas coché. On peut donc tout documenter et ne publier que ce qui est validé.
- Le **nom réel** et les **notes** restent dans `content-private/`. Sur le site, le client apparaît au choix :
  - *anonyme* : libellé générique (« Particulier », « Entreprise »…) ;
  - *initiales* : « Client J. P. M. » ;
  - *nom complet* : uniquement avec l’accord écrit du client.
- Indiquer la ville ou le quartier, **jamais l’adresse**.
- Photos et vidéos : pas de visages sans accord, ni plaques d’immatriculation, numéros de rue, documents ou objets de valeur identifiables ; couper le son si des conversations privées sont audibles.

Cette séparation est vérifiée : un nom de client, une note privée ou un brouillon n’apparaissent jamais dans `src/content/content.json`.

## Vidéos et réseaux sociaux

- **Liens** YouTube, TikTok, Instagram, Facebook : le réseau est détecté automatiquement quand on colle le lien.
- **Fichiers** (MP4, WebM, MOV) envoyés depuis l’admin, copiés dans `public/uploads/`.
- YouTube et fichiers se lisent directement sur le site ; les autres ouvrent le réseau social.
- Où elles apparaissent : vidéos mises en avant (accueil + `/videos`), vidéos d’un service ou d’une réalisation (sa page + `/videos`).
- Les icônes de réseaux sociaux (en-tête, footer, page Vidéos) n’apparaissent que si le lien est renseigné dans *Général*.
- Chaque fiche service / projet propose des boutons de partage (WhatsApp, Facebook, LinkedIn, copie du lien).

> Pour les vidéos lourdes, préférez un lien YouTube : un fichier envoyé est publié avec le site et l’alourdit.

## Personnaliser l’apparence

Tout se règle dans [src/index.css](src/index.css), en haut du fichier :

```css
--color-dark: #1f1a17;      /* blocs sombres : en-tête, réalisations, footer */
--color-accent: #dc2626;    /* rouge Building Service : boutons, liens actifs */
--color-soft: #fbf1ec;      /* fond crème des cartes */

--font-heading: 'Poppins', …;
--font-body: 'Inter', …;

--watermark-size: min(90vmin, 760px);   /* taille du logo en filigrane */
--watermark-opacity: 0.06;              /* 0.03 discret → 0.10 bien visible */
```

- **Logo en filigrane** : fixe au centre de l’écran, visible à travers les sections sans image de fond.
- **Image manquante** : si un service, un projet ou une photo n’a pas d’image (ou si elle ne se charge pas), le logo s’affiche à la place.
- Polices : Poppins (titres), Inter (texte), Dancing Script (« Building » du titre d’accueil).

## Intégration et déploiement continus

Pipeline : [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml).

| Événement | Étapes |
|---|---|
| Pull Request vers `main` | **Vérification** (lint, TypeScript, build) → **Aperçu** : site publié sur une adresse temporaire (7 jours), lien posté en commentaire de la PR |
| Fusion dans `main` | **Vérification** → **Mise en production** sur Firebase Hosting |

Rien n’est publié si la vérification échoue.

### Marche à suivre

1. Travailler sur une branche, jamais directement sur `main`.
2. Vérifier en local : `npm run check`, puis `npm run apercu`.
3. Pousser la branche et ouvrir une **Pull Request** vers `main`.
4. Attendre la vérification verte, ouvrir le **lien d’aperçu**, contrôler sur ordinateur et mobile, cocher la liste de la PR.
5. **Fusionner** : la mise en production est automatique.

### Configuration GitHub

- Secret requis : `FIREBASE_SERVICE_ACCOUNT_BUILDING_SERVICES_2024` (créé par `firebase init hosting:github`).
- Recommandé : dans *Settings → Branches*, protéger `main` en exigeant la vérification « Vérification (lint, TypeScript, build) » avant fusion.

Firebase publie le dossier `dist/` (voir [firebase.json](firebase.json)) ; toutes les adresses renvoient vers `index.html` pour que la navigation fonctionne.

## Structure du projet

```
admin-server.js          API locale de l’admin (plugin Vite, npm run dev uniquement)
content-private/         Données privées : clients, brouillons, mot de passe, sauvegardes (hors Git)
public/
  images/                Photos d’origine
  uploads/               Médias envoyés depuis l’admin
src/
  admin/                 Espace d’administration (chargé seulement sur /admin)
  components/            En-tête, footer, cartes, médias, composants d’interface
  content/
    content.json         Contenu public (modifié par l’admin)
    types.ts             Modèle de contenu
    privacy.ts           Anonymisation des clients avant publication
  data/site.ts           Accès au contenu + textes fixes (atouts, méthode, valeurs, navigation)
  pages/                 Pages du site
  styles/                Feuilles de style par zone
  index.css              Couleurs, polices, filigrane, styles communs
.github/workflows/       Pipeline CI/CD
```

## Dépannage

| Problème | Solution |
|---|---|
| `/admin` affiche « fonctionne en local » | Lancer `npm run dev` et ouvrir l’adresse `localhost` (pas le site en ligne) |
| Mot de passe oublié | Supprimer `content-private/admin.json`, rouvrir `/admin` |
| « Session expirée » en enregistrant | Se reconnecter : les modifications en cours sont conservées, cliquer à nouveau sur *Enregistrer* |
| Une modification n’apparaît pas en ligne | Vérifier qu’elle a été commitée, que la PR a été fusionnée et que la vérification est verte |
| Revenir à une version précédente du contenu | Copier un fichier de `content-private/sauvegardes/` à la place de `src/content/content.json` |
| La CI échoue | Lancer `npm run check` en local pour voir la même erreur |

## Limites connues

- **Messages** : les formulaires Contact et RDV envoient la demande sur **WhatsApp** ; l’onglet *Messages* ne montre que les copies enregistrées dans le navigateur utilisé. Recevoir les messages par e-mail demanderait un service externe.
- **Polices** : chargées depuis Google Fonts ; sans connexion, les polices du système sont utilisées.
- **Photos** : plusieurs photos d’origine dépassent 1,5 Mo ; les compresser accélère le site sur mobile.
- **Maintenance** : les tarifs de la page Maintenance sont en euros et ne sont pas encore modifiables depuis l’admin.

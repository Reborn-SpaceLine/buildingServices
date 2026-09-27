/* =========================
   Modèle de contenu du site, modifiable depuis /admin
   ========================= */

/* ---------- Langues ----------
   Le français est la langue de référence : tous les textes existent en français.
   Les autres langues sont des traductions, rangées dans le champ `i18n` de chaque élément.
   Une traduction manquante affiche le texte français. */
export const defaultLanguage = 'fr' as const;
export const translatedLanguages = ['en'] as const;

export type TranslatedLang = typeof translatedLanguages[number];
export type Lang = typeof defaultLanguage | TranslatedLang;

/** Traductions d'un élément : { en: { title: '…' } } */
export type Translations<T> = Partial<Record<TranslatedLang, Partial<T>>>;

export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'fichier' | 'autre';

/** Vidéo ou publication liée : lien vers un réseau social ou fichier vidéo hébergé sur le site */
export interface MediaLink {
  platform: Platform;
  url: string;
  title: string;
  i18n?: Translations<{ title: string }>;
}

export interface Company {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;          // numéro international sans + ni espaces, ex. 237656524739
  email: string;
  website: string;
  city: string;
  hours: string;
  mapQuery: string;
  socials: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    linkedin: string;
  };
  googleReviewsUrl?: string; // lien vers la fiche Google (avis clients)
  footerTitle?: string;      // grand titre du pied de page
  footerText?: string;       // texte sous le logo du pied de page
  i18n?: Translations<{ tagline: string; city: string; hours: string; footerTitle: string; footerText: string }>;
}

export interface Hero {
  eyebrow: string;           // petite étiquette au-dessus du titre
  description: string;
  slides: string[];
  i18n?: Translations<{ eyebrow: string; description: string }>;
}

export interface Stat {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  i18n?: Translations<{ label: string }>;
}

export const serviceCategories = [
  'Conception',
  'Gros œuvre & installations',
  'Finitions',
  'Menuiserie & aménagement',
] as const;

export type ServiceCategory = typeof serviceCategories[number];

export interface Service {
  slug: string;
  title: string;
  category: ServiceCategory;
  icon: string;              // clé de l'icône, voir src/content/icons.ts
  short: string;
  intro: string;
  image: string;
  features: string[];
  steps: string[];
  featured: boolean;         // affiché sur la page d'accueil
  videos: MediaLink[];
  i18n?: Translations<{ title: string; short: string; intro: string; features: string[]; steps: string[] }>;
}

/**
 * Confidentialité du client :
 * - public    : nom affiché tel quel (avec son accord)
 * - initiales : seules les initiales sont affichées
 * - anonyme   : seul le libellé générique est affiché (ex. « Particulier »)
 * Le vrai nom et les notes ne sont jamais publiés : ils restent dans content-private/.
 */
export type ClientVisibility = 'public' | 'initiales' | 'anonyme';

export interface ProjectClient {
  visibility: ClientVisibility;
  label: string;             // ce qui est affiché sur le site
  name?: string;             // privé
  notes?: string;            // privé
}

export interface ProjectStep {
  title: string;
  text: string;
  image: string;
  i18n?: Translations<{ title: string; text: string }>;
}

export interface Project {
  slug: string;
  title: string;
  service: string;           // slug du service principal
  location: string;
  year: string;
  duration: string;
  surface: string;
  image: string;
  gallery: string[];
  description: string;
  details: string;
  client: ProjectClient;
  steps: ProjectStep[];      // documentation du chantier, étape par étape
  videos: MediaLink[];
  published: boolean;        // brouillon = jamais publié sur le site
  i18n?: Translations<{ title: string; description: string; details: string; location: string; duration: string; clientLabel: string }>;
}

/** Avis client : publié seulement avec l'accord du client (consent) ET la case « publier » */
export interface Testimonial {
  id: string;
  name: string;              // nom affiché, ex. « Aline M. »
  role: string;              // ex. « Particulier, Yaoundé »
  text: string;
  rating: number;            // 1 à 5
  project: string;           // slug de la réalisation liée (facultatif)
  date: string;              // AAAA-MM
  consent: boolean;          // accord écrit du client pour publier son avis (et sa vidéo)
  published: boolean;
  video?: MediaLink;         // témoignage vidéo (fichier envoyé ou lien YouTube, TikTok…)
  i18n?: Translations<{ role: string; text: string }>;
}

/** Formule de la page Maintenance */
export interface MaintenancePlan {
  title: string;
  description: string;
  features: string[];
  price: string;             // texte libre, ex. « À partir de 98 000 FCFA / mois »
  featured: boolean;
  i18n?: Translations<{ title: string; description: string; features: string[]; price: string }>;
}

export interface Partner {
  name: string;
  description: string;
  i18n?: Translations<{ description: string }>;
}

export interface FaqItem {
  q: string;
  a: string;
  i18n?: Translations<{ q: string; a: string }>;
}

export interface SiteContent {
  company: Company;
  hero: Hero;
  stats: Stat[];
  services: Service[];
  projects: Project[];
  faq: FaqItem[];
  videos: MediaLink[];       // vidéos mises en avant (accueil et page Vidéos)
  testimonials?: Testimonial[];
  maintenance?: { plans: MaintenancePlan[]; partners: Partner[] };
}

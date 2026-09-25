/* =========================
   Modèle de contenu du site, modifiable depuis /admin
   ========================= */

export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'fichier' | 'autre';

/** Vidéo ou publication liée : lien vers un réseau social ou fichier vidéo hébergé sur le site */
export interface MediaLink {
  platform: Platform;
  url: string;
  title: string;
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
}

export interface Hero {
  eyebrow: string;           // petite étiquette au-dessus du titre
  description: string;
  slides: string[];
}

export interface Stat {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
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
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SiteContent {
  company: Company;
  hero: Hero;
  stats: Stat[];
  services: Service[];
  projects: Project[];
  faq: FaqItem[];
  videos: MediaLink[];       // vidéos mises en avant (accueil et page Vidéos)
}

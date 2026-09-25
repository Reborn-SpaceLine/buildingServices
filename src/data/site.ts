import { Ruler, ShieldCheck, Clock, Eye, Gem, Handshake, Lightbulb, Leaf } from 'lucide-react';
import { content } from '../content';
import { serviceCategories } from '../content/types';
import type { Project, Service } from '../content/types';

export type { Project, Service };

/* =========================
   Photos livrées avec le site (public/images)
   ========================= */
export const images = {
  about: '/images/about.jpg',
  careaux: '/images/careaux.jpg',
  carousel: '/images/carousel.jpg',
  chambre: '/images/chambre11.jpg',
  cuisine: '/images/cuisine11.jpg',
  image: '/images/image.jpg',
  installation: '/images/installation.jpg',
  interieur: '/images/interieur.jpg',
  ploberie: '/images/ploberie.jpg',
  renovation: '/images/renovation.jpg',
  salon: '/images/salon1.jpg',
  services1: '/images/services1.jpg',
  services2: '/images/services2.jpg',
  services3: '/images/services3.jpg',
  unplash: '/images/unplash.jpg',
  work: '/images/work.jpg',
};

/* =========================
   Contenu éditable (src/content/content.json)
   ========================= */
const c = content.company;

export const company = {
  ...c,
  phoneHref: `tel:${c.phone.replace(/\s/g, '')}`,
  socials: {
    ...c.socials,
    whatsapp: `https://wa.me/${c.whatsapp}`,
  },
};

export const hero = content.hero;
export const stats = content.stats;
export const services = content.services;
export const projects = content.projects.filter(p => p.published);
export const faq = content.faq;
export const featuredVideos = (content.videos ?? []).filter(v => v.url);

export function whatsappLink(text: string) {
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function findService(slug: string | undefined) {
  return services.find(s => s.slug === slug);
}

export function serviceTitle(slug: string) {
  return findService(slug)?.title ?? 'Autre';
}

/** Services regroupés par catégorie, dans l'ordre des catégories */
export const servicesByCategory = serviceCategories
  .map(category => ({ category, items: services.filter(s => s.category === category) }))
  .filter(group => group.items.length > 0);

/** Filtres de la page Réalisations : uniquement les services qui ont au moins un projet */
export const projectFilters = [
  { slug: 'tous', title: 'Tous' },
  ...services.filter(s => projects.some(p => p.service === s.slug)).map(s => ({ slug: s.slug, title: s.title })),
];

/* =========================
   Textes fixes : atouts, méthode, valeurs
   ========================= */
export const reasons = [
  { icon: Ruler, title: 'Du plan à la clé', text: 'Plans, 3D, travaux et finitions : un seul interlocuteur pour tout votre projet.' },
  { icon: Gem, title: 'Matériaux choisis', text: 'Des matériaux durables et des fournisseurs sélectionnés pour leur fiabilité.' },
  { icon: Clock, title: 'Délais tenus', text: 'Un planning clair, validé avec vous, et une équipe qui s’y tient.' },
  { icon: Eye, title: 'Transparence totale', text: 'Devis détaillé, aucun coût caché et des points d’avancement réguliers, photos à l’appui.' },
];

export const processSteps = [
  { title: 'Rencontre', text: 'Un premier échange, gratuit, pour comprendre votre projet, vos contraintes et votre budget.', image: images.work },
  { title: 'Plans & devis', text: 'Plans, rendus 3D et devis détaillé : vous validez tout avant le démarrage.', image: images.services2 },
  { title: 'Réalisation', text: 'Nos équipes exécutent, vous tiennent informé et livrent un chantier propre et fini.', image: images.renovation },
];

export const values = [
  { icon: Gem, title: 'Exigence', text: 'Chaque détail compte, du premier trait de plan à la dernière finition.' },
  { icon: Lightbulb, title: 'Innovation', text: 'Modélisation 3D, matériaux actuels et techniques éprouvées au service de vos espaces.' },
  { icon: ShieldCheck, title: 'Fiabilité', text: 'Délais respectés, prix transparents et communication constante.' },
  { icon: Leaf, title: 'Durabilité', text: 'Des matériaux et des pratiques pensés pour durer et respecter l’environnement.' },
  { icon: Handshake, title: 'Discrétion', text: 'Vos informations et votre intimité sont protégées : rien n’est publié sans votre accord.' },
  { icon: Ruler, title: 'Précision', text: 'Des mesures justes et des finitions nettes, sur chaque chantier.' },
];

/* =========================
   Navigation
   `section` : identifiant de la section correspondante sur l'accueil (surlignage au scroll)
   ========================= */
export interface NavItem {
  name: string;
  to: string;
  section?: string;
  groups?: { category: string; items: { name: string; to: string }[] }[];
  children?: { name: string; to: string }[];
}

export const navItems: NavItem[] = [
  { name: 'Accueil', to: '/', section: 'accueil' },
  { name: 'À propos', to: '/a-propos', section: 'a-propos' },
  {
    name: 'Services',
    to: '/services',
    section: 'services',
    groups: servicesByCategory.map(g => ({
      category: g.category,
      items: g.items.map(s => ({ name: s.title, to: `/services/${s.slug}` })),
    })),
  },
  {
    name: 'Réalisations',
    to: '/realisations',
    section: 'realisations',
    children: [
      { name: 'Toutes les réalisations', to: '/realisations' },
      { name: 'Vidéos des projets', to: '/videos' },
    ],
  },
  { name: 'Maintenance', to: '/maintenance' },
  { name: 'Contact', to: '/contact', section: 'contact' },
];

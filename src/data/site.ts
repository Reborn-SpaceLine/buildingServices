import { Ruler, ShieldCheck, Clock, Eye, Gem, Handshake, Lightbulb, Leaf } from 'lucide-react';
import { getContent } from '../content';
import { localizeContent } from '../content/localize';
import { serviceCategories } from '../content/types';
import type { Lang, Project, Service } from '../content/types';
import { dictionaries } from '../i18n/ui';

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

/** Sections de l'accueil suivies par l'en-tête pendant le défilement */
export const spySections = ['accueil', 'a-propos', 'services', 'realisations', 'contact'];

const reasonIcons = [Ruler, Gem, Clock, Eye];
const valueIcons = [Gem, Lightbulb, ShieldCheck, Leaf, Handshake, Ruler];
const processImages = [images.work, images.services2, images.renovation];

/* =========================
   Contenu du site dans une langue donnée
   ========================= */
function buildSite(lang: Lang) {
  const c = localizeContent(getContent(), lang);
  const ui = dictionaries[lang];

  const company = {
    ...c.company,
    phoneHref: `tel:${c.company.phone.replace(/\s/g, '')}`,
    socials: {
      ...c.company.socials,
      whatsapp: `https://wa.me/${c.company.whatsapp}`,
    },
  };

  const services = c.services;
  const projects = c.projects.filter(p => p.published);

  const findService = (slug: string | undefined) => services.find(s => s.slug === slug);
  const serviceTitle = (slug: string) => findService(slug)?.title ?? ui.common.other;
  const categoryLabel = (category: string) => ui.categories[category] ?? category;

  /** Services regroupés par catégorie, dans l'ordre des catégories */
  const servicesByCategory = serviceCategories
    .map(category => ({ category: categoryLabel(category), items: services.filter(s => s.category === category) }))
    .filter(group => group.items.length > 0);

  const navItems: NavItem[] = [
    { name: ui.nav.home, to: '/', section: 'accueil' },
    { name: ui.nav.about, to: '/a-propos', section: 'a-propos' },
    {
      name: ui.nav.services,
      to: '/services',
      section: 'services',
      groups: servicesByCategory.map(g => ({
        category: g.category,
        items: g.items.map(s => ({ name: s.title, to: `/services/${s.slug}` })),
      })),
    },
    {
      name: ui.nav.realizations,
      to: '/realisations',
      section: 'realisations',
      children: [
        { name: ui.nav.allRealizations, to: '/realisations' },
        { name: ui.nav.videos, to: '/videos' },
      ],
    },
    { name: ui.nav.maintenance, to: '/maintenance' },
    { name: ui.nav.contact, to: '/contact', section: 'contact' },
  ];

  return {
    lang,
    company,
    hero: c.hero,
    stats: c.stats,
    services,
    projects,
    faq: c.faq,
    featuredVideos: c.videos.filter(v => v.url),
    // Double sécurité : seuls les avis avec accord du client et publiés s'affichent
    testimonials: (c.testimonials ?? []).filter(t => t.published && t.consent && t.text.trim()),
    servicesByCategory,
    categoryLabel,
    findService,
    serviceTitle,
    whatsappLink: (text: string) => `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`,

    /** Filtres de la page Réalisations : uniquement les services qui ont au moins un projet */
    projectFilters: [
      { slug: 'tous', title: ui.common.all },
      ...services.filter(s => projects.some(p => p.service === s.slug)).map(s => ({ slug: s.slug, title: s.title })),
    ],

    /* Textes fixes associés à leurs icônes / images */
    reasons: ui.reasons.map((r, i) => ({ ...r, icon: reasonIcons[i] })),
    processSteps: ui.processSteps.map((s, i) => ({ ...s, image: processImages[i] })),
    values: ui.values.map((v, i) => ({ ...v, icon: valueIcons[i] })),

    navItems,
  };
}

export type Site = ReturnType<typeof buildSite>;

const cache = new Map<Lang, Site>();

/** Contenu du site dans une langue (calculé une seule fois par langue) */
export function getSite(lang: Lang): Site {
  let site = cache.get(lang);
  if (!site) {
    site = buildSite(lang);
    cache.set(lang, site);
  }
  return site;
}

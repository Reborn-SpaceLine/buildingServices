// Référencement : titre, description, image d'aperçu et données structurées de chaque page.
// Partagé entre le serveur (balises écrites dans le HTML, lues par Google, WhatsApp, Facebook…)
// et le site (mise à jour pendant la navigation).

const texts = {
  fr: {
    suffix: 'Building Service',
    home: {
      title: 'Building Service – Construction, rénovation et aménagement au Cameroun',
      description: 'Plans d’architecture, construction, rénovation, finitions et aménagement intérieur à Yaoundé et Douala. Un seul interlocuteur, du plan à la remise des clés. Devis gratuit.',
    },
    '/a-propos': { title: 'À propos', description: 'L’histoire, l’équipe et les valeurs de Building Service : bâtir au Cameroun selon les meilleurs standards.' },
    '/services': { title: 'Nos services', description: 'Plans d’architecture, construction, plomberie, électricité, carrelage, staff, menuiserie, cuisines sur mesure… Tous les corps de métier, un seul interlocuteur.' },
    '/realisations': { title: 'Nos réalisations', description: 'Découvrez nos chantiers à Yaoundé et Douala : cuisines, salons, salles de bain, suites parentales… photos, étapes et détails.' },
    '/videos': { title: 'Vidéos des projets', description: 'Avant/après, étapes de chantier et conseils : toutes les vidéos des réalisations Building Service.' },
    '/maintenance': { title: 'Maintenance', description: 'Formules de maintenance préventive, corrective et dépannage d’urgence pour vos bâtiments.' },
    '/contact': { title: 'Contact', description: 'Contactez Building Service : devis gratuit, réponse sous 24 h ouvrées. Téléphone, WhatsApp, e-mail.' },
    '/rdv': { title: 'Prendre rendez-vous', description: 'Réservez un appel découverte gratuit ou une visite sur site avec un conseiller Building Service.' },
    notFound: { title: 'Page introuvable', description: 'Cette page n’existe pas ou plus.' },
  },
  en: {
    suffix: 'Building Service',
    home: {
      title: 'Building Service – Construction, renovation and interior fit-out in Cameroon',
      description: 'Architectural plans, construction, renovation, finishing and interior fit-out in Yaoundé and Douala. One point of contact, from plans to handover. Free quote.',
    },
    '/a-propos': { title: 'About us', description: 'The story, team and values of Building Service: building in Cameroon to the highest standards.' },
    '/services': { title: 'Our services', description: 'Architectural plans, construction, plumbing, electrical, tiling, plasterwork, carpentry, custom kitchens… Every trade, one point of contact.' },
    '/realisations': { title: 'Our projects', description: 'Discover our projects in Yaoundé and Douala: kitchens, living rooms, bathrooms, master suites… photos, steps and details.' },
    '/videos': { title: 'Project videos', description: 'Before/after, building-site progress and tips: all Building Service project videos.' },
    '/maintenance': { title: 'Maintenance', description: 'Preventive and corrective maintenance plans and emergency repairs for your buildings.' },
    '/contact': { title: 'Contact', description: 'Contact Building Service: free quote, reply within one business day. Phone, WhatsApp, email.' },
    '/rdv': { title: 'Book a meeting', description: 'Book a free discovery call or an on-site visit with a Building Service adviser.' },
    notFound: { title: 'Page not found', description: 'This page doesn’t exist (anymore).' },
  },
};

const DEFAULT_IMAGE = '/images/carousel.jpg';

/** Texte traduit s'il existe (même règle que le site) */
const tr = (item, field, lang) => (lang !== 'fr' && item?.i18n?.[lang]?.[field]?.trim()) || item?.[field] || '';

const clip = (text, max = 160) => {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

const absolute = (siteUrl, path) => (/^https?:\/\//.test(path) ? path : `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`);

/** Fiche « entreprise locale » (schema.org) */
function localBusiness(content, siteUrl, lang) {
  const c = content.company;
  const sameAs = Object.values(c.socials ?? {}).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${siteUrl}/#entreprise`,
    name: c.name,
    description: tr(c, 'tagline', lang),
    url: siteUrl || undefined,
    logo: siteUrl ? `${siteUrl}/logo.svg` : undefined,
    image: siteUrl ? absolute(siteUrl, content.hero?.slides?.[0] ?? DEFAULT_IMAGE) : undefined,
    telephone: c.phone,
    email: c.email,
    areaServed: ['Yaoundé', 'Douala', 'Cameroun'].map(name => ({ '@type': 'Place', name })),
    address: { '@type': 'PostalAddress', addressLocality: c.mapQuery || 'Yaoundé', addressCountry: 'CM' },
    openingHours: 'Mo-Sa 08:00-18:00',
    sameAs: sameAs.length ? sameAs : undefined,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: lang === 'fr' ? 'Services' : 'Services',
      itemListElement: (content.services ?? []).map(s => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: tr(s, 'title', lang), url: siteUrl ? `${siteUrl}/services/${s.slug}` : undefined },
      })),
    },
  };
}

/**
 * Balises d'une page.
 * @param {string} pathname  chemin demandé, ex. /services/plomberie
 * @param {'fr'|'en'} lang
 * @param {object} content   contenu public du site
 * @param {string} siteUrl   adresse publique (sans / final), peut être vide
 */
export function pageMeta(pathname, lang, content, siteUrl = '') {
  const t = texts[lang] ?? texts.fr;
  const path = pathname.replace(/\/+$/, '') || '/';
  const withSuffix = title => `${title} | ${t.suffix}`;
  const url = `${siteUrl}${path}${lang === 'fr' ? '' : `?lang=${lang}`}`;
  const alternates = { fr: `${siteUrl}${path}`, en: `${siteUrl}${path}?lang=en` };

  let title = t.home.title;
  let description = t.home.description;
  let image = content?.hero?.slides?.[0] ?? DEFAULT_IMAGE;
  let type = 'website';
  let notFound = false;
  const jsonLd = [];

  const service = path.match(/^\/services\/([\w-]+)$/);
  const project = path.match(/^\/realisations\/([\w-]+)$/);

  if (path === '/') {
    jsonLd.push(localBusiness(content, siteUrl, lang));
    if (content?.faq?.length) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.map(f => ({
          '@type': 'Question',
          name: tr(f, 'q', lang),
          acceptedAnswer: { '@type': 'Answer', text: tr(f, 'a', lang) },
        })),
      });
    }
  } else if (service) {
    const s = content?.services?.find(x => x.slug === service[1]);
    if (s) {
      title = withSuffix(tr(s, 'title', lang));
      description = clip(tr(s, 'short', lang) || tr(s, 'intro', lang));
      image = s.image || image;
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: tr(s, 'title', lang),
        description: clip(tr(s, 'intro', lang), 500),
        provider: { '@id': `${siteUrl}/#entreprise` },
        areaServed: 'Cameroun',
        url,
      });
    } else notFound = true;
  } else if (project) {
    const p = content?.projects?.find(x => x.slug === project[1]);
    if (p) {
      title = withSuffix(tr(p, 'title', lang));
      description = clip(tr(p, 'description', lang) || tr(p, 'details', lang));
      image = p.image || image;
      type = 'article';
    } else notFound = true;
  } else if (t[path]) {
    title = withSuffix(t[path].title);
    description = t[path].description;
  } else if (path !== '/admin') {
    notFound = true;
  }

  if (notFound) {
    title = withSuffix(t.notFound.title);
    description = t.notFound.description;
  }

  return {
    lang,
    title,
    description: clip(description, 200),
    image: siteUrl ? absolute(siteUrl, image) : image,
    url,
    alternates,
    type,
    jsonLd,
    notFound,
    noindex: notFound || path === '/admin',
  };
}

const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Balises HTML de la page (utilisées par le serveur dans <head>) */
export function metaTags(meta) {
  const e = escapeHtml;
  return [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex" />' : '',
    `<link rel="canonical" href="${e(meta.url)}" />`,
    `<link rel="alternate" hreflang="fr" href="${e(meta.alternates.fr)}" />`,
    `<link rel="alternate" hreflang="en" href="${e(meta.alternates.en)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${e(meta.alternates.fr)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="Building Service" />`,
    `<meta property="og:locale" content="${meta.lang === 'en' ? 'en_GB' : 'fr_FR'}" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:image" content="${e(meta.image)}" />`,
    `<meta property="og:url" content="${e(meta.url)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    ...meta.jsonLd.map(data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean).join('\n    ');
}

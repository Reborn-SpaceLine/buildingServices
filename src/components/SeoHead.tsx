import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageMeta } from '../../shared/seo.js';
import { getContent } from '../content';
import { useLang } from '../i18n/context';

/** Garde à jour une balise <meta> ou <link> du <head> */
function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key: 'name' | 'property', value: string) => () => {
  const el = document.createElement('meta');
  el.setAttribute(key, value);
  return el;
};

const link = (rel: string, hreflang?: string) => () => {
  const el = document.createElement('link');
  el.rel = rel;
  if (hreflang) el.hreflang = hreflang;
  return el;
};

/**
 * Balises de référencement mises à jour pendant la navigation (le serveur les écrit déjà au premier chargement).
 * Le titre de l'onglet reste géré par chaque page (usePageTitle).
 */
export function SeoHead() {
  const { pathname } = useLocation();
  const { lang } = useLang();

  useEffect(() => {
    const m = pageMeta(pathname, lang, getContent(), window.location.origin);
    setTag('meta[name="description"]', meta('name', 'description'), 'content', m.description);
    setTag('meta[property="og:title"]', meta('property', 'og:title'), 'content', m.title);
    setTag('meta[property="og:description"]', meta('property', 'og:description'), 'content', m.description);
    setTag('meta[property="og:image"]', meta('property', 'og:image'), 'content', m.image);
    setTag('meta[property="og:url"]', meta('property', 'og:url'), 'content', m.url);
    setTag('meta[property="og:locale"]', meta('property', 'og:locale'), 'content', lang === 'en' ? 'en_GB' : 'fr_FR');
    setTag('link[rel="canonical"]', link('canonical'), 'href', m.url);
    setTag('link[rel="alternate"][hreflang="fr"]', link('alternate', 'fr'), 'href', m.alternates.fr);
    setTag('link[rel="alternate"][hreflang="en"]', link('alternate', 'en'), 'href', m.alternates.en);

    // Données structurées (fiche entreprise, FAQ, service…)
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    for (const data of m.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }, [pathname, lang]);

  return null;
}

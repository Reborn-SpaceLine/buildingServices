import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingContact } from './FloatingContact';
import { ScrollToTop } from './ScrollToTop';
import { SeoHead } from './SeoHead';
import { PreviewBanner } from './PreviewBanner';
import { useLang } from '../i18n/context';
import { trackPageView } from '../lib/analytics';

export function Layout() {
  const location = useLocation();
  const { pathname } = location;

  // Retour en haut :
  // - nouvelle page : immédiatement ;
  // - clic sur un lien vers la page déjà affichée (logo ou « Accueil » en bas de l'accueil…) :
  //   défilement doux jusqu'en haut. Le routeur crée alors une nouvelle entrée (nouvelle clé)
  //   sans changer l'adresse ; un simple changement de filtre (?service=…) ne remonte pas.
  const previous = useRef(location);
  useEffect(() => {
    const before = previous.current;
    previous.current = location;
    if (before.pathname !== location.pathname) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } else if (before.key !== location.key && before.search === location.search && !location.hash) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    }
  }, [location]);

  // Statistiques de visite (sans cookie) : une page vue par changement de page, pas par changement de langue
  const { lang } = useLang();
  const lastTracked = useRef('');
  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackPageView(pathname, lang);
  }, [pathname, lang]);

  return (
    <div className="app">
      <SeoHead />
      <PreviewBanner />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingContact />
      <ScrollToTop />
    </div>
  );
}

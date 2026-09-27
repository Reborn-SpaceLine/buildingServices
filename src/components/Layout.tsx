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
  const { pathname } = useLocation();

  // Nouvelle page : on repart du haut
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

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

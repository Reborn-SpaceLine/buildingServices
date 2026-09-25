import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingContact } from './FloatingContact';
import { ScrollToTop } from './ScrollToTop';

export function Layout() {
  const { pathname } = useLocation();

  // Nouvelle page : on repart du haut
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="app">
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

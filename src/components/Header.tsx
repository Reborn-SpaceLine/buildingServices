import { useState, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, CalendarDays, Phone } from 'lucide-react';
import '../styles/header.css';
import Logo from '../assets/logo.svg';
import { spySections } from '../data/site';
import type { NavItem } from '../data/site';
import { useLang, useSite, useUi } from '../i18n/context';
import { languageNames } from '../i18n/ui';
import { defaultLanguage, translatedLanguages } from '../content/types';

const languages = [defaultLanguage, ...translatedLanguages];

/** Sélecteur de langue : un seul bouton « FR EN », la langue active en évidence ; un clic passe à la suivante */
function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  const ui = useUi();
  const next = languages[(languages.indexOf(lang) + 1) % languages.length];

  return (
    <button
      type="button"
      className={`lang-switch ${className}`}
      onClick={() => setLang(next)}
      aria-label={`${ui.nav.language} : ${languageNames[lang].label} → ${languageNames[next].label}`}
      title={languageNames[next].label}
    >
      {languages.map(code => (
        <span key={code} lang={code} className={code === lang ? 'active' : ''}>
          {languageNames[code].short}
        </span>
      ))}
    </button>
  );
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('accueil');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Logo : 1 clic = accueil (lien normal) ; 3 clics rapprochés = administration
  const logoClicks = useRef<number[]>([]);
  const handleLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const now = Date.now();
    logoClicks.current = [...logoClicks.current.filter(t => now - t < 800), now];
    if (logoClicks.current.length >= 3) {
      e.preventDefault();
      logoClicks.current = [];
      navigate('/admin');
    }
  };
  const { company, navItems } = useSite();
  const ui = useUi();
  const isHome = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(window.scrollY > 10);
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);

      if (!isHome) return;
      // La section active est la dernière dont le haut a dépassé le tiers supérieur de l'écran
      const line = window.innerHeight * 0.35;
      let current = spySections[0];
      for (const id of spySections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // Tout en bas de page : on est forcément sur la dernière section
      if (window.scrollY >= max - 4) current = spySections[spySections.length - 1];
      setActiveSection(current);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isHome]);

  // Ferme les menus à chaque changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Sur l'accueil, le lien actif suit la section visible ; ailleurs, il suit la page
  const linkClass = (item: NavItem, base: string) => ({ isActive }: { isActive: boolean }) => {
    const active = isHome ? item.section === activeSection : isActive && item.to !== '/';
    return `${base} ${active ? 'active' : ''}`;
  };

  const hasMenu = (item: NavItem) => Boolean(item.groups || item.children);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-bar">
        <Link to="/" className="header-logo" onClick={handleLogoClick} aria-label={ui.nav.homeLabel}>
          <img src={Logo} alt="" className="header-logo-image" />
          <div className="header-logo-text" translate="no">
            <span className="logo-main">BUILDING</span>
            <span className="logo-sub">SERVICE</span>
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="header-nav" aria-label={ui.nav.mainNav}>
          {navItems.map(item => (
            <div
              key={item.to}
              className="nav-item-wrapper"
              onMouseEnter={() => hasMenu(item) && setOpenDropdown(item.to)}
              onMouseLeave={() => hasMenu(item) && setOpenDropdown(null)}
            >
              <NavLink to={item.to} end={item.to === '/'} className={linkClass(item, 'header-nav-link')}>
                {item.name}
                {hasMenu(item) && (
                  <ChevronDown size={16} className={`dropdown-arrow ${openDropdown === item.to ? 'open' : ''}`} />
                )}
              </NavLink>

              {item.groups && (
                <div className={`dropdown-menu mega ${openDropdown === item.to ? 'open' : ''}`}>
                  {item.groups.map(group => (
                    <div key={group.category} className="mega-group">
                      <p className="mega-title">{group.category}</p>
                      {group.items.map(child => (
                        <NavLink key={child.to} to={child.to} className="dropdown-link">{child.name}</NavLink>
                      ))}
                    </div>
                  ))}
                  <Link to="/services" className="mega-all">{ui.nav.allServices}</Link>
                </div>
              )}

              {item.children && (
                <div className={`dropdown-menu ${openDropdown === item.to ? 'open' : ''}`}>
                  {item.children.map(child => (
                    <NavLink key={child.to} to={child.to} end className="dropdown-link">{child.name}</NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        {/* Sélecteur de langue visible dans la barre sur téléphone */}
        <LanguageSwitcher className="mobile-lang" />

        <div className="header-actions">
          <LanguageSwitcher className="header-lang" />
          <a href={company.phoneHref} className="header-phone" aria-label={`${ui.nav.call} ${company.phone}`}>
            <Phone size={18} />
          </a>
          <Link to="/rdv" className="btn btn-primary btn-sm header-cta">
            {ui.nav.appointment} <CalendarDays />
          </Link>
          <button
            className="header-mobile-button"
            aria-label={isMobileMenuOpen ? ui.nav.closeMenu : ui.nav.openMenu}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Progression de lecture */}
        <span className="header-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      </div>

      {/* Navigation mobile */}
      <nav className={`header-mobile-nav ${isMobileMenuOpen ? 'open' : ''}`} aria-label={ui.nav.mobileNav}>
        {navItems.map(item => (
          <div key={item.to} className="mobile-item">
            <div className="mobile-item-row">
              <NavLink to={item.to} end={item.to === '/'} className={linkClass(item, 'header-mobile-nav-link')}>
                {item.name}
              </NavLink>
              {hasMenu(item) && (
                <button
                  className="mobile-dropdown-toggle"
                  aria-label={`${ui.nav.show} ${item.name}`}
                  aria-expanded={openDropdown === item.to}
                  onClick={() => setOpenDropdown(openDropdown === item.to ? null : item.to)}
                >
                  <ChevronDown size={18} className={`dropdown-arrow ${openDropdown === item.to ? 'open' : ''}`} />
                </button>
              )}
            </div>
            {openDropdown === item.to && (
              <div className="mobile-dropdown">
                {item.groups?.map(group => (
                  <div key={group.category}>
                    <p className="mobile-group-title">{group.category}</p>
                    {group.items.map(child => (
                      <NavLink key={child.to} to={child.to} className="mobile-dropdown-link">{child.name}</NavLink>
                    ))}
                  </div>
                ))}
                {item.children?.map(child => (
                  <NavLink key={child.to} to={child.to} end className="mobile-dropdown-link">{child.name}</NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
        <Link to="/rdv" className="btn btn-primary mobile-cta">
          {ui.nav.appointment} <CalendarDays />
        </Link>
      </nav>
    </header>
  );
}

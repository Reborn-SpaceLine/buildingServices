import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, CalendarDays, Phone } from 'lucide-react';
import '../styles/header.css';
import Logo from '../assets/logo.svg';
import { company, navItems } from '../data/site';
import type { NavItem } from '../data/site';

/** Sections de l'accueil suivies pendant le défilement */
const spySections = navItems.map(item => item.section).filter((s): s is string => Boolean(s));

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('accueil');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
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
        <Link to="/" className="header-logo" onDoubleClick={() => navigate('/admin')} aria-label="Building Service – accueil">
          <img src={Logo} alt="" className="header-logo-image" />
          <div className="header-logo-text">
            <span className="logo-main">BUILDING</span>
            <span className="logo-sub">SERVICE</span>
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="header-nav" aria-label="Navigation principale">
          {navItems.map(item => (
            <div
              key={item.name}
              className="nav-item-wrapper"
              onMouseEnter={() => hasMenu(item) && setOpenDropdown(item.name)}
              onMouseLeave={() => hasMenu(item) && setOpenDropdown(null)}
            >
              <NavLink to={item.to} end={item.to === '/'} className={linkClass(item, 'header-nav-link')}>
                {item.name}
                {hasMenu(item) && (
                  <ChevronDown size={16} className={`dropdown-arrow ${openDropdown === item.name ? 'open' : ''}`} />
                )}
              </NavLink>

              {item.groups && (
                <div className={`dropdown-menu mega ${openDropdown === item.name ? 'open' : ''}`}>
                  {item.groups.map(group => (
                    <div key={group.category} className="mega-group">
                      <p className="mega-title">{group.category}</p>
                      {group.items.map(child => (
                        <NavLink key={child.to} to={child.to} className="dropdown-link">{child.name}</NavLink>
                      ))}
                    </div>
                  ))}
                  <Link to="/services" className="mega-all">Voir tous les services →</Link>
                </div>
              )}

              {item.children && (
                <div className={`dropdown-menu ${openDropdown === item.name ? 'open' : ''}`}>
                  {item.children.map(child => (
                    <NavLink key={child.to} to={child.to} end className="dropdown-link">{child.name}</NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="header-actions">
          <a href={company.phoneHref} className="header-phone" aria-label={`Appeler le ${company.phone}`}>
            <Phone size={18} />
          </a>
          <Link to="/rdv" className="btn btn-primary btn-sm header-cta">
            Prendre RDV <CalendarDays />
          </Link>
          <button
            className="header-mobile-button"
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
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
      <nav className={`header-mobile-nav ${isMobileMenuOpen ? 'open' : ''}`} aria-label="Navigation mobile">
        {navItems.map(item => (
          <div key={item.name} className="mobile-item">
            <div className="mobile-item-row">
              <NavLink to={item.to} end={item.to === '/'} className={linkClass(item, 'header-mobile-nav-link')}>
                {item.name}
              </NavLink>
              {hasMenu(item) && (
                <button
                  className="mobile-dropdown-toggle"
                  aria-label={`Afficher ${item.name}`}
                  aria-expanded={openDropdown === item.name}
                  onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                >
                  <ChevronDown size={18} className={`dropdown-arrow ${openDropdown === item.name ? 'open' : ''}`} />
                </button>
              )}
            </div>
            {openDropdown === item.name && (
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
          Prendre RDV <CalendarDays />
        </Link>
      </nav>
    </header>
  );
}

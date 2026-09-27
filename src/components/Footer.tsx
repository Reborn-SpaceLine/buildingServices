import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, CalendarDays } from 'lucide-react';
import { SocialIcons } from './SocialIcons';
import '../styles/footer.css';
import Logo from '../assets/logo.svg';
import { useSite, useUi } from '../i18n/context';

export function Footer() {
  const { company, navItems, services } = useSite();
  const ui = useUi();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <h2>{company.footerTitle || ui.footer.ctaTitle}</h2>
          <Link to="/rdv" className="btn btn-primary">
            {ui.nav.appointment} <CalendarDays />
          </Link>
        </div>

        <p className="footer-watermark" aria-hidden="true" translate="no">Building Service</p>

        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={Logo} alt="" />
              <div translate="no">
                <span className="logo-main">BUILDING</span>
                <span className="logo-sub">SERVICE</span>
              </div>
            </Link>
            <p className="footer-tagline">{company.footerText || ui.footer.tagline}</p>
            <SocialIcons variant="light" size="sm" className="footer-socials" />
          </div>

          <nav className="footer-nav" aria-label={ui.footer.linksLabel}>
            <h3>{ui.footer.navigation}</h3>
            <ul>
              {navItems.map(item => (
                <li key={item.to}><Link to={item.to}>{item.name}</Link></li>
              ))}
              <li><Link to="/rdv">{ui.nav.appointmentLong}</Link></li>
            </ul>
          </nav>

          <div className="footer-services">
            <h3>{ui.footer.services}</h3>
            <ul>
              {services.map(s => (
                <li key={s.slug}><Link to={`/services/${s.slug}`}>{s.title}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3>{ui.footer.contact}</h3>
            <ul className="footer-contact">
              <li><Phone size={16} /><a href={company.phoneHref}>{company.phone}</a></li>
              <li><Mail size={16} /><a href={`mailto:${company.email}`}>{company.email}</a></li>
              <li><MapPin size={16} /><span>{company.city}</span></li>
              <li className="footer-hours"><Clock size={16} /><span>{company.hours}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} <span translate="no">Building Service</span>. {ui.footer.rights}</p>
      </div>
    </footer>
  );
}

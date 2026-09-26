import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, Phone } from 'lucide-react';
import { SocialIcons } from './SocialIcons';
import { Counter } from './ui';
import { images } from '../data/site';
import { useSite, useUi } from '../i18n/context';
import '../styles/hero.css';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HomeHero() {
  const { company, hero, projects, stats } = useSite();
  const ui = useUi();
  const slides = useMemo(() => (hero.slides.length > 0 ? hero.slides : [images.carousel]), [hero.slides]);

  const [slide, setSlide] = useState(0);
  // « Découvrir » (tablette / mobile) : visible en haut de page, masqué dès qu'on fait défiler
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [paused, setPaused] = useState(false);
  const [autoplay] = useState(() => slides.length > 1 && !prefersReducedMotion());

  const go = (index: number) => setSlide((index + slides.length) % slides.length);

  // Glisser du doigt pour changer de photo (écrans tactiles)
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? slide + 1 : slide - 1);
  };

  // Flèches du clavier quand le diaporama a le focus
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(slide + 1);
    if (e.key === 'ArrowLeft') go(slide - 1);
  };

  // Précharge la photo suivante pour un fondu sans à-coup
  useEffect(() => {
    const next = new Image();
    next.src = slides[(slide + 1) % slides.length];
  }, [slide, slides]);

  // Légende de la photo affichée : le projet qui l'utilise, s'il existe
  const current = slides[slide];
  const caption = projects.find(p => p.image === current || p.gallery.includes(current));

  return (
    <section
      id="accueil"
      className={`hero ${paused ? 'is-paused' : ''}`}
      aria-roledescription={ui.hero.carousel}
      aria-label={ui.hero.label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Photos en fondu */}
      {slides.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={`hero-slide ${i === slide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
          aria-hidden="true"
        />
      ))}
      <div className="hero-overlay" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-content">
          {hero.eyebrow && (
            <p className="hero-eyebrow">
              <span className="hero-eyebrow-dot" aria-hidden="true" />
              {hero.eyebrow}
            </p>
          )}

          <h1 className="hero-title" translate="no">
            <span className="hero-title-script">Building</span>
            <span className="hero-title-main">SERVICE</span>
          </h1>

          <p className="hero-description">{hero.description}</p>

          <div className="hero-actions">
            <Link to="/contact" className="btn btn-primary">
              {ui.common.requestFreeQuote} <FileText />
            </Link>
            <Link to="/rdv" className="btn btn-outline-white">
              {ui.common.bookAppointment} <CalendarDays />
            </Link>
            <a href={company.phoneHref} className="btn btn-ghost-white hero-call" aria-label={`${ui.nav.call} ${company.phone}`}>
              <Phone /> {company.phone}
            </a>
          </div>

          <dl className="hero-stats">
            {stats.slice(0, 3).map(stat => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd><Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></dd>
              </div>
            ))}
          </dl>

          <SocialIcons variant="light" size="sm" className="hero-socials" />
        </div>
      </div>

      {/* Légende + commandes du diaporama */}
      <div className="container hero-bottom">
        <div className="hero-caption" aria-live="polite">
          {caption ? (
            <Link to={`/realisations/${caption.slug}`}>
              <span>{ui.hero.realization}</span>
              <strong>{caption.title}</strong>
              <ArrowRight size={16} />
            </Link>
          ) : <span />}
        </div>

        {slides.length > 1 && (
          <div className="hero-controls">
            <button className="hero-arrow" onClick={() => go(slide - 1)} aria-label={ui.hero.previousPhoto}><ChevronLeft size={20} /></button>
            <div className="hero-indicators">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`hero-indicator ${i === slide ? 'active' : ''} ${i < slide ? 'done' : ''}`}
                  onClick={() => go(i)}
                  aria-label={ui.hero.showPhoto(i + 1, slides.length)}
                  aria-current={i === slide}
                >
                  <span
                    key={i === slide ? `run-${slide}` : 'idle'}
                    className={`hero-indicator-fill ${autoplay ? 'autoplay' : ''}`}
                    onAnimationEnd={() => autoplay && i === slide && go(slide + 1)}
                  />
                </button>
              ))}
            </div>
            <button className="hero-arrow" onClick={() => go(slide + 1)} aria-label={ui.hero.nextPhoto}><ChevronRight size={20} /></button>
          </div>
        )}
      </div>

      <a href="#decouvrir" className={`hero-scroll ${atTop ? '' : 'is-hidden'}`} aria-label={ui.hero.discoverNext}>
        <span>{ui.common.discover}</span>
        <ChevronDown size={20} />
      </a>
    </section>
  );
}

import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, FileText, Phone } from 'lucide-react';
import { SocialIcons } from './SocialIcons';
import { Counter } from './ui';
import { company, hero, images, projects, stats } from '../data/site';
import '../styles/hero.css';

const slides = hero.slides.length > 0 ? hero.slides : [images.carousel];

/** Légende d'une photo : le projet qui l'utilise, s'il existe */
const captions = slides.map(src => projects.find(p => p.image === src || p.gallery.includes(src)));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HomeHero() {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoplay] = useState(() => slides.length > 1 && !prefersReducedMotion());

  const go = (index: number) => setSlide((index + slides.length) % slides.length);

  // Flèches du clavier quand le diaporama a le focus
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(slide + 1);
    if (e.key === 'ArrowLeft') go(slide - 1);
  };

  // Précharge la photo suivante pour un fondu sans à-coup
  useEffect(() => {
    const next = new Image();
    next.src = slides[(slide + 1) % slides.length];
  }, [slide]);

  const caption = captions[slide];

  return (
    <section
      id="accueil"
      className={`hero ${paused ? 'is-paused' : ''}`}
      aria-roledescription="carrousel"
      aria-label="Présentation de Building Service"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
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

          <h1 className="hero-title">
            <span className="hero-title-script">Building</span>
            <span className="hero-title-main">SERVICE</span>
          </h1>

          <p className="hero-description">{hero.description}</p>

          <div className="hero-actions">
            <Link to="/contact" className="btn btn-primary">
              Demander un devis gratuit <FileText />
            </Link>
            <Link to="/rdv" className="btn btn-outline-white">
              Prendre rendez-vous <CalendarDays />
            </Link>
            <a href={company.phoneHref} className="hero-call">
              <Phone size={18} /> {company.phone}
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
              <span>Réalisation</span>
              <strong>{caption.title}</strong>
              <ArrowRight size={16} />
            </Link>
          ) : <span />}
        </div>

        {slides.length > 1 && (
          <div className="hero-controls">
            <button className="hero-arrow" onClick={() => go(slide - 1)} aria-label="Photo précédente"><ChevronLeft size={20} /></button>
            <div className="hero-indicators">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`hero-indicator ${i === slide ? 'active' : ''} ${i < slide ? 'done' : ''}`}
                  onClick={() => go(i)}
                  aria-label={`Afficher la photo ${i + 1} sur ${slides.length}`}
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
            <button className="hero-arrow" onClick={() => go(slide + 1)} aria-label="Photo suivante"><ChevronRight size={20} /></button>
          </div>
        )}
      </div>

      <a href="#decouvrir" className="hero-scroll" aria-label="Découvrir la suite">
        <span>Découvrir</span>
        <ChevronDown size={20} />
      </a>
    </section>
  );
}

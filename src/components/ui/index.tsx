import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react';
import { SafeImage } from '../SafeImage';
import { useUi } from '../../i18n/context';
import '../../styles/ui.css';

/* =========================
   Reveal : apparition au scroll
   ========================= */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sans IntersectionObserver ou avec animations réduites : contenu affiché directement
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* =========================
   SectionIntro : pastille + titre + paragraphe
   ========================= */
interface SectionIntroProps {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  centered?: boolean;
  onDark?: boolean;
  as?: 'h1' | 'h2';
}

export function SectionIntro({ eyebrow, title, text, centered, onDark, as = 'h2' }: SectionIntroProps) {
  const Heading = as;
  return (
    <Reveal className={`section-intro ${centered ? 'centered' : ''} ${onDark ? 'on-dark' : ''}`}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <Heading>{title}</Heading>
      </div>
      {text && <p>{text}</p>}
    </Reveal>
  );
}

/* =========================
   Counter : chiffre animé
   ========================= */
export function Counter({ value, prefix = '', suffix = '', duration = 2000 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const ui = useUi();
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(value);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref}>
      {prefix}{current.toLocaleString(ui.locale)}{suffix}
    </span>
  );
}

/* =========================
   Marquee : carrousel d'images en défilement continu
   ========================= */
export function Marquee({ images }: { images: { src: string; alt: string }[] }) {
  const ui = useUi();
  const loop = [...images, ...images];
  return (
    <div className="marquee" aria-label={ui.common.realizationsPreview}>
      <div className="marquee-track">
        {loop.map((img, i) => (
          <SafeImage key={i} src={img.src} alt={i < images.length ? img.alt : ''} eager />
        ))}
      </div>
    </div>
  );
}

/* =========================
   Accordion : FAQ
   ========================= */
export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="accordion">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={`accordion-item ${isOpen ? 'open' : ''}`}>
            <button
              className="accordion-trigger"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{item.q}</span>
              <ChevronDown className="accordion-icon" />
            </button>
            <div id={`faq-${i}`} className="accordion-panel" role="region">
              <div className="accordion-panel-inner">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================
   Lightbox : galerie plein écran
   ========================= */
export function Lightbox({ images, index, onClose, onChange }: { images: string[]; index: number | null; onClose: () => void; onChange: (i: number) => void }) {
  const ui = useUi();
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, images.length, onClose, onChange]);

  if (index === null) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" aria-label={ui.common.close} onClick={onClose}><X /></button>
      {images.length > 1 && (
        <button
          className="lightbox-nav prev"
          aria-label={ui.common.previousImage}
          onClick={(e) => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }}
        >
          <ChevronLeft />
        </button>
      )}
      <img src={images[index]} alt="" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <button
          className="lightbox-nav next"
          aria-label={ui.common.nextImage}
          onClick={(e) => { e.stopPropagation(); onChange((index + 1) % images.length); }}
        >
          <ChevronRight />
        </button>
      )}
      <span className="lightbox-count">{index + 1} / {images.length}</span>
    </div>
  );
}

/* =========================
   PageHero : bandeau en haut des pages internes
   ========================= */
export function PageHero({ eyebrow, title, text, image }: { eyebrow: string; title: ReactNode; text?: ReactNode; image?: string }) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="page-hero-box" style={image ? { backgroundImage: `url(${image})` } : undefined}>
          {image && <div className="page-hero-overlay" />}
          <div className={`page-hero-content ${image ? 'on-image' : ''}`}>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {text && <p>{text}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   CtaBanner : bannière d'appel à l'action avec fond parallax
   ========================= */
export function CtaBanner({ image, title, text, button, to = '/rdv' }: { image: string; title: string; text: string; button?: string; to?: string }) {
  const ui = useUi();
  return (
    <section className="section no-mark">
      <div className="container">
        <Reveal>
          <div className="cta-banner" style={{ backgroundImage: `url(${image})` }}>
            <div className="cta-banner-overlay" />
            <div className="cta-banner-content">
              <h2>{title}</h2>
              <Link to={to} className="btn btn-primary">
                {button ?? ui.common.planMeeting} <CalendarDays />
              </Link>
            </div>
            <p className="cta-banner-note">{text}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

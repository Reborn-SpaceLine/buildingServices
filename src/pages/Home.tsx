import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal, SectionIntro, Counter, Marquee, Accordion, CtaBanner } from '../components/ui';
import { ServiceCard, ProjectCard } from '../components/Cards';
import { HomeHero } from '../components/HomeHero';
import { MediaList } from '../components/Media';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { serviceIcon } from '../content/icons';
import { useSite, useUi } from '../i18n/context';
import '../styles/home.css';

// Mosaïque des services : pleine largeur, puis deux demi-cartes, et on recommence
const isFullWidth = (index: number) => index % 3 === 0;

export function Home() {
  usePageTitle('');
  const ui = useUi();
  const t = ui.home;
  const { services, servicesByCategory, projects, stats, reasons, processSteps, faq, featuredVideos } = useSite();

  const featured = services.filter(s => s.featured);
  // Vidéos mises en avant d'abord, puis celles des projets et services
  const latestVideos = [...featuredVideos, ...projects.flatMap(p => p.videos), ...services.flatMap(s => s.videos)].filter(v => v.url).slice(0, 3);

  const marqueeImages = projects.map(p => ({ src: p.image, alt: p.title }))
    .concat(services.slice(0, 4).map(s => ({ src: s.image, alt: s.title })));

  return (
    <>
      {/* 1. Hero : diaporama plein écran */}
      <HomeHero />

      {/* Bandeau carrousel des réalisations */}
      <div id="decouvrir" className="hero-marquee">
        <Marquee images={marqueeImages} />
      </div>

      {/* 2. Services mis en avant */}
      <section id="services" className="section">
        <div className="container">
          <SectionIntro eyebrow={t.servicesEyebrow} title={t.servicesTitle} text={t.servicesText(services.length)} />
          <div className="services-bento">
            {featured.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 80} className={isFullWidth(i) ? 'bento-full' : 'bento-half'}>
                <ServiceCard service={service} layout={isFullWidth(i) ? 'horizontal' : 'vertical'} />
              </Reveal>
            ))}
          </div>

          {/* Tous les métiers, par catégorie */}
          <Reveal className="trades">
            {servicesByCategory.map(group => (
              <div key={group.category} className="trades-group">
                <p className="trades-title">{group.category}</p>
                <div className="trades-list">
                  {group.items.map(s => {
                    const Icon = serviceIcon(s.icon);
                    return (
                      <Link key={s.slug} to={`/services/${s.slug}`} className="trade-chip">
                        <Icon size={16} /> {s.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 3. Réalisations sur fond sombre */}
      <section id="realisations" className="container">
        <div className="projects-dark">
          <SectionIntro eyebrow={t.realizationsEyebrow} onDark title={t.realizationsTitle} text={t.realizationsText} />
          <div className="projects-grid">
            {projects.slice(0, 6).map((project, i) => (
              <Reveal key={project.slug} delay={(i % 3) * 100}>
                <ProjectCard project={project} variant="glass" />
              </Reveal>
            ))}
          </div>
          <div className="projects-dark-cta">
            <Link to="/realisations" className="btn btn-light">
              {t.allRealizations} <ArrowRight />
            </Link>
          </div>
        </div>

        {/* 4. Chiffres qui chevauchent le bloc sombre */}
        <Reveal className="stats-card">
          <div className="stats-intro">
            <span className="eyebrow">{t.statsEyebrow}</span>
            <h2>{t.statsTitle}</h2>
            <p>{t.statsText}</p>
          </div>
          <div className="stats-grid">
            {stats.map(stat => (
              <div key={stat.label} className="stat">
                <strong><Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 5. Pourquoi nous */}
      <section id="a-propos" className="section">
        <div className="container">
          <SectionIntro eyebrow={t.whyEyebrow} title={t.whyTitle} text={t.whyText} />
          <div className="reasons-grid">
            {reasons.map((reason, i) => {
              const Icon = reason.icon;
              return (
                <Reveal key={reason.title} delay={i * 80} className="reason">
                  <span className="reason-icon"><Icon /></span>
                  <h3>{reason.title}</h3>
                  <p>{reason.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Bannière CTA */}
      <CtaBanner image={images.carousel} title={t.ctaTitle} text={t.ctaText} />

      {/* 7. Méthode */}
      <section className="section">
        <div className="container">
          <SectionIntro eyebrow={t.methodEyebrow} title={t.methodTitle} text={t.methodText} />
          <div className="process-grid">
            {processSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className={`process-card ${i === 1 ? 'dark' : ''}`}>
                <div className="process-text">
                  <span className="process-number">0{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                <SafeImage src={step.image} alt={step.title} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Vidéos récentes (affichées dès qu'une vidéo est ajoutée dans l'admin) */}
      {latestVideos.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionIntro eyebrow={t.videosEyebrow} title={t.videosTitle} text={t.videosText} />
            <MediaList videos={latestVideos} />
            <div className="center-actions">
              <Link to="/videos" className="btn btn-dark">{t.allVideos} <ArrowRight /></Link>
            </div>
          </div>
        </section>
      )}

      {/* 8. FAQ */}
      <section id="contact" className="section faq-section">
        <div className="container faq-layout">
          <Reveal className="faq-intro">
            <span className="eyebrow">{t.faqEyebrow}</span>
            <h2>{t.faqTitle}</h2>
            <p>{t.faqText}</p>
            <Link to="/contact" className="btn btn-dark">
              {ui.common.contactUs} <ArrowRight />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <Accordion items={faq} />
          </Reveal>
        </div>
      </section>
    </>
  );
}

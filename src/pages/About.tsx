import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import { PageHero, Reveal, SectionIntro, Counter, CtaBanner } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { useSite, useUi } from '../i18n/context';
import '../styles/pages.css';

export function AboutPage() {
  const ui = useUi();
  const t = ui.about;
  const { stats, values } = useSite();
  usePageTitle(t.title);

  const gallery = [images.about, images.interieur, images.salon, images.cuisine];

  return (
    <>
      <PageHero eyebrow={ui.nav.about} title={t.heroTitle} text={t.heroText} image={images.work} />

      <section className="section">
        <div className="container split">
          <Reveal>
            <span className="eyebrow">{t.whoEyebrow}</span>
            <h2 className="split-title">{t.whoTitleStart} <span className="highlight">{t.whoTitleHighlight}</span>.</h2>
            <p className="split-text">{t.whoText1}</p>
            <p className="split-text">{t.whoText2}</p>
            <div className="mission-box">
              <h3>{t.missionTitle}</h3>
              <p>{t.missionText}</p>
            </div>
          </Reveal>

          <Reveal delay={120} className="about-gallery">
            {gallery.map((src, i) => <img key={src} src={src} alt={t.galleryAlt[i]} loading="lazy" />)}
            <div className="about-badge">
              <Award />
              <div>
                <strong>10+</strong>
                <span>{t.badgeLabel}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container">
        <div className="stats-band">
          {stats.map(stat => (
            <div key={stat.label}>
              <strong><Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} /></strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionIntro eyebrow={t.valuesEyebrow} title={t.valuesTitle} text={t.valuesText} />
          <div className="values-grid">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <Reveal key={value.title} delay={(i % 3) * 80} className="value-card">
                  <span className="value-icon"><Icon /></span>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </Reveal>
              );
            })}
          </div>
          <div className="center-actions">
            <Link to="/contact" className="btn btn-primary">
              {t.workWithUs} <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <CtaBanner image={images.renovation} title={t.ctaTitle} text={t.ctaText} />
    </>
  );
}

import { PageHero, Reveal, SectionIntro, CtaBanner } from '../components/ui';
import { ServiceCard } from '../components/Cards';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { useSite, useUi } from '../i18n/context';
import '../styles/pages.css';

export function ServicesPage() {
  const t = useUi().services;
  const { services, servicesByCategory, processSteps } = useSite();
  usePageTitle(t.title);

  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} text={t.heroText(services.length)} image={images.services2} />

      {servicesByCategory.map((group, g) => (
        <section key={group.category} className={`section ${g % 2 === 1 ? 'soft-band' : ''}`}>
          <div className="container">
            <SectionIntro eyebrow={`0${g + 1}`} title={group.category} />
            <div className="cards-grid-3">
              {group.items.map((service, i) => (
                <Reveal key={service.slug} delay={(i % 3) * 80}>
                  <ServiceCard service={service} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="section">
        <div className="container">
          <SectionIntro eyebrow={t.howEyebrow} title={t.howTitle} text={t.howText} />
          <div className="steps-row">
            {processSteps.map((step, i) => (
              <Reveal key={step.title} delay={i * 100} className="step-item">
                <span className="step-number">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner image={images.cuisine} title={t.ctaTitle} text={t.ctaText} />
    </>
  );
}

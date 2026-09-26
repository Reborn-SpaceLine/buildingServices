import { Link } from 'react-router-dom';
import { Wrench, Settings, Shield, Clock, CheckCircle, Phone, Building2, Hammer, Paintbrush, Zap, Users } from 'lucide-react';
import { PageHero, Reveal, SectionIntro, CtaBanner } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { useUi } from '../i18n/context';
import '../styles/pages.css';

const planIcons = [Wrench, Settings, Shield, Clock];
const partnerIcons = [Building2, Hammer, Paintbrush, Zap, Users];
const FEATURED_PLAN = 2; // « Contrat de maintenance »

export function MaintenancePage() {
  const ui = useUi();
  const t = ui.maintenance;
  usePageTitle(t.title);

  return (
    <>
      <PageHero eyebrow={t.title} title={t.heroTitle} text={t.heroText} image={images.installation} />

      <section className="section">
        <div className="container">
          <SectionIntro eyebrow={t.plansEyebrow} title={t.plansTitle} text={t.plansText} />
          <div className="pricing-grid">
            {t.plans.map((plan, i) => {
              const Icon = planIcons[i];
              const featured = i === FEATURED_PLAN;
              return (
                <Reveal key={plan.title} delay={i * 80} className={`pricing-card ${featured ? 'featured' : ''}`}>
                  {featured && <span className="pricing-flag">{t.mostChosen}</span>}
                  <span className="pricing-icon"><Icon /></span>
                  <h3>{plan.title}</h3>
                  <p className="pricing-desc">{plan.description}</p>
                  <p className="pricing-price">{plan.price}</p>
                  <ul>
                    {plan.features.map(feature => (
                      <li key={feature}><CheckCircle size={18} /> {feature}</li>
                    ))}
                  </ul>
                  <Link to="/contact?service=maintenance" className={`btn ${featured ? 'btn-primary' : 'btn-dark'}`}>
                    <Phone /> {ui.common.requestQuote}
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section soft-band">
        <div className="container">
          <SectionIntro eyebrow={t.partnersEyebrow} title={t.partnersTitle} text={t.partnersText} />
          <div className="partners-row">
            {t.partners.map((partner, i) => {
              const Icon = partnerIcons[i];
              return (
                <Reveal key={partner.name} className="partner-tile">
                  <Icon />
                  <strong>{partner.name}</strong>
                  <span>{partner.description}</span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBanner image={images.ploberie} title={t.ctaTitle} text={t.ctaText} button={t.ctaButton} to="/contact?service=maintenance" />
    </>
  );
}

import { PageHero, Reveal, SectionIntro, CtaBanner } from '../components/ui';
import { ServiceCard } from '../components/Cards';
import { usePageTitle } from '../lib/usePageTitle';
import { images, services, servicesByCategory, processSteps } from '../data/site';
import '../styles/pages.css';

export function ServicesPage() {
  usePageTitle('Nos services');

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Tous les corps de métier, un seul interlocuteur."
        text={`Plans d’architecture, construction, installations, finitions et aménagement : ${services.length} savoir-faire coordonnés par une seule équipe, pour un projet clés en main.`}
        image={images.services2}
      />

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
          <SectionIntro
            eyebrow="Comment ça marche"
            title="Trois étapes, zéro surprise."
            text="Chaque projet suit la même méthode éprouvée, pour que vous gardiez le contrôle du début à la fin."
          />
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

      <CtaBanner
        image={images.cuisine}
        title="Un projet en tête ? Parlons-en."
        text="Décrivez-nous votre besoin : nous revenons vers vous rapidement avec une première estimation et une proposition de rendez-vous."
      />
    </>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import { PageHero, Reveal, SectionIntro, Counter, CtaBanner } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { images, stats, values } from '../data/site';
import '../styles/pages.css';

export function AboutPage() {
  usePageTitle('À propos');

  return (
    <>
      <PageHero
        eyebrow="À propos"
        title="Bâtir au Cameroun selon les meilleurs standards."
        text="Découvrez l’histoire, l’équipe et les valeurs qui font de Building Service votre partenaire de confiance."
        image={images.work}
      />

      <section className="section">
        <div className="container split">
          <Reveal>
            <span className="eyebrow">Qui sommes-nous ?</span>
            <h2 className="split-title">Transformer vos idées en <span className="highlight">espaces réels</span>.</h2>
            <p className="split-text">
              Fondée avec la passion de transformer les espaces de vie et de travail, Building Service est devenue une
              référence dans le domaine de la construction et de la rénovation. Notre équipe d’experts qualifiés met son
              savoir-faire au service de vos projets les plus ambitieux.
            </p>
            <p className="split-text">
              De l’architecture d’intérieur à la menuiserie sur mesure, en passant par le staff, la peinture décorative,
              la plomberie et le carrelage, nous couvrons tous les aspects de l’aménagement pour vous offrir un service
              complet et personnalisé.
            </p>
            <div className="mission-box">
              <h3>Notre mission</h3>
              <p>
                Créer des espaces uniques qui reflètent votre personnalité et répondent à vos besoins, tout en respectant
                votre budget et vos délais.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="about-gallery">
            <img src={images.about} alt="Chantier Building Service" loading="lazy" />
            <img src={images.interieur} alt="Intérieur aménagé" loading="lazy" />
            <img src={images.salon} alt="Salon rénové" loading="lazy" />
            <img src={images.cuisine} alt="Cuisine sur mesure" loading="lazy" />
            <div className="about-badge">
              <Award />
              <div>
                <strong>10+</strong>
                <span>années d’expertise</span>
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
          <SectionIntro
            eyebrow="Nos valeurs"
            title="Ce qui guide chacun de nos engagements."
            text="Six principes simples, appliqués sur chaque chantier, quelle que soit sa taille."
          />
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
              Travailler avec nous <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <CtaBanner
        image={images.renovation}
        title="Parlons de votre projet."
        text="Un premier rendez-vous gratuit et sans engagement pour comprendre vos besoins et vous proposer la meilleure solution."
      />
    </>
  );
}

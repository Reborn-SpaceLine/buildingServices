import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal, SectionIntro, Counter, Marquee, Accordion, CtaBanner } from '../components/ui';
import { ServiceCard, ProjectCard } from '../components/Cards';
import { HomeHero } from '../components/HomeHero';
import { MediaList } from '../components/Media';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { images, services, servicesByCategory, projects, stats, reasons, processSteps, faq, featuredVideos } from '../data/site';
import { serviceIcon } from '../content/icons';
import '../styles/home.css';

// Mosaïque des services : pleine largeur, puis deux demi-cartes, et on recommence
const isFullWidth = (index: number) => index % 3 === 0;

const featured = services.filter(s => s.featured);
// Vidéos mises en avant d'abord, puis celles des projets et services
const latestVideos = [...featuredVideos, ...projects.flatMap(p => p.videos), ...services.flatMap(s => s.videos)].filter(v => v.url).slice(0, 3);

export function Home() {
  usePageTitle('');

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
          <SectionIntro
            eyebrow="Nos services"
            title="Du plan d’architecte à la dernière finition."
            text={`${services.length} corps de métier coordonnés par une seule équipe : vous avez un interlocuteur unique, un planning clair et un résultat clés en main.`}
          />
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
          <SectionIntro
            eyebrow="Nos réalisations"
            onDark
            title="Des chantiers livrés, des clients satisfaits."
            text="Maisons, appartements, bureaux : chaque projet est documenté pour vous montrer notre méthode et la qualité de nos finitions, dans le respect de la vie privée de nos clients."
          />
          <div className="projects-grid">
            {projects.slice(0, 6).map((project, i) => (
              <Reveal key={project.slug} delay={(i % 3) * 100}>
                <ProjectCard project={project} variant="glass" />
              </Reveal>
            ))}
          </div>
          <div className="projects-dark-cta">
            <Link to="/realisations" className="btn btn-light">
              Voir toutes nos réalisations <ArrowRight />
            </Link>
          </div>
        </div>

        {/* 4. Chiffres qui chevauchent le bloc sombre */}
        <Reveal className="stats-card">
          <div className="stats-intro">
            <span className="eyebrow">En chiffres</span>
            <h2>Une confiance qui se mesure.</h2>
            <p>Des années de chantiers, des centaines de clients : notre expérience est votre meilleure garantie.</p>
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
          <SectionIntro
            eyebrow="Pourquoi nous ?"
            title="L’exigence du détail, la sérénité en plus."
            text="Choisir Building Service, c’est confier son projet à une équipe qui planifie, informe et tient ses engagements."
          />
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
      <CtaBanner
        image={images.carousel}
        title="Prêt à concrétiser votre projet ?"
        text="Échangez 30 minutes avec l’un de nos conseillers. Gratuit et sans engagement, cet appel nous permet de comprendre vos besoins et de préparer votre devis."
      />

      {/* 7. Process */}
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Notre méthode"
            title="Trois étapes, zéro surprise."
            text="Vous savez toujours où en est votre projet : de la première rencontre à la remise des clés, chaque étape est validée avec vous."
          />
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
            <SectionIntro
              eyebrow="En vidéo"
              title="Nos chantiers en images."
              text="Suivez nos réalisations sur les réseaux sociaux : avant/après, étapes de chantier et conseils."
            />
            <MediaList videos={latestVideos} />
            <div className="center-actions">
              <Link to="/videos" className="btn btn-dark">Toutes les vidéos <ArrowRight /></Link>
            </div>
          </div>
        </section>
      )}

      {/* 8. FAQ */}
      <section id="contact" className="section faq-section">
        <div className="container faq-layout">
          <Reveal className="faq-intro">
            <span className="eyebrow">Questions fréquentes</span>
            <h2>Vos questions, nos réponses.</h2>
            <p>Un projet réussi commence par des réponses claires. Vous ne trouvez pas la vôtre ? Écrivez-nous.</p>
            <Link to="/contact" className="btn btn-dark">
              Nous contacter <ArrowRight />
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

import { Link, useParams } from 'react-router-dom';
import { CheckCircle, CalendarDays, FileText, ArrowRight } from 'lucide-react';
import { PageHero, Reveal, SectionIntro } from '../components/ui';
import { ProjectCard, ServiceCard } from '../components/Cards';
import { MediaList, ShareButtons } from '../components/Media';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { services, projects, findService, whatsappLink } from '../data/site';
import { NotFound } from './NotFound';
import '../styles/pages.css';

export function ServiceDetail() {
  const { slug } = useParams();
  const service = findService(slug);
  usePageTitle(service?.title ?? 'Service introuvable');

  if (!service) return <NotFound />;

  const related = projects.filter(p => p.service === service.slug);
  const sameCategory = services.filter(s => s.slug !== service.slug && s.category === service.category);
  const others = (sameCategory.length >= 3 ? sameCategory : [...sameCategory, ...services.filter(s => s.slug !== service.slug && s.category !== service.category)]).slice(0, 3);
  const hasVideos = service.videos.some(v => v.url);

  return (
    <>
      <PageHero eyebrow={service.category} title={service.title} text={service.short} image={service.image} />

      <section className="section">
        <div className="container detail-layout">
          <Reveal className="detail-main">
            <h2>Ce que nous faisons</h2>
            <p className="split-text">{service.intro}</p>

            <ul className="check-list">
              {service.features.map(feature => (
                <li key={feature}><CheckCircle /> {feature}</li>
              ))}
            </ul>

            <h2>Déroulement</h2>
            <ol className="timeline">
              {service.steps.map((step, i) => (
                <li key={step}>
                  <span>{i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>

            {hasVideos && (
              <>
                <h2>En vidéo</h2>
                <MediaList videos={service.videos} />
              </>
            )}

            <div className="detail-share"><ShareButtons title={service.title} /></div>
          </Reveal>

          <Reveal delay={120}>
            <aside className="detail-aside">
              <SafeImage src={service.image} alt={service.title} />
              <h3>Un projet de {service.title.toLowerCase()} ?</h3>
              <p>Devis gratuit et sans engagement, établi après un premier échange.</p>
              <Link to={`/contact?service=${service.slug}`} className="btn btn-primary">
                Demander un devis <FileText />
              </Link>
              <Link to="/rdv" className="btn btn-outline">
                Prendre RDV <CalendarDays />
              </Link>
              <a
                href={whatsappLink(`Bonjour Building Service, je souhaite un devis pour : ${service.title}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="aside-whatsapp"
              >
                Écrire sur WhatsApp
              </a>
            </aside>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section soft-band">
          <div className="container">
            <SectionIntro eyebrow="Réalisations" title={`Nos projets : ${service.title.toLowerCase()}`} />
            <div className="cards-grid-3">
              {related.map(project => (
                <Reveal key={project.slug}><ProjectCard project={project} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <SectionIntro eyebrow="À découvrir aussi" title="Services complémentaires" />
          <div className="cards-grid-3">
            {others.map(s => (
              <Reveal key={s.slug}><ServiceCard service={s} /></Reveal>
            ))}
          </div>
          <div className="center-actions">
            <Link to="/services" className="btn btn-dark">
              Tous nos services <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

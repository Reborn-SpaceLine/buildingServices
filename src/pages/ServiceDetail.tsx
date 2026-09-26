import { Link, useParams } from 'react-router-dom';
import { CheckCircle, CalendarDays, FileText, ArrowRight } from 'lucide-react';
import { PageHero, Reveal, SectionIntro } from '../components/ui';
import { ProjectCard, ServiceCard } from '../components/Cards';
import { MediaList, ShareButtons } from '../components/Media';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { useSite, useUi } from '../i18n/context';
import { NotFound } from './NotFound';
import '../styles/pages.css';

export function ServiceDetail() {
  const { slug } = useParams();
  const ui = useUi();
  const t = ui.serviceDetail;
  const { services, projects, findService, categoryLabel, whatsappLink } = useSite();
  const service = findService(slug);
  usePageTitle(service?.title ?? t.notFound);

  if (!service) return <NotFound />;

  const related = projects.filter(p => p.service === service.slug);
  const sameCategory = services.filter(s => s.slug !== service.slug && s.category === service.category);
  const others = (sameCategory.length >= 3 ? sameCategory : [...sameCategory, ...services.filter(s => s.slug !== service.slug && s.category !== service.category)]).slice(0, 3);
  const hasVideos = service.videos.some(v => v.url);

  return (
    <>
      <PageHero eyebrow={categoryLabel(service.category)} title={service.title} text={service.short} image={service.image} />

      <section className="section">
        <div className="container detail-layout">
          <Reveal className="detail-main">
            <h2>{t.whatWeDo}</h2>
            <p className="split-text">{service.intro}</p>

            <ul className="check-list">
              {service.features.map(feature => (
                <li key={feature}><CheckCircle /> {feature}</li>
              ))}
            </ul>

            <h2>{t.process}</h2>
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
                <h2>{t.inVideo}</h2>
                <MediaList videos={service.videos} />
              </>
            )}

            <div className="detail-share"><ShareButtons title={service.title} /></div>
          </Reveal>

          <Reveal delay={120}>
            <aside className="detail-aside">
              <SafeImage src={service.image} alt={service.title} />
              <h3>{t.asideTitle(service.title)}</h3>
              <p>{t.asideText}</p>
              <Link to={`/contact?service=${service.slug}`} className="btn btn-primary">
                {ui.common.requestQuote} <FileText />
              </Link>
              <Link to="/rdv" className="btn btn-outline">
                {ui.nav.appointment} <CalendarDays />
              </Link>
              <a href={whatsappLink(t.whatsappMessage(service.title))} target="_blank" rel="noopener noreferrer" className="aside-whatsapp">
                {ui.common.writeWhatsapp}
              </a>
            </aside>
          </Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section soft-band">
          <div className="container">
            <SectionIntro eyebrow={t.relatedEyebrow} title={t.relatedTitle(service.title)} />
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
          <SectionIntro eyebrow={t.othersEyebrow} title={t.othersTitle} />
          <div className="cards-grid-3">
            {others.map(s => (
              <Reveal key={s.slug}><ServiceCard service={s} /></Reveal>
            ))}
          </div>
          <div className="center-actions">
            <Link to="/services" className="btn btn-dark">
              {t.allServices} <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

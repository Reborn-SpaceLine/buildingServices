import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Calendar, Tag, UserRound, Clock, Ruler, ArrowLeft, ArrowRight, Expand, FileText } from 'lucide-react';
import { PageHero, Reveal, Lightbox } from '../components/ui';
import { MediaList, ShareButtons } from '../components/Media';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { projects, findService } from '../data/site';
import { NotFound } from './NotFound';
import '../styles/pages.css';

export function RealizationDetail() {
  const { slug } = useParams();
  const index = projects.findIndex(p => p.slug === slug);
  const project = projects[index];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  usePageTitle(project?.title ?? 'Projet introuvable');

  if (!project) return <NotFound />;

  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const service = findService(project.service);
  const steps = project.steps.filter(s => s.title || s.text);

  // Toutes les photos du projet (galerie + étapes) dans la visionneuse
  const allImages = [...project.gallery, ...steps.map(s => s.image)].filter((src, i, arr) => src && arr.indexOf(src) === i);
  const openImage = (src: string) => setLightboxIndex(allImages.indexOf(src));

  const facts = [
    { icon: UserRound, label: 'Client', value: project.client.label },
    { icon: Tag, label: 'Service', value: service?.title },
    { icon: MapPin, label: 'Lieu', value: project.location },
    { icon: Calendar, label: 'Année', value: project.year },
    { icon: Clock, label: 'Durée', value: project.duration },
    { icon: Ruler, label: 'Surface', value: project.surface },
  ].filter(f => f.value);

  return (
    <>
      <PageHero eyebrow="Réalisation" title={project.title} text={project.description} image={project.image} />

      <section className="section">
        <div className="container detail-layout">
          <Reveal className="detail-main">
            <div className="gallery">
              {project.gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  className={`gallery-item ${i === 0 ? 'main' : ''}`}
                  onClick={() => openImage(src)}
                  aria-label={`Agrandir la photo ${i + 1}`}
                >
                  <SafeImage src={src} alt={`${project.title} – photo ${i + 1}`} />
                  <span className="gallery-zoom"><Expand size={18} /></span>
                </button>
              ))}
            </div>

            <h2>Le projet</h2>
            <p className="split-text">{project.details}</p>

            {steps.length > 0 && (
              <>
                <h2>Le chantier, étape par étape</h2>
                <ol className="journal">
                  {steps.map((step, i) => (
                    <li key={i} className="journal-step">
                      <span className="journal-index">{i + 1}</span>
                      <div className="journal-body">
                        <h3>{step.title}</h3>
                        {step.text && <p>{step.text}</p>}
                        {step.image && (
                          <button className="journal-image" onClick={() => openImage(step.image)} aria-label={`Agrandir la photo de l’étape ${i + 1}`}>
                            <img src={step.image} alt={step.title} loading="lazy" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {project.videos.some(v => v.url) && (
              <>
                <h2>En vidéo</h2>
                <MediaList videos={project.videos} />
              </>
            )}

            <div className="detail-share"><ShareButtons title={project.title} /></div>
          </Reveal>

          <Reveal delay={120}>
            <aside className="detail-aside">
              <h3>Fiche projet</h3>
              <ul className="facts">
                {facts.map(fact => (
                  <li key={fact.label}><fact.icon size={18} /><span>{fact.label}</span><strong>{fact.value}</strong></li>
                ))}
              </ul>
              <Link to={`/contact?service=${project.service}`} className="btn btn-primary">
                Un projet similaire ? <FileText />
              </Link>
              {service && (
                <Link to={`/services/${service.slug}`} className="btn btn-outline">
                  Voir le service
                </Link>
              )}
            </aside>
          </Reveal>
        </div>

        {projects.length > 1 && (
          <div className="container project-pager">
            <Link to={`/realisations/${prev.slug}`}><ArrowLeft size={18} /> {prev.title}</Link>
            <Link to="/realisations" className="pager-all">Toutes les réalisations</Link>
            <Link to={`/realisations/${next.slug}`}>{next.title} <ArrowRight size={18} /></Link>
          </div>
        )}
      </section>

      <Lightbox
        images={allImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </>
  );
}

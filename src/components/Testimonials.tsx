import { Link } from 'react-router-dom';
import { Star, Quote, ArrowRight, ExternalLink } from 'lucide-react';
import { Reveal, SectionIntro } from './ui';
import { useSite, useUi } from '../i18n/context';
import '../styles/testimonials.css';

function Stars({ rating, label }: { rating: number; label: string }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="t-stars" role="img" aria-label={label}>
      {Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} className={i < value ? 'on' : ''} aria-hidden="true" />)}
    </span>
  );
}

/** Avis clients (publiés avec accord) + lien vers les avis Google. Rien ne s'affiche s'il n'y a ni l'un ni l'autre. */
export function Testimonials() {
  const t = useUi().testimonials;
  const { testimonials, projects, company } = useSite();
  const google = company.googleReviewsUrl?.trim();

  if (testimonials.length === 0 && !google) return null;

  return (
    <section className="section">
      <div className="container">
        <SectionIntro eyebrow={t.eyebrow} title={t.title} text={t.text} />

        {testimonials.length > 0 && (
          <div className="t-grid">
            {testimonials.map((item, i) => {
              const project = projects.find(p => p.slug === item.project);
              return (
                <Reveal key={item.id} delay={(i % 3) * 80} className="t-card">
                  <Quote className="t-quote" aria-hidden="true" />
                  <Stars rating={item.rating} label={t.rating(item.rating)} />
                  <blockquote>{item.text}</blockquote>
                  <footer>
                    <strong>{item.name}</strong>
                    {item.role && <span>{item.role}</span>}
                    {project && (
                      <Link to={`/realisations/${project.slug}`} className="t-project">
                        {t.seeProject} <ArrowRight size={14} />
                      </Link>
                    )}
                  </footer>
                </Reveal>
              );
            })}
          </div>
        )}

        {google && (
          <div className="center-actions t-google">
            <a href={google} target="_blank" rel="noopener noreferrer" className="btn btn-dark">
              {t.google} <ExternalLink />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

import { useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PageHero, Reveal, CtaBanner } from '../components/ui';
import { ProjectCard } from '../components/Cards';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { useSite, useUi } from '../i18n/context';
import '../styles/pages.css';

export function RealizationsPage() {
  const t = useUi().realizations;
  const { projects, projectFilters } = useSite();
  usePageTitle(t.title);
  const [params, setParams] = useSearchParams();
  const active = params.get('service') ?? 'tous';
  const visible = active === 'tous' ? projects : projects.filter(p => p.service === active);

  const select = (slug: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (slug === 'tous') next.delete('service');
      else next.set('service', slug);
      return next;
    }, { replace: true });
  };

  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} text={t.heroText} image={images.salon} />

      <section className="section">
        <div className="container">
          <div className="filter-bar" role="tablist" aria-label={t.filterLabel}>
            {projectFilters.map(filter => {
              const count = filter.slug === 'tous' ? projects.length : projects.filter(p => p.service === filter.slug).length;
              return (
                <button
                  key={filter.slug}
                  role="tab"
                  aria-selected={active === filter.slug}
                  className={`filter-chip ${active === filter.slug ? 'active' : ''}`}
                  onClick={() => select(filter.slug)}
                >
                  {filter.title} <span>{count}</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="empty-state">{t.empty}</p>
          ) : (
            <div className="cards-grid-3">
              {visible.map((project, i) => (
                <Reveal key={project.slug} delay={(i % 3) * 80}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          )}

          <p className="privacy-note">
            <ShieldCheck size={18} />
            {t.privacy}
          </p>
        </div>
      </section>

      <CtaBanner image={images.chambre} title={t.ctaTitle} text={t.ctaText} />
    </>
  );
}

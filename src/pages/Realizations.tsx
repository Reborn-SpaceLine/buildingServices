import { useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PageHero, Reveal, CtaBanner } from '../components/ui';
import { ProjectCard } from '../components/Cards';
import { usePageTitle } from '../lib/usePageTitle';
import { images, projects, projectFilters } from '../data/site';
import '../styles/pages.css';

export function RealizationsPage() {
  usePageTitle('Nos réalisations');
  const [params, setParams] = useSearchParams();
  const active = params.get('service') ?? 'tous';
  const visible = active === 'tous' ? projects : projects.filter(p => p.service === active);

  const select = (slug: string) => {
    setParams(slug === 'tous' ? {} : { service: slug }, { replace: true });
  };

  return (
    <>
      <PageHero
        eyebrow="Réalisations"
        title="Notre savoir-faire, chantier après chantier."
        text="Des plans à la remise des clés, découvrez une sélection de projets réalisés à Yaoundé, Douala et partout au Cameroun."
        image={images.salon}
      />

      <section className="section">
        <div className="container">
          <div className="filter-bar" role="tablist" aria-label="Filtrer par service">
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
            <p className="empty-state">Aucun projet publié dans cette catégorie pour le moment.</p>
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
            Nous respectons la vie privée de nos clients : leur nom n’est publié qu’avec leur accord, et aucune adresse précise n’est communiquée.
          </p>
        </div>
      </section>

      <CtaBanner
        image={images.chambre}
        title="Votre projet, notre prochaine réalisation."
        text="Chaque projet est unique. Contactez-nous pour discuter de vos idées et obtenir un devis personnalisé."
      />
    </>
  );
}

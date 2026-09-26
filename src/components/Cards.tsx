import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Calendar, UserRound, CirclePlay } from 'lucide-react';
import type { Project, Service } from '../data/site';
import { serviceIcon } from '../content/icons';
import { useSite, useUi } from '../i18n/context';
import { SafeImage } from './SafeImage';
import '../styles/cards.css';

export function ServiceCard({ service, layout = 'vertical' }: { service: Service; layout?: 'vertical' | 'horizontal' }) {
  const ui = useUi();
  const Icon = serviceIcon(service.icon);
  return (
    <Link to={`/services/${service.slug}`} className={`service-card ${layout}`}>
      <div className="service-card-text">
        <span className="service-card-icon"><Icon /></span>
        <h3>{service.title}</h3>
        <p>{service.short}</p>
        <span className="service-card-link">
          {ui.common.discover} <ArrowRight size={16} />
        </span>
      </div>
      <div className="service-card-media">
        <SafeImage src={service.image} alt={service.title} />
      </div>
    </Link>
  );
}

export function ProjectCard({ project, variant = 'light' }: { project: Project; variant?: 'light' | 'glass' }) {
  const ui = useUi();
  const { serviceTitle } = useSite();
  const hasVideo = project.videos.some(v => v.url);
  return (
    <article className={`project-card ${variant}`}>
      <Link to={`/realisations/${project.slug}`} className="project-card-media">
        <SafeImage src={project.image} alt={project.title} />
        <span className="project-card-badge">{serviceTitle(project.service)}</span>
        {hasVideo && <span className="project-card-video" aria-label={ui.common.videoAvailable}><CirclePlay size={18} /></span>}
      </Link>
      <div className="project-card-body">
        <h3>{project.title}</h3>
        <p className="project-card-client"><UserRound size={14} /> {ui.common.client}{ui.locale.startsWith('fr') ? ' :' : ':'} <strong>{project.client.label}</strong></p>
        <p>{project.description}</p>
        <div className="project-card-meta">
          <span><MapPin size={14} /> {project.location}</span>
          <span><Calendar size={14} /> {project.year}</span>
        </div>
        <Link to={`/realisations/${project.slug}`} className="btn btn-sm project-card-btn">
          {ui.common.seeProject} <ArrowRight />
        </Link>
      </div>
    </article>
  );
}

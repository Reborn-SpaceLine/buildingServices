import type { Project, ProjectClient, SiteContent } from './types';

/** Initiales à partir d'un nom : « Jean Mbarga » → « J. M. » */
export function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(part => `${part[0].toUpperCase()}.`)
    .join(' ');
}

/** Libellé affiché publiquement selon le niveau de confidentialité choisi */
export function publicClientLabel(client: ProjectClient) {
  const name = client.name?.trim();
  if (client.visibility === 'public' && name) return name;
  if (client.visibility === 'initiales' && name) return `Client ${initials(name)}`;
  return client.label?.trim() || 'Client privé';
}

/** Version publiable d'un projet : sans nom réel ni notes internes */
export function toPublicProject(project: Project): Project {
  return {
    ...project,
    client: {
      visibility: project.client.visibility,
      label: publicClientLabel(project.client),
    },
  };
}

/** Contenu publiable : brouillons retirés, données clients anonymisées */
export function toPublicContent(content: SiteContent): SiteContent {
  return {
    ...content,
    projects: content.projects.filter(p => p.published).map(toPublicProject),
  };
}

// Confidentialité des clients : partagé entre le site (TypeScript), l'admin et le serveur Node.
// Aucun nom réel, aucune note interne, aucun brouillon ne doit sortir de ces fonctions.

/** Initiales à partir d'un nom : « Jean Mbarga » → « J. M. » */
export function initials(name) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(part => `${part[0].toUpperCase()}.`)
    .join(' ');
}

/** Libellé affiché publiquement selon le niveau de confidentialité choisi */
export function publicClientLabel(client) {
  const name = client.name?.trim();
  if (client.visibility === 'public' && name) return name;
  if (client.visibility === 'initiales' && name) return `Client ${initials(name)}`;
  return client.label?.trim() || 'Client privé';
}

/** Version publiable d'un projet : sans nom réel ni notes internes */
export function toPublicProject(project) {
  return {
    ...project,
    client: {
      visibility: project.client.visibility,
      label: publicClientLabel(project.client),
    },
  };
}

/** Un avis n'est publié qu'avec l'accord du client ET la case « publier » */
export const isPublicTestimonial = (t) => Boolean(t.published && t.consent);

/** Contenu publiable : brouillons retirés, données clients anonymisées, avis sans accord retirés */
export function toPublicContent(content) {
  return {
    ...content,
    projects: content.projects.filter(p => p.published).map(toPublicProject),
    testimonials: (content.testimonials ?? []).filter(isPublicTestimonial),
  };
}

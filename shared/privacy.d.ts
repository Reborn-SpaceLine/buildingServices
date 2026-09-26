import type { Project, ProjectClient, SiteContent } from '../src/content/types';

export function initials(name: string): string;
export function publicClientLabel(client: ProjectClient): string;
export function toPublicProject(project: Project): Project;
export function toPublicContent(content: SiteContent): SiteContent;

import raw from './content.json';
import type { SiteContent } from './types';

/** Contenu publié. Modifié depuis /admin (npm run dev), puis livré avec le site au build. */
export const content = raw as unknown as SiteContent;

export type * from './types';

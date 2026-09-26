import bundled from './content.json';
import type { SiteContent } from './types';

/**
 * Contenu du site.
 * Au démarrage, il est chargé depuis le serveur (/api/content) : les modifications faites dans l'admin
 * sont visibles sans reconstruire le site. La copie intégrée au build ne sert que de secours.
 */
let current = bundled as unknown as SiteContent;

export function getContent(): SiteContent {
  return current;
}

/** Charge le contenu à jour (abandonne après 4 s et garde la copie intégrée) */
export async function loadContent() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/content', { cache: 'no-store', signal: controller.signal });
    if (res.ok) current = await res.json();
  } catch {
    /* hors ligne ou hébergement sans serveur : copie intégrée */
  } finally {
    clearTimeout(timer);
  }
}

export type * from './types';

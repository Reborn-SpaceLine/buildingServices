import bundled from './content.json';
import type { SiteContent } from './types';

/**
 * Contenu du site.
 * Au démarrage, il est chargé depuis le serveur (/api/content) : les modifications faites dans l'admin
 * sont visibles sans reconstruire le site. La copie intégrée au build ne sert que de secours.
 */
let current = bundled as unknown as SiteContent;

/** Aperçu avant publication : l'admin dépose le contenu (déjà filtré) ici, puis ouvre /?preview=1 */
export const PREVIEW_KEY = 'bs-preview-content';
const PREVIEW_FLAG = 'bs-preview';
let previewing = false;

export function getContent(): SiteContent {
  return current;
}

export function isPreview() {
  return previewing;
}

/** Quitte l'aperçu et recharge le contenu publié */
export function exitPreview() {
  try { sessionStorage.removeItem(PREVIEW_FLAG); } catch { /* stockage indisponible */ }
  window.location.replace(window.location.pathname);
}

/** Contenu d'aperçu, conservé pour tout l'onglet (la navigation perd le ?preview=1) */
function readPreview(): SiteContent | null {
  try {
    if (new URLSearchParams(window.location.search).has('preview')) sessionStorage.setItem(PREVIEW_FLAG, '1');
    if (sessionStorage.getItem(PREVIEW_FLAG) !== '1') return null;
    const raw = localStorage.getItem(PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as SiteContent) : null;
  } catch {
    return null;
  }
}

/** Charge le contenu à jour (abandonne après 4 s et garde la copie intégrée) */
export async function loadContent() {
  const preview = readPreview();
  if (preview) {
    current = preview;
    previewing = true;
    return;
  }
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

import { isPreview } from '../content';

/**
 * Signale une page vue au serveur (statistiques sans cookie, voir server/stats.js).
 * Rien n'est envoyé si le visiteur a demandé à ne pas être suivi, ni pendant un aperçu de l'admin.
 */
let firstHit = true;

export function trackPageView(path: string, lang: string) {
  if (isPreview() || import.meta.env.DEV) return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return;
  // La source (site d'origine) n'a de sens que pour la première page de la visite
  const entry = firstHit;
  firstHit = false;
  const body = JSON.stringify({ path, lang, entry, referrer: entry ? document.referrer : '' });
  try {
    if (!navigator.sendBeacon?.('/api/stats', body)) {
      void fetch('/api/stats', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* statistiques facultatives : aucune erreur visible */
  }
}

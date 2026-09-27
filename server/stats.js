// Statistiques de visite respectueuses de la vie privée.
// - aucun cookie, aucun service extérieur, rien n'est envoyé à Google ou autre ;
// - aucune adresse IP enregistrée : un visiteur est reconnu seulement pendant la journée, par une empreinte
//   (IP + navigateur + sel aléatoire du jour) gardée en mémoire puis oubliée à minuit ;
// - « Ne pas me suivre » (Do Not Track / Global Privacy Control) est respecté ;
// - seuls des totaux par jour sont conservés : pages vues, sources, type d'appareil, langue.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const KEEP_DAYS = 400;
const FLUSH_MS = 60 * 1000;
const MAX_KEYS = 200;                 // pages / sources différentes gardées par jour
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|curl|wget|python|node-fetch|axios/i;

const dayOf = (date = new Date()) => date.toISOString().slice(0, 10);

/** Type d'appareil déduit du navigateur (sans rien garder d'autre) */
export function deviceOf(ua = '') {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'tablette';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'ordinateur';
}

/** Source d'une visite : nom du site d'origine, sans le chemin ni les paramètres */
export function sourceOf(referrer, ownHost) {
  if (typeof referrer !== 'string' || !referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (!host || host === ownHost) return null; // navigation interne : pas une nouvelle source
    return host;
  } catch {
    return 'direct';
  }
}

/** Chemin nettoyé : pas de paramètres (ils peuvent contenir des données personnelles) */
export function cleanPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  const pathname = value.split(/[?#]/)[0].slice(0, 120);
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) return null;
  return pathname.replace(/\/+$/, '') || '/';
}

const bump = (map, key) => {
  if (key in map || Object.keys(map).length < MAX_KEYS) map[key] = (map[key] ?? 0) + 1;
  else map['(autres)'] = (map['(autres)'] ?? 0) + 1;
};

export function createStats({ privateDir }) {
  const file = path.join(privateDir, 'statistiques.json');
  let data = null;               // { days: { 'AAAA-MM-JJ': Day } }
  let dirty = false;
  let salt = { day: '', value: '' };
  let seen = new Set();          // empreintes du jour, en mémoire seulement

  const load = async () => {
    if (data) return data;
    try {
      data = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      data = { days: {} };
    }
    return data;
  };

  const flush = async () => {
    if (!dirty || !data) return;
    dirty = false;
    const cutoff = dayOf(new Date(Date.now() - KEEP_DAYS * 86400000));
    for (const day of Object.keys(data.days)) if (day < cutoff) delete data.days[day];
    await fs.mkdir(privateDir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data), 'utf8');
    await fs.rename(tmp, file);
  };

  const timer = setInterval(() => flush().catch(e => console.error('[stats]', e)), FLUSH_MS);
  timer.unref?.();

  /** Enregistre une page vue. Renvoie false si la visite est ignorée (robot, refus du suivi…) */
  async function hit({ path: rawPath, referrer, entry, lang, ip, ua, host, dnt }) {
    if (dnt || BOTS.test(ua ?? '') || !ua) return false;
    const page = cleanPath(rawPath);
    if (!page) return false;

    const today = dayOf();
    if (salt.day !== today) {
      // Nouveau jour : nouveau sel, les empreintes d'hier sont oubliées
      salt = { day: today, value: crypto.randomBytes(16).toString('hex') };
      seen = new Set();
    }
    const fingerprint = crypto.createHash('sha256').update(`${salt.value}|${ip}|${ua}`).digest('hex').slice(0, 16);

    const store = await load();
    const day = (store.days[today] ??= { views: 0, visitors: 0, pages: {}, sources: {}, devices: {}, langs: {} });
    day.views += 1;
    bump(day.pages, page);
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      day.visitors += 1;
      bump(day.devices, deviceOf(ua));
      bump(day.langs, lang === 'en' ? 'en' : 'fr');
    }
    // Source : seulement pour la première page d'une visite (les suivantes n'ont pas de site d'origine)
    const source = entry ? sourceOf(referrer, host) : null;
    if (source) bump(day.sources, source);
    dirty = true;
    return true;
  }

  /** Totaux des `days` derniers jours, pour l'admin */
  async function summary(days = 30) {
    const store = await load();
    const span = Math.min(Math.max(1, Math.floor(days)), KEEP_DAYS);
    const list = [];
    const totals = { views: 0, visitors: 0, pages: {}, sources: {}, devices: {}, langs: {} };
    const add = (target, source) => { for (const [k, v] of Object.entries(source ?? {})) target[k] = (target[k] ?? 0) + v; };
    for (let i = span - 1; i >= 0; i--) {
      const date = dayOf(new Date(Date.now() - i * 86400000));
      const day = store.days[date];
      list.push({ date, views: day?.views ?? 0, visitors: day?.visitors ?? 0 });
      if (!day) continue;
      totals.views += day.views;
      totals.visitors += day.visitors;
      add(totals.pages, day.pages);
      add(totals.sources, day.sources);
      add(totals.devices, day.devices);
      add(totals.langs, day.langs);
    }
    const top = (map, n = 10) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
    return {
      days: list,
      views: totals.views,
      visitors: totals.visitors,
      pages: top(totals.pages),
      sources: top(totals.sources),
      devices: top(totals.devices),
      langs: top(totals.langs),
    };
  }

  return { hit, summary, flush };
}

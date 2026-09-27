// Serveur de production de Building Service (Node 22, aucune dépendance).
//
//   node server/index.js
//
// Variables d'environnement :
//   PORT            port d'écoute                              (défaut 8080)
//   HOST            adresse d'écoute                           (défaut 0.0.0.0)
//   DATA_DIR        données persistantes : contenu, médias,
//                   messages, mot de passe, sauvegardes        (défaut ./data)
//   DIST_DIR        site construit par `npm run build`         (défaut ./dist)
//   SEED_FILE       contenu initial au premier démarrage       (défaut ./src/content/content.json)
//   ADMIN_PASSWORD  mot de passe admin créé au premier démarrage s'il n'en existe aucun
//   SITE_URL        adresse publique, pour le sitemap          (ex. https://www.building-service.cm)
//   TRUST_PROXY     1 si le serveur est derrière un proxy / hébergeur (IP réelle via X-Forwarded-For)
//   MAX_UPLOAD_MB   taille maximale d'un envoi dans l'admin    (défaut 300)
//   BACKUP_HOUR     heure de la sauvegarde quotidienne         (défaut 3)
//   BACKUP_KEEP     nombre d'archives gardées sur le serveur   (défaut 14)
//   Alertes (Telegram, e-mail, WhatsApp, SMS) : voir server/notify.js et deploy/.env.example
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { createApi } from './api.js';
import { pageMeta, metaTags } from '../shared/seo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;

const PORT = Number(env.PORT ?? 8080);
const HOST = env.HOST ?? '0.0.0.0';
const DATA_DIR = path.resolve(root, env.DATA_DIR ?? 'data');
const DIST_DIR = path.resolve(root, env.DIST_DIR ?? 'dist');
const SEED_FILE = path.resolve(root, env.SEED_FILE ?? 'src/content/content.json');
const SITE_URL = (env.SITE_URL ?? '').replace(/\/$/, '');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');

const api = createApi({
  contentFile: path.join(DATA_DIR, 'content.json'),
  seedFile: SEED_FILE,
  privateDir: path.join(DATA_DIR, 'private'),
  uploadsDir: UPLOADS_DIR,
  // En production, le premier mot de passe vient de ADMIN_PASSWORD ; à défaut, uniquement depuis le serveur lui-même
  canSetup: isLocal,
  initialPassword: env.ADMIN_PASSWORD,
  trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
  maxUploadMb: Number(env.MAX_UPLOAD_MB ?? 300),
  siteUrl: SITE_URL,
});

/* =========================
   Fichiers statiques
   ========================= */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml']);
const gzipCache = new Map(); // chemin → { mtime, data }

/** Résout un chemin demandé à l'intérieur d'un dossier, sans jamais en sortir */
function safeJoin(baseDir, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const full = path.resolve(baseDir, `.${path.posix.normalize(`/${decoded}`)}`);
  return full === baseDir || full.startsWith(baseDir + path.sep) ? full : null;
}

async function fileStat(file) {
  try {
    const stat = await fsp.stat(file);
    return stat.isFile() ? stat : null;
  } catch {
    return null;
  }
}

function cacheControlFor(urlPath) {
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable'; // noms de fichiers versionnés
  if (urlPath.endsWith('.html') || urlPath === '/') return 'no-cache';
  return 'public, max-age=604800'; // images, médias : 7 jours
}

async function serveFile(req, res, file, stat, urlPath, status = 200) {
  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', cacheControlFor(urlPath));
  res.setHeader('Last-Modified', stat.mtime.toUTCString());
  res.setHeader('Accept-Ranges', 'bytes');

  if (status === 200 && req.headers['if-modified-since'] && new Date(req.headers['if-modified-since']) >= new Date(stat.mtime.toUTCString())) {
    res.statusCode = 304;
    res.end();
    return;
  }

  // Lecture partielle (vidéos : avance / retour rapide)
  const range = req.headers.range;
  if (range && status === 200) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      let start = match[1] ? Number(match[1]) : stat.size - Number(match[2]);
      let end = match[1] && match[2] ? Number(match[2]) : stat.size - 1;
      start = Math.max(0, start);
      end = Math.min(end, stat.size - 1);
      if (start > end) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${stat.size}`);
        res.end();
        return;
      }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', end - start + 1);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
  }

  res.statusCode = status;

  // Compression gzip des fichiers texte (gardée en mémoire tant que le fichier ne change pas)
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '') && stat.size > 1024) {
    let cached = gzipCache.get(file);
    if (!cached || cached.mtime !== stat.mtimeMs) {
      cached = { mtime: stat.mtimeMs, data: zlib.gzipSync(await fsp.readFile(file)) };
      gzipCache.set(file, cached);
    }
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Content-Length', cached.data.length);
    return res.end(req.method === 'HEAD' ? undefined : cached.data);
  }

  res.setHeader('Content-Length', stat.size);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

/* =========================
   Pages : HTML de l'application avec les balises de référencement de la page demandée
   (titre, description, aperçu de partage, versions FR/EN, données structurées)
   ========================= */
let indexCache = null; // { mtime, html }

async function renderPage(req, res, urlPath) {
  const file = path.join(DIST_DIR, 'index.html');
  const stat = await fileStat(file);
  if (!stat) {
    res.statusCode = 500;
    return res.end('Site non construit : lancez « npm run build ».');
  }
  if (!indexCache || indexCache.mtime !== stat.mtimeMs) {
    indexCache = { mtime: stat.mtimeMs, html: await fsp.readFile(file, 'utf8') };
  }

  const lang = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lang') === 'en' ? 'en' : 'fr';
  const meta = pageMeta(urlPath, lang, await api.publicContent(), SITE_URL);
  const html = indexCache.html
    .replace(/<!-- SEO:start -->[\s\S]*?<!-- SEO:end -->/, metaTags(meta))
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

  res.statusCode = meta.notFound ? 404 : 200;
  res.setHeader('Content-Type', MIME['.html']);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Vary', 'Accept-Encoding');
  if (/\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    res.setHeader('Content-Encoding', 'gzip');
    return res.end(req.method === 'HEAD' ? undefined : zlib.gzipSync(html));
  }
  return res.end(req.method === 'HEAD' ? undefined : html);
}

/* =========================
   robots.txt et sitemap.xml (générés à partir du contenu)
   ========================= */
function robotsTxt() {
  return [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /api/',
    SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml` : '',
  ].filter(Boolean).join('\n') + '\n';
}

async function sitemapXml() {
  const content = await api.publicContent();
  const base = SITE_URL || '';
  const pages = [
    '/', '/a-propos', '/services', '/realisations', '/videos', '/maintenance', '/contact', '/rdv',
    ...(content?.services ?? []).map(s => `/services/${s.slug}`),
    ...(content?.projects ?? []).map(p => `/realisations/${p.slug}`),
  ];
  const escape = (s) => s.replace(/&/g, '&amp;');
  const urls = pages.map(p => [
    '  <url>',
    `    <loc>${escape(base + p)}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="fr" href="${escape(base + p)}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escape(`${base}${p}?lang=en`)}"/>`,
    '  </url>',
  ].join('\n'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

/* =========================
   Serveur
   ========================= */
function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  try {
    const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;

    if (urlPath === '/healthz') {
      res.setHeader('Content-Type', 'text/plain');
      return res.end('ok');
    }

    if (await api.handle(req, res)) return;

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      return res.end();
    }

    if (urlPath === '/robots.txt') {
      res.setHeader('Content-Type', MIME['.txt']);
      return res.end(robotsTxt());
    }

    if (urlPath === '/sitemap.xml') {
      res.setHeader('Content-Type', MIME['.xml']);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(await sitemapXml());
    }

    // Médias envoyés depuis l'admin (dossier de données), puis ceux livrés avec le site
    if (urlPath.startsWith('/uploads/')) {
      const file = safeJoin(UPLOADS_DIR, urlPath.slice('/uploads/'.length));
      const stat = file && await fileStat(file);
      if (stat) return serveFile(req, res, file, stat, urlPath);
    }

    // Fichiers du site construit
    const file = safeJoin(DIST_DIR, urlPath);
    const stat = file && await fileStat(file);
    if (stat) return serveFile(req, res, file, stat, urlPath);

    // Fichier inexistant (image, script…) : 404 ; sinon page de l'application (routes React)
    if (path.extname(urlPath)) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    return renderPage(req, res, urlPath);
  } catch (error) {
    console.error('[serveur]', error);
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  }
});

server.requestTimeout = 10 * 60 * 1000; // envois de vidéos volumineuses
server.headersTimeout = 60 * 1000;

await api.init();
if (env.BACKUP_DISABLED !== '1') api.backups.schedule(); // sauvegarde quotidienne (voir server/backup.js)
server.listen(PORT, HOST, () => {
  console.log(`Building Service en ligne sur http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Données : ${DATA_DIR}`);
});

// Arrêt propre (docker stop, redéploiement)
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} reçu, arrêt du serveur…`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}

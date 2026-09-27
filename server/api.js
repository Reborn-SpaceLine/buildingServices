// API du site : contenu public, formulaires et administration.
// Utilisée par le serveur de production (server/index.js) et par `npm run dev` (admin-server.js),
// pour un comportement identique dans les deux cas. Aucune dépendance externe.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { toPublicContent, isPublicTestimonial } from '../shared/privacy.js';
import { notificationStatus, notifyNewMessage, broadcast } from './notify.js';
import { createBackups } from './backup.js';
import { createStats } from './stats.js';

const SESSION_TTL = 8 * 60 * 60 * 1000;          // session admin : 8 h d'inactivité
const MIN_PASSWORD = 8;
const MAX_BACKUPS = 30;
const MAX_MESSAGES = 2000;
const LOGIN_MAX_FAILURES = 5;                     // puis blocage…
const LOGIN_BLOCK_MS = 15 * 60 * 1000;            // …de 15 minutes
const MESSAGE_LIMIT = 5;                          // messages par adresse IP…
const MESSAGE_WINDOW_MS = 10 * 60 * 1000;         // …sur 10 minutes
const CLIENT_CODE_MIN = 12;                       // code d'accès à l'espace client
const TRACKING_MAX_FAILURES = 10;                 // codes erronés par adresse IP avant blocage (15 min)
const ALLOWED_EXT =['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mov', '.pdf'];

/**
 * @param {object} options
 * @param {string} options.contentFile   contenu public (JSON)
 * @param {string} options.seedFile      contenu initial si contentFile n'existe pas encore
 * @param {string} options.privateDir    données privées : clients, brouillons, mot de passe, sauvegardes, messages
 * @param {string} options.uploadsDir    médias envoyés depuis l'admin
 * @param {(req) => boolean} options.canSetup      autorise la création du tout premier mot de passe
 * @param {(req) => boolean} [options.canAccess]   filtre global (en dev : cet ordinateur uniquement)
 * @param {string} [options.initialPassword]       mot de passe créé au démarrage s'il n'en existe aucun
 * @param {boolean} [options.trustProxy]           lire l'IP réelle dans X-Forwarded-For (derrière un proxy)
 * @param {number} [options.maxUploadMb]
 */
export function createApi(options) {
  const {
    contentFile, seedFile, privateDir, uploadsDir,
    canSetup, canAccess = () => true, initialPassword, trustProxy = false, maxUploadMb = 300, siteUrl = '',
  } = options;

  const backups = createBackups({ contentFile, privateDir });
  const stats = createStats({ privateDir });

  const files = {
    private: path.join(privateDir, 'private.json'),
    auth: path.join(privateDir, 'admin.json'),
    messages: path.join(privateDir, 'messages.json'),
    backups: path.join(privateDir, 'sauvegardes'),
  };

  /* ---------- Outils ---------- */
  const readJson = async (file, fallback) => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return fallback;
    }
  };

  /** Écriture atomique : fichier temporaire puis renommage (pas de fichier à moitié écrit) */
  const writeJson = async (file, data) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await fs.rename(tmp, file);
  };

  const readBody = (req, limit) => new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Fichier trop volumineux.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const readJsonBody = async (req, limit = 64 * 1024) => {
    try {
      return JSON.parse((await readBody(req, limit)).toString('utf8') || '{}');
    } catch (error) {
      if (error?.status) throw error;
      return {}; // corps illisible : traité comme vide, la validation répond 400
    }
  };

  const send = (res, status, data) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(data));
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const clientIp = (req) => {
    if (trustProxy) {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress ?? 'inconnu';
  };

  const slugify = (text) => text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60) || 'fichier';

  const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

  /* ---------- Contenu ---------- */
  let publicCache = null;

  async function publicContent() {
    if (!publicCache) publicCache = await readJson(contentFile, null);
    return publicCache;
  }

  /** Contenu complet pour l'admin : public + données privées réinjectées */
  async function loadFull() {
    const pub = await publicContent();
    const priv = await readJson(files.private, { clients: {}, drafts: [] });
    const withPrivate = (project) => ({
      ...project,
      client: { ...project.client, ...(priv.clients?.[project.slug] ?? {}) },
    });
    // Avis : on reprend l'ordre d'origine (publiés et brouillons mélangés) grâce à la liste privée des identifiants
    const testimonials = [...(pub.testimonials ?? []), ...(priv.testimonialDrafts ?? [])];
    const order = priv.testimonialOrder ?? [];
    testimonials.sort((a, b) => (order.indexOf(a.id) + 1 || Infinity) - (order.indexOf(b.id) + 1 || Infinity));
    // Articles : même principe (brouillons gardés à part)
    const posts = [...(pub.posts ?? []), ...(priv.postDrafts ?? [])];
    const postOrder = priv.postOrder ?? [];
    posts.sort((a, b) => (postOrder.indexOf(a.slug) + 1 || Infinity) - (postOrder.indexOf(b.slug) + 1 || Infinity));
    return {
      videos: [],
      ...pub,
      projects: [...pub.projects.map(withPrivate), ...(priv.drafts ?? [])],
      testimonials,
      posts,
      clientSpaces: priv.clientSpaces ?? [],
    };
  }

  /** Sépare et enregistre : public d'un côté, privé de l'autre, avec sauvegarde de l'ancienne version */
  async function saveFull(full) {
    await fs.mkdir(files.backups, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.copyFile(contentFile, path.join(files.backups, `content-${stamp}.json`)).catch(() => {});
    const backups = (await fs.readdir(files.backups)).filter(f => f.startsWith('content-')).sort();
    for (const old of backups.slice(0, Math.max(0, backups.length - MAX_BACKUPS))) {
      await fs.unlink(path.join(files.backups, old)).catch(() => {});
    }

    const clients = {};
    for (const project of full.projects.filter(p => p.published)) {
      clients[project.slug] = { name: project.client.name ?? '', notes: project.client.notes ?? '' };
    }
    const testimonials = full.testimonials ?? [];
    await writeJson(files.private, {
      clients,
      drafts: full.projects.filter(p => !p.published),
      // Avis sans accord du client ou non publiés : jamais dans le contenu public
      testimonialDrafts: testimonials.filter(t => !isPublicTestimonial(t)),
      testimonialOrder: testimonials.map(t => t.id),
      postDrafts: (full.posts ?? []).filter(p => !p.published),
      postOrder: (full.posts ?? []).map(p => p.slug),
      // Suivi de chantier : uniquement ici, jamais dans le contenu public
      clientSpaces: (full.clientSpaces ?? []).filter(s => typeof s.code === 'string' && s.code.length >= CLIENT_CODE_MIN),
    });
    await writeJson(contentFile, toPublicContent(full));
    publicCache = null;
  }

  /* ---------- Mot de passe (haché avec scrypt, jamais stocké en clair) ---------- */
  const sessions = new Map();          // jeton → expiration
  const loginFailures = new Map();     // IP → { count, blockedUntil }

  const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString('hex'),
  });

  const checkPassword = async (password) => {
    const stored = await readJson(files.auth, null);
    if (!stored) return false;
    const { hash } = hashPassword(password, stored.salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(stored.hash, 'hex'));
  };

  const setPassword = (password) => writeJson(files.auth, { ...hashPassword(password), updatedAt: new Date().toISOString() });

  const newSession = () => {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL);
    return token;
  };

  const isAuthenticated = (req) => {
    const token = req.headers['x-admin-token'];
    const expires = typeof token === 'string' ? sessions.get(token) : undefined;
    if (!expires || expires < Date.now()) return false;
    sessions.set(token, Date.now() + SESSION_TTL);
    return true;
  };

  const loginBlocked = (ip) => (loginFailures.get(ip)?.blockedUntil ?? 0) > Date.now();

  const recordLoginFailure = (ip) => {
    const entry = loginFailures.get(ip) ?? { count: 0, blockedUntil: 0 };
    entry.count += 1;
    if (entry.count >= LOGIN_MAX_FAILURES) {
      entry.count = 0;
      entry.blockedUntil = Date.now() + LOGIN_BLOCK_MS;
    }
    loginFailures.set(ip, entry);
  };

  /* ---------- Messages des formulaires ---------- */
  const messageTimes = new Map();      // IP → horodatages récents
  const trackingFailures = new Map();  // IP → { count, until } (codes d'espace client erronés)

  const messageAllowed = (ip) => {
    const now = Date.now();
    const recent = (messageTimes.get(ip) ?? []).filter(t => now - t < MESSAGE_WINDOW_MS);
    if (recent.length >= MESSAGE_LIMIT) return false;
    messageTimes.set(ip, [...recent, now]);
    return true;
  };

  // Nettoyage périodique des compteurs en mémoire
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [token, expires] of sessions) if (expires < now) sessions.delete(token);
    for (const [ip, entry] of loginFailures) if (entry.blockedUntil < now && entry.count === 0) loginFailures.delete(ip);
    for (const [ip, times] of messageTimes) if (times.every(t => now - t > MESSAGE_WINDOW_MS)) messageTimes.delete(ip);
    for (const [ip, entry] of trackingFailures) if (entry.until < now && entry.count === 0) trackingFailures.delete(ip);
  }, 10 * 60 * 1000);
  cleanup.unref?.();

  /* ---------- Démarrage ---------- */
  async function init() {
    // Premier lancement : contenu initial
    try {
      await fs.access(contentFile);
    } catch {
      await fs.mkdir(path.dirname(contentFile), { recursive: true });
      await fs.copyFile(seedFile, contentFile);
    }
    // Mot de passe initial fourni par l'environnement
    if (initialPassword && !(await readJson(files.auth, null))) {
      if (initialPassword.length < MIN_PASSWORD) throw new Error(`ADMIN_PASSWORD doit contenir au moins ${MIN_PASSWORD} caractères.`);
      await setPassword(initialPassword);
    }
  }

  /* ---------- Routes ----------
     Renvoie true si la requête a été traitée. */
  async function handle(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const { pathname } = url;
    if (!pathname.startsWith('/api/')) return false;
    if (!canAccess(req)) {
      send(res, 403, { error: 'Accès refusé.' });
      return true;
    }

    try {
      /* ----- Public ----- */
      if (pathname === '/api/content' && req.method === 'GET') {
        const content = await publicContent();
        if (!content) send(res, 503, { error: 'Contenu indisponible.' });
        else send(res, 200, content);
        return true;
      }

      if (pathname === '/api/messages' && req.method === 'POST') {
        const body = await readJsonBody(req, 32 * 1024);
        // Piège à robots : champ invisible pour un humain
        if (str(body.website, 200)) {
          send(res, 200, { ok: true });
          return true;
        }
        const message = {
          id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          name: str(body.name, 120),
          phone: str(body.phone, 40),
          email: str(body.email, 200),
          subject: str(body.subject, 200),
          message: str(body.message, 5000),
          lang: str(body.lang, 5),
          timestamp: new Date().toISOString(),
          status: 'nouveau',
        };
        // Demande de rendez-vous : données structurées pour l'agenda de l'admin
        const appt = body.appointment;
        if (appt && typeof appt === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(str(appt.date, 10))) {
          message.appointment = {
            type: appt.type === 'visite' ? 'visite' : 'appel',
            date: str(appt.date, 10),
            slot: str(appt.slot, 40),
            service: str(appt.service, 120),
            address: str(appt.address, 200),
            status: 'en attente',
          };
        }
        if (!message.name || !message.phone || !message.message) {
          send(res, 400, { error: 'Nom, téléphone et message sont obligatoires.' });
          return true;
        }
        if (!messageAllowed(clientIp(req))) {
          send(res, 429, { error: 'Trop de messages envoyés. Réessayez dans quelques minutes.' });
          return true;
        }
        const messages = await readJson(files.messages, []);
        await writeJson(files.messages, [message, ...messages].slice(0, MAX_MESSAGES));
        notifyNewMessage(message, siteUrl); // alertes Telegram / e-mail / WhatsApp / SMS, sans attendre
        send(res, 201, { ok: true });
        return true;
      }

      // Espace client : suivi de chantier privé, accessible avec le code secret remis au client
      const tracking = pathname.match(/^\/api\/suivi\/([\w-]+)$/);
      if (tracking && req.method === 'GET') {
        const ip = clientIp(req);
        const failures = trackingFailures.get(ip) ?? { count: 0, until: 0 };
        if (failures.until > Date.now()) {
          send(res, 429, { error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
          return true;
        }
        const priv = await readJson(files.private, {});
        const space = (priv.clientSpaces ?? []).find(s => s.active && s.code === tracking[1]);
        if (!space) {
          failures.count += 1;
          if (failures.count >= TRACKING_MAX_FAILURES) Object.assign(failures, { count: 0, until: Date.now() + LOGIN_BLOCK_MS });
          trackingFailures.set(ip, failures);
          await wait(500);
          send(res, 404, { error: 'Lien de suivi invalide ou expiré.' });
          return true;
        }
        send(res, 200, {
          clientName: space.clientName, projectTitle: space.projectTitle, status: space.status,
          progress: space.progress, nextStep: space.nextStep, updates: space.updates ?? [], documents: space.documents ?? [],
        });
        return true;
      }

      // Page vue (statistiques sans cookie, voir server/stats.js)
      if (pathname === '/api/stats' && req.method === 'POST') {
        const body = await readJsonBody(req, 4 * 1024);
        await stats.hit({
          path: body.path,
          referrer: body.referrer,
          entry: body.entry === true,
          lang: body.lang,
          ip: clientIp(req),
          ua: str(req.headers['user-agent'], 400),
          host: str(req.headers.host, 200).replace(/:\d+$/, '').replace(/^www\./, ''),
          dnt: req.headers.dnt === '1' || req.headers['sec-gpc'] === '1',
        });
        res.statusCode = 204;
        res.end();
        return true;
      }

      /* ----- Administration ----- */
      if (!pathname.startsWith('/api/admin/')) {
        send(res, 404, { error: 'Route inconnue.' });
        return true;
      }
      const route = pathname.slice('/api/admin'.length);
      const ip = clientIp(req);

      if (route === '/auth/status' && req.method === 'GET') {
        const configured = Boolean(await readJson(files.auth, null));
        send(res, 200, { configured, authenticated: configured && isAuthenticated(req), canSetup: !configured && canSetup(req) });
        return true;
      }

      if (route === '/auth/setup' && req.method === 'POST') {
        if (await readJson(files.auth, null)) {
          send(res, 409, { error: 'Un mot de passe existe déjà.' });
          return true;
        }
        if (!canSetup(req)) {
          send(res, 403, { error: 'Le premier mot de passe se définit sur le serveur (variable ADMIN_PASSWORD).' });
          return true;
        }
        const { password } = await readJsonBody(req);
        if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
          send(res, 400, { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.` });
          return true;
        }
        await setPassword(password);
        send(res, 200, { token: newSession() });
        return true;
      }

      if (route === '/auth/login' && req.method === 'POST') {
        if (loginBlocked(ip)) {
          send(res, 429, { error: 'Trop de tentatives. Réessayez dans 15 minutes.' });
          return true;
        }
        const { password } = await readJsonBody(req);
        if (typeof password !== 'string' || !(await checkPassword(password))) {
          recordLoginFailure(ip);
          await wait(1000);
          send(res, 401, { error: 'Mot de passe incorrect.' });
          return true;
        }
        loginFailures.delete(ip);
        send(res, 200, { token: newSession() });
        return true;
      }

      if (route === '/auth/logout' && req.method === 'POST') {
        const token = req.headers['x-admin-token'];
        if (typeof token === 'string') sessions.delete(token);
        send(res, 200, { ok: true });
        return true;
      }

      // Toutes les autres routes demandent une session valide
      if (!isAuthenticated(req)) {
        send(res, 401, { error: 'Session expirée, reconnectez-vous.' });
        return true;
      }

      if (route === '/auth/password' && req.method === 'POST') {
        const { current, next: nextPassword } = await readJsonBody(req);
        if (typeof current !== 'string' || !(await checkPassword(current))) {
          await wait(1000);
          send(res, 400, { error: 'Mot de passe actuel incorrect.' });
          return true;
        }
        if (typeof nextPassword !== 'string' || nextPassword.length < MIN_PASSWORD) {
          send(res, 400, { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.` });
          return true;
        }
        await setPassword(nextPassword);
        sessions.clear();
        send(res, 200, { token: newSession() });
        return true;
      }

      if (route === '/content' && req.method === 'GET') {
        send(res, 200, await loadFull());
        return true;
      }

      if (route === '/content' && req.method === 'POST') {
        const full = await readJsonBody(req, 20 * 1024 * 1024);
        const valid = full && typeof full.company === 'object' && Array.isArray(full.services) && Array.isArray(full.projects) && Array.isArray(full.faq);
        if (!valid) {
          send(res, 400, { error: 'Contenu invalide.' });
          return true;
        }
        await saveFull(full);
        send(res, 200, { ok: true });
        return true;
      }

      if (route === '/upload' && req.method === 'POST') {
        const folder = slugify(url.searchParams.get('folder') ?? 'divers');
        const original = url.searchParams.get('name') ?? 'fichier';
        const ext = path.extname(original).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
          send(res, 400, { error: `Format non accepté (${ext || 'inconnu'}).` });
          return true;
        }
        const data = await readBody(req, maxUploadMb * 1024 * 1024);
        const dir = path.join(uploadsDir, folder);
        await fs.mkdir(dir, { recursive: true });
        const fileName = `${slugify(path.basename(original, ext))}-${Date.now().toString(36)}${ext}`;
        await fs.writeFile(path.join(dir, fileName), data);
        send(res, 200, { url: `/uploads/${folder}/${fileName}` });
        return true;
      }

      /* ----- Alertes ----- */
      if (route === '/notifications' && req.method === 'GET') {
        send(res, 200, notificationStatus());
        return true;
      }

      if (route === '/notifications/test' && req.method === 'POST') {
        const results = await broadcast(
          `✅ Test des alertes Building Service (${new Date().toLocaleString('fr-FR')}).\nSi vous lisez ceci, ce canal fonctionne.`,
          'Test des alertes – Building Service',
        );
        send(res, 200, results);
        return true;
      }

      /* ----- Versions précédentes du contenu (copie faite avant chaque enregistrement) ----- */
      if (route === '/versions' && req.method === 'GET') {
        await fs.mkdir(files.backups, { recursive: true });
        const names = (await fs.readdir(files.backups)).filter(f => /^content-[\w-]+\.json$/.test(f)).sort().reverse();
        const versions = await Promise.all(names.map(async name => {
          const stat = await fs.stat(path.join(files.backups, name));
          return { file: name, date: stat.mtime.toISOString(), size: stat.size };
        }));
        send(res, 200, versions);
        return true;
      }

      if (route === '/versions/restore' && req.method === 'POST') {
        const { file } = await readJsonBody(req);
        if (typeof file !== 'string' || !/^content-[\w-]+\.json$/.test(file)) {
          send(res, 400, { error: 'Version inconnue.' });
          return true;
        }
        const source = path.join(files.backups, file);
        const restored = await readJson(source, null);
        if (!restored || !Array.isArray(restored.services)) {
          send(res, 404, { error: 'Version introuvable ou illisible.' });
          return true;
        }
        // La version actuelle est d'abord sauvegardée : la restauration peut elle-même être annulée
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.copyFile(contentFile, path.join(files.backups, `content-${stamp}.json`)).catch(() => {});
        await writeJson(contentFile, restored);
        publicCache = null;
        send(res, 200, { ok: true });
        return true;
      }

      if (route === '/stats' && req.method === 'GET') {
        send(res, 200, await stats.summary(Number(url.searchParams.get('days')) || 30));
        return true;
      }

      /* ----- Sauvegardes ----- */
      if (route === '/backup/run' && req.method === 'POST') {
        send(res, 200, await backups.run());
        return true;
      }

      if (route === '/backup/download' && req.method === 'GET') {
        const { name, data } = await backups.createArchive();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/gzip');
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.setHeader('Cache-Control', 'no-store');
        res.end(data);
        return true;
      }

      if (route === '/messages' && req.method === 'GET') {
        send(res, 200, await readJson(files.messages, []));
        return true;
      }

      const messageMatch = route.match(/^\/messages\/([\w-]+)$/);
      if (messageMatch && (req.method === 'PATCH' || req.method === 'DELETE')) {
        const messages = await readJson(files.messages, []);
        const id = messageMatch[1];
        if (!messages.some(m => m.id === id)) {
          send(res, 404, { error: 'Message introuvable.' });
          return true;
        }
        if (req.method === 'DELETE') {
          await writeJson(files.messages, messages.filter(m => m.id !== id));
        } else {
          const { status, appointmentStatus } = await readJsonBody(req);
          if (status !== undefined && !['nouveau', 'lu', 'traité'].includes(status)) {
            send(res, 400, { error: 'Statut invalide.' });
            return true;
          }
          if (appointmentStatus !== undefined && !['en attente', 'confirmé', 'refusé', 'terminé'].includes(appointmentStatus)) {
            send(res, 400, { error: 'Statut de rendez-vous invalide.' });
            return true;
          }
          await writeJson(files.messages, messages.map(m => {
            if (m.id !== id) return m;
            const next = { ...m };
            if (status !== undefined) next.status = status;
            if (appointmentStatus !== undefined && m.appointment) next.appointment = { ...m.appointment, status: appointmentStatus };
            return next;
          }));
        }
        send(res, 200, { ok: true });
        return true;
      }

      send(res, 404, { error: 'Route inconnue.' });
      return true;
    } catch (error) {
      send(res, error?.status ?? 500, { error: error?.status ? error.message : 'Erreur serveur.' });
      if (!error?.status) console.error('[api]', error);
      return true;
    }
  }

  return { init, handle, publicContent, backups, stats };
}

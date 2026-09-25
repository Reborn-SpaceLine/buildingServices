// Serveur d'administration local : actif uniquement avec `npm run dev`.
// Il enregistre le contenu du site dans les fichiers du projet :
//   - src/content/content.json      → contenu public, livré avec le site
//   - content-private/private.json  → noms des clients, notes internes, brouillons (jamais publié)
//   - public/uploads/               → images et vidéos envoyées depuis /admin
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { toPublicContent } from './src/content/privacy.ts';

const API = '/__admin/api';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 heures
const MIN_PASSWORD = 8;
const MAX_UPLOAD = 300 * 1024 * 1024; // 300 Mo
const MAX_BACKUPS = 30;
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mov', '.pdf'];

export function adminServer() {
  let root = process.cwd();

  const paths = () => ({
    content: path.join(root, 'src/content/content.json'),
    privateDir: path.join(root, 'content-private'),
    private: path.join(root, 'content-private/private.json'),
    auth: path.join(root, 'content-private/admin.json'),
    backups: path.join(root, 'content-private/sauvegardes'),
    uploads: path.join(root, 'public/uploads'),
  });

  const readJson = async (file, fallback) => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return fallback;
    }
  };

  const writeJson = async (file, data) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  };

  const readBody = (req, limit) => new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Fichier trop volumineux'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const send = (res, status, data) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  };

  const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');

  /** Contenu complet pour l'admin : public + données privées réinjectées */
  async function loadFull() {
    const p = paths();
    const pub = await readJson(p.content, null);
    const priv = await readJson(p.private, { clients: {}, drafts: [] });
    const withPrivate = (project) => ({
      ...project,
      client: { ...project.client, ...(priv.clients?.[project.slug] ?? {}) },
    });
    return {
      videos: [],
      ...pub,
      projects: [...pub.projects.map(withPrivate), ...(priv.drafts ?? [])],
    };
  }

  /** Sépare et enregistre : public d'un côté, privé de l'autre, avec sauvegarde de l'ancienne version */
  async function saveFull(full) {
    const p = paths();

    // Sauvegarde horodatée avant d'écraser
    await fs.mkdir(p.backups, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.copyFile(p.content, path.join(p.backups, `content-${stamp}.json`)).catch(() => {});
    const backups = (await fs.readdir(p.backups)).filter(f => f.startsWith('content-')).sort();
    for (const old of backups.slice(0, Math.max(0, backups.length - MAX_BACKUPS))) {
      await fs.unlink(path.join(p.backups, old)).catch(() => {});
    }

    const clients = {};
    for (const project of full.projects.filter(pr => pr.published)) {
      clients[project.slug] = { name: project.client.name ?? '', notes: project.client.notes ?? '' };
    }
    await writeJson(p.private, {
      clients,
      drafts: full.projects.filter(pr => !pr.published),
    });
    await writeJson(p.content, toPublicContent(full));
  }

  /* ---------- Mot de passe (haché avec scrypt, jamais stocké en clair) ---------- */
  const sessions = new Map(); // jeton → date d'expiration

  const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString('hex'),
  });

  const checkPassword = async (password) => {
    const stored = await readJson(paths().auth, null);
    if (!stored) return false;
    const { hash } = hashPassword(password, stored.salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(stored.hash, 'hex'));
  };

  const setPassword = (password) => writeJson(paths().auth, { ...hashPassword(password), updatedAt: new Date().toISOString() });

  const newSession = () => {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL);
    return token;
  };

  const isAuthenticated = (req) => {
    const token = req.headers['x-admin-token'];
    const expires = typeof token === 'string' ? sessions.get(token) : undefined;
    if (!expires || expires < Date.now()) return false;
    sessions.set(token, Date.now() + SESSION_TTL); // prolonge la session active
    return true;
  };

  const readJsonBody = async (req) => {
    try {
      return JSON.parse((await readBody(req, 64 * 1024)).toString('utf8') || '{}');
    } catch {
      return {}; // corps illisible : traité comme un formulaire vide (erreur 400 plus bas)
    }
  };
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const slugify = (text) => text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60) || 'fichier';

  return {
    name: 'building-service-admin',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(API)) return next();
        if (!isLocal(req)) return send(res, 403, { error: 'Administration réservée à cet ordinateur.' });

        const url = new URL(req.url, 'http://localhost');
        const route = url.pathname.slice(API.length);

        try {
          /* ---------- Authentification ---------- */
          if (route === '/auth/status' && req.method === 'GET') {
            const configured = Boolean(await readJson(paths().auth, null));
            return send(res, 200, { configured, authenticated: configured && isAuthenticated(req) });
          }

          if (route === '/auth/setup' && req.method === 'POST') {
            if (await readJson(paths().auth, null)) return send(res, 409, { error: 'Un mot de passe existe déjà.' });
            const { password } = await readJsonBody(req);
            if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
              return send(res, 400, { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.` });
            }
            await setPassword(password);
            return send(res, 200, { token: newSession() });
          }

          if (route === '/auth/login' && req.method === 'POST') {
            const { password } = await readJsonBody(req);
            if (typeof password !== 'string' || !(await checkPassword(password))) {
              await wait(1000); // freine les essais répétés
              return send(res, 401, { error: 'Mot de passe incorrect.' });
            }
            return send(res, 200, { token: newSession() });
          }

          if (route === '/auth/logout' && req.method === 'POST') {
            const token = req.headers['x-admin-token'];
            if (typeof token === 'string') sessions.delete(token);
            return send(res, 200, { ok: true });
          }

          // Toutes les autres routes demandent une session valide
          if (!isAuthenticated(req)) return send(res, 401, { error: 'Session expirée, reconnectez-vous.' });

          if (route === '/auth/password' && req.method === 'POST') {
            const { current, next: nextPassword } = await readJsonBody(req);
            if (typeof current !== 'string' || !(await checkPassword(current))) {
              await wait(1000);
              return send(res, 400, { error: 'Mot de passe actuel incorrect.' });
            }
            if (typeof nextPassword !== 'string' || nextPassword.length < MIN_PASSWORD) {
              return send(res, 400, { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.` });
            }
            await setPassword(nextPassword);
            sessions.clear(); // déconnecte les autres sessions
            return send(res, 200, { token: newSession() });
          }

          /* ---------- Contenu ---------- */
          if (route === '/content' && req.method === 'GET') {
            return send(res, 200, await loadFull());
          }

          if (route === '/content' && req.method === 'POST') {
            const full = JSON.parse((await readBody(req, 20 * 1024 * 1024)).toString('utf8'));
            const valid = full && typeof full.company === 'object' && Array.isArray(full.services) && Array.isArray(full.projects) && Array.isArray(full.faq);
            if (!valid) return send(res, 400, { error: 'Contenu invalide.' });
            await saveFull(full);
            return send(res, 200, { ok: true });
          }

          if (route === '/upload' && req.method === 'POST') {
            const folder = slugify(url.searchParams.get('folder') ?? 'divers');
            const original = url.searchParams.get('name') ?? 'fichier';
            const ext = path.extname(original).toLowerCase();
            if (!ALLOWED_EXT.includes(ext)) return send(res, 400, { error: `Format non accepté (${ext || 'inconnu'}).` });

            const data = await readBody(req, MAX_UPLOAD);
            const dir = path.join(paths().uploads, folder);
            await fs.mkdir(dir, { recursive: true });
            const fileName = `${slugify(path.basename(original, ext))}-${Date.now().toString(36)}${ext}`;
            await fs.writeFile(path.join(dir, fileName), data);
            return send(res, 200, { url: `/uploads/${folder}/${fileName}` });
          }

          return send(res, 404, { error: 'Route inconnue.' });
        } catch (error) {
          return send(res, 500, { error: error instanceof Error ? error.message : 'Erreur serveur.' });
        }
      });
    },
  };
}

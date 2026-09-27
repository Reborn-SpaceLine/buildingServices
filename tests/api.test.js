// Tests de l'API (formulaires, admin, confidentialité, versions, statistiques) sur un vrai serveur HTTP,
// avec des données temporaires : rien n'est modifié dans le projet.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from '../server/api.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PASSWORD = 'mot-de-passe-de-test';
const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1';

let tmp, server, base, api, token;
let ipCounter = 0;
/** Chaque test utilise sa propre adresse IP (les limites anti-abus sont par adresse) */
const newIp = () => `10.0.0.${++ipCounter}`;

async function call(method, url, { body, headers = {}, ip = newIp(), auth = false } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: {
      'x-forwarded-for': ip,
      'user-agent': BROWSER,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(auth ? { 'x-admin-token': token } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* réponse vide */ }
  return { status: res.status, json, text };
}

before(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'bs-test-'));
  api = createApi({
    contentFile: path.join(tmp, 'content.json'),
    seedFile: path.join(root, 'src/content/content.json'),
    privateDir: path.join(tmp, 'private'),
    uploadsDir: path.join(tmp, 'uploads'),
    canSetup: () => false,
    initialPassword: PASSWORD,
    trustProxy: true,
  });
  await api.init();
  server = http.createServer(async (req, res) => {
    if (!(await api.handle(req, res))) { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  await fs.rm(tmp, { recursive: true, force: true });
});

test('contenu public disponible', async () => {
  const { status, json } = await call('GET', '/api/content');
  assert.equal(status, 200);
  assert.ok(Array.isArray(json.services) && json.services.length > 0);
});

test('formulaire : champs obligatoires, piège à robots, rendez-vous', async () => {
  assert.equal((await call('POST', '/api/messages', { body: { name: 'A' } })).status, 400);
  // Piège à robots : réponse normale, mais rien n'est enregistré
  assert.equal((await call('POST', '/api/messages', { body: { name: 'Robot', phone: '1', message: 'spam', website: 'http://spam' } })).status, 200);
  const ok = await call('POST', '/api/messages', {
    body: { name: 'Awa', phone: '+237 6 00 00 00 00', message: 'Visite svp', appointment: { type: 'visite', date: '2030-01-15', slot: '08:00 – 10:00', address: 'Bastos' } },
  });
  assert.equal(ok.status, 201);
});

test('formulaire : limite anti-abus par adresse IP', async () => {
  const ip = newIp();
  const body = { name: 'B', phone: '1', message: 'm' };
  for (let i = 0; i < 5; i++) assert.equal((await call('POST', '/api/messages', { body, ip })).status, 201);
  assert.equal((await call('POST', '/api/messages', { body, ip })).status, 429);
});

test('admin : accès refusé sans connexion et avec un mauvais mot de passe', async () => {
  assert.equal((await call('GET', '/api/admin/content')).status, 401);
  assert.equal((await call('POST', '/api/admin/auth/login', { body: { password: 'faux' } })).status, 401);
  assert.equal((await call('POST', '/api/admin/auth/setup', { body: { password: 'nouveau-mdp' } })).status, 409);
});

test('admin : connexion, messages et agenda', async () => {
  const login = await call('POST', '/api/admin/auth/login', { body: { password: PASSWORD } });
  assert.equal(login.status, 200);
  token = login.json.token;

  const { json: messages } = await call('GET', '/api/admin/messages', { auth: true });
  assert.ok(!messages.some(m => m.name === 'Robot'), 'le message du robot a été enregistré');
  const rdv = messages.find(m => m.appointment);
  assert.equal(rdv.appointment.status, 'en attente');

  assert.equal((await call('PATCH', `/api/admin/messages/${rdv.id}`, { auth: true, body: { appointmentStatus: 'confirmé' } })).status, 200);
  assert.equal((await call('PATCH', `/api/admin/messages/${rdv.id}`, { auth: true, body: { appointmentStatus: 'n’importe quoi' } })).status, 400);
  const after = (await call('GET', '/api/admin/messages', { auth: true })).json.find(m => m.id === rdv.id);
  assert.equal(after.appointment.status, 'confirmé');
});

test('admin : les données privées restent privées après enregistrement', async () => {
  const { json: full } = await call('GET', '/api/admin/content', { auth: true });
  const project = { ...full.projects[0], client: { ...full.projects[0].client, visibility: 'anonyme', name: 'Client Très Secret', notes: 'note privée' } };
  const draft = { ...full.projects[0], slug: 'brouillon-test', title: 'Brouillon test', published: false };
  const avis = [
    { id: 'ok', name: 'Publié', role: '', text: 'Bien', rating: 5, project: '', date: '2025-01', consent: true, published: true },
    { id: 'non', name: 'Sans accord', role: '', text: 'Pas encore', rating: 5, project: '', date: '2025-01', consent: false, published: false },
  ];
  const saved = await call('POST', '/api/admin/content', { auth: true, body: { ...full, projects: [project, ...full.projects.slice(1), draft], testimonials: avis } });
  assert.equal(saved.status, 200);

  const pub = (await call('GET', '/api/content')).text;
  for (const secret of ['Client Très Secret', 'note privée', 'brouillon-test', 'Sans accord']) {
    assert.ok(!pub.includes(secret), `« ${secret} » est visible publiquement`);
  }
  // …mais l'admin les retrouve
  const again = (await call('GET', '/api/admin/content', { auth: true })).json;
  assert.equal(again.projects[0].client.name, 'Client Très Secret');
  assert.ok(again.projects.some(p => p.slug === 'brouillon-test'));
  assert.deepEqual(again.testimonials.map(t => t.id), ['ok', 'non']);
});

test('admin : contenu invalide refusé', async () => {
  assert.equal((await call('POST', '/api/admin/content', { auth: true, body: { company: {} } })).status, 400);
});

test('admin : restauration d’une version précédente', async () => {
  const { json: versions } = await call('GET', '/api/admin/versions', { auth: true });
  assert.ok(versions.length >= 1);
  assert.equal((await call('POST', '/api/admin/versions/restore', { auth: true, body: { file: '../admin.json' } })).status, 400);
  assert.equal((await call('POST', '/api/admin/versions/restore', { auth: true, body: { file: versions[0].file } })).status, 200);
  const pub = (await call('GET', '/api/content')).json;
  assert.ok(!(pub.testimonials ?? []).some(t => t.id === 'ok'), 'la version d’avant l’enregistrement n’a pas été restaurée');
});

test('admin : envoi de fichier — formats dangereux refusés', async () => {
  const res = await call('POST', '/api/admin/upload?folder=test&name=virus.exe', { auth: true, body: 'MZ' });
  assert.equal(res.status, 400);
  const ok = await call('POST', '/api/admin/upload?folder=../../etc&name=photo.webp', { auth: true, body: 'RIFF' });
  assert.equal(ok.status, 200);
  assert.match(ok.json.url, /^\/uploads\/etc\/photo-[\w]+\.webp$/, 'le dossier doit être nettoyé');
});

test('statistiques : pages vues comptées, robots et refus du suivi ignorés', async () => {
  const ip = newIp();
  const entry = { path: '/services?tel=123', referrer: 'https://www.google.com/search?q=x', lang: 'fr', entry: true };
  assert.equal((await call('POST', '/api/stats', { ip, body: entry })).status, 204);
  await call('POST', '/api/stats', { ip, body: { path: '/contact', referrer: '', lang: 'fr', entry: false } });
  await call('POST', '/api/stats', { body: { path: '/' }, headers: { 'user-agent': 'Googlebot/2.1' } });
  await call('POST', '/api/stats', { body: { path: '/' }, headers: { dnt: '1' } });
  await call('POST', '/api/stats', { body: { path: '/admin' } });

  const { status, json } = await call('GET', '/api/admin/stats?days=7', { auth: true });
  assert.equal(status, 200);
  assert.equal(json.views, 2);
  assert.equal(json.visitors, 1);
  assert.deepEqual(json.pages.map(p => p.key).sort(), ['/contact', '/services']);
  assert.deepEqual(json.sources, [{ key: 'google.com', count: 1 }]);
  assert.equal(json.devices[0].key, 'mobile');
  assert.equal(json.days.length, 7);

  // Aucune adresse IP ni paramètre d'adresse dans le fichier gardé sur le serveur
  await api.stats.flush();
  const stored = await fs.readFile(path.join(tmp, 'private', 'statistiques.json'), 'utf8');
  assert.ok(!stored.includes(ip) && !stored.includes('tel=123'));
  assert.equal((await call('GET', '/api/admin/stats')).status, 401);
});

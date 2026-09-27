// Sauvegardes automatiques des données vivantes (contenu, clients et brouillons, messages).
//
// Chaque jour à BACKUP_HOUR (heure du serveur, défaut 3 h) :
//   - une archive compressée est créée dans <données privées>/sauvegardes/ (les BACKUP_KEEP dernières sont gardées) ;
//   - elle est envoyée hors du serveur par Telegram et/ou e-mail si ces canaux sont configurés (voir notify.js).
// Les médias (photos, vidéos) sont trop volumineux pour ces canaux : sauvegardez le dossier uploads/ au niveau
// du serveur (voir deploy/README.md).
import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { sendBackupFile } from './notify.js';

const gzip = promisify(zlib.gzip);

/**
 * @param {object} options
 * @param {string} options.contentFile
 * @param {string} options.privateDir
 */
export function createBackups({ contentFile, privateDir }) {
  const dir = path.join(privateDir, 'sauvegardes');
  const keep = Number(process.env.BACKUP_KEEP ?? 14);
  const hour = Number(process.env.BACKUP_HOUR ?? 3);

  const readJson = async (file, fallback) => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return fallback;
    }
  };

  /** Archive de toutes les données JSON, compressée */
  async function createArchive() {
    const bundle = {
      createdAt: new Date().toISOString(),
      content: await readJson(contentFile, null),
      private: await readJson(path.join(privateDir, 'private.json'), null),
      messages: await readJson(path.join(privateDir, 'messages.json'), []),
    };
    const name = `building-service-${bundle.createdAt.slice(0, 10)}.json.gz`;
    const data = await gzip(Buffer.from(JSON.stringify(bundle)));
    return { name, data, bundle };
  }

  /** Crée l'archive, la garde sur le serveur et l'envoie hors du serveur */
  async function run() {
    const { name, data, bundle } = await createArchive();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `archive-${name}`), data);

    const archives = (await fs.readdir(dir)).filter(f => f.startsWith('archive-')).sort();
    for (const old of archives.slice(0, Math.max(0, archives.length - keep))) {
      await fs.unlink(path.join(dir, old)).catch(() => {});
    }

    const summary = `Sauvegarde du ${new Date(bundle.createdAt).toLocaleString('fr-FR')} : `
      + `${bundle.content?.services?.length ?? 0} services, ${bundle.content?.projects?.length ?? 0} réalisations publiées, `
      + `${bundle.private?.drafts?.length ?? 0} brouillons, ${bundle.messages.length} messages.`;
    const sent = await sendBackupFile(name, data, summary);
    console.log(`[sauvegarde] ${name} (${Math.round(data.length / 1024)} Ko) – envoi : ${JSON.stringify(sent)}`);
    return { name, size: data.length, sent };
  }

  /** Planifie la sauvegarde quotidienne */
  function schedule() {
    const next = new Date();
    next.setHours(hour, 0, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    const timer = setTimeout(async () => {
      try {
        await run();
      } catch (error) {
        console.error('[sauvegarde]', error);
      }
      schedule();
    }, next.getTime() - Date.now());
    timer.unref?.();
  }

  return { run, createArchive, schedule };
}

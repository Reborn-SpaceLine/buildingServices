// API du site pendant `npm run dev` : même code qu'en production (server/api.js),
// mais les données sont rangées dans le projet pour pouvoir être versionnées :
//   - src/content/content.json   → contenu public (aussi utilisé comme contenu initial en production)
//   - content-private/           → clients, brouillons, mot de passe, sauvegardes, messages (hors Git)
//   - public/uploads/            → médias envoyés depuis /admin
// L'administration est protégée par mot de passe, comme en production : elle est utilisable depuis
// un autre appareil du réseau (`npm run dev:reseau`). Seule la création du tout premier mot de passe
// est réservée à cet ordinateur.
import path from 'node:path';
import { createApi } from './server/api.js';

const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');

export function adminServer() {
  let root = process.cwd();

  return {
    name: 'building-service-api',
    apply: 'serve',
    configResolved(config) {
      root = config.root;
    },
    async configureServer(server) {
      const contentFile = path.join(root, 'src/content/content.json');
      const api = createApi({
        contentFile,
        seedFile: contentFile,
        privateDir: path.join(root, 'content-private'),
        uploadsDir: path.join(root, 'public/uploads'),
        canSetup: isLocal,
      });
      await api.init();

      server.middlewares.use(async (req, res, next) => {
        if (!(await api.handle(req, res))) next();
      });
    },
  };
}

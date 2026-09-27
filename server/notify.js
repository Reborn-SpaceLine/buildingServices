// Alertes : prévient l'équipe à chaque nouveau message ou demande de rendez-vous, et envoie les sauvegardes.
// Chaque canal est activé par ses variables d'environnement (jamais stockées dans le site) :
//
//   Telegram : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID            (plusieurs destinataires : séparés par des virgules)
//   E-mail   : EMAIL_PROVIDER=brevo|resend, EMAIL_API_KEY, EMAIL_FROM, EMAIL_TO
//   WhatsApp : WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TO   (API WhatsApp Business de Meta)
//              WHATSAPP_TEMPLATE (+ WHATSAPP_TEMPLATE_LANG)     modèle approuvé, nécessaire hors fenêtre de 24 h
//   SMS      : SMS_TO (numéros destinataires) +
//              MboaSMS : MBOASMS_API_KEY, MBOASMS_SENDER_ID (nom d'expéditeur validé), MBOASMS_BASE_URL (facultatif)
//              ou autre fournisseur : SMS_API_URL, SMS_API_METHOD (GET|POST), SMS_API_BODY, SMS_API_HEADERS
//              ({to} et {message} sont remplacés dans l'URL et le corps)
//
// Aucune dépendance : appels HTTPS avec fetch (Node 22).

const env = process.env;
const list = (value) => (value ?? '').split(',').map(s => s.trim()).filter(Boolean);
const TIMEOUT_MS = 15_000;

async function http(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new Error(`HTTP ${res.status} ${detail}`);
  }
  return res;
}

/* ---------- Canaux ---------- */
const channels = {
  telegram: {
    configured: () => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
    async send(text) {
      for (const chatId of list(env.TELEGRAM_CHAT_ID)) {
        await http(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        });
      }
    },
    async sendFile(name, data, caption) {
      for (const chatId of list(env.TELEGRAM_CHAT_ID)) {
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', caption);
        form.append('document', new Blob([data]), name);
        await http(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`, { method: 'POST', body: form });
      }
    },
  },

  email: {
    configured: () => Boolean(env.EMAIL_API_KEY && env.EMAIL_FROM && env.EMAIL_TO),
    async send(text, subject = 'Building Service', attachment) {
      const to = list(env.EMAIL_TO);
      const provider = (env.EMAIL_PROVIDER ?? 'brevo').toLowerCase();
      const html = `<div style="font-family:sans-serif;white-space:pre-line">${escapeHtml(text)}</div>`;
      if (provider === 'resend') {
        await http('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: env.EMAIL_FROM, to, subject, html, text,
            ...(attachment ? { attachments: [{ filename: attachment.name, content: attachment.data.toString('base64') }] } : {}),
          }),
        });
        return;
      }
      await http('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env.EMAIL_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: parseAddress(env.EMAIL_FROM),
          to: to.map(parseAddress),
          subject,
          htmlContent: html,
          textContent: text,
          ...(attachment ? { attachment: [{ name: attachment.name, content: attachment.data.toString('base64') }] } : {}),
        }),
      });
    },
  },

  whatsapp: {
    configured: () => Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID && env.WHATSAPP_TO),
    async send(text) {
      for (const to of list(env.WHATSAPP_TO)) {
        // Hors de la fenêtre de 24 h, WhatsApp n'accepte que des modèles approuvés par Meta
        const message = env.WHATSAPP_TEMPLATE
          ? {
            type: 'template',
            template: {
              name: env.WHATSAPP_TEMPLATE,
              language: { code: env.WHATSAPP_TEMPLATE_LANG ?? 'fr' },
              components: [{ type: 'body', parameters: [{ type: 'text', text: text.slice(0, 1000) }] }],
            },
          }
          : { type: 'text', text: { body: text.slice(0, 4000) } };
        await http(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), ...message }),
        });
      }
    },
  },

  sms: {
    configured: () => Boolean((env.MBOASMS_API_KEY || env.SMS_API_URL) && env.SMS_TO),
    async send(text) {
      const message = text.replace(/\s+/g, ' ').slice(0, 300); // un SMS reste court

      // MboaSMS (https://mboasms.com) : envoi direct avec la clé API du compte
      if (env.MBOASMS_API_KEY) {
        const body = { phoneNumbers: list(env.SMS_TO), message };
        if (env.MBOASMS_SENDER_ID) body.senderId = env.MBOASMS_SENDER_ID;
        const res = await http(`${env.MBOASMS_BASE_URL || 'https://api.mboasms.com'}/api/v1/developer/sms/send`, {
          method: 'POST',
          headers: { 'X-API-Key': env.MBOASMS_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        // MboaSMS répond 200 même quand il refuse l'envoi (ex. Sender ID non validé)
        const result = await res.json().catch(() => ({}));
        if (result.success === false) throw new Error(result.errorMessage || 'Envoi refusé par MboaSMS.');
        return;
      }

      const headers = env.SMS_API_HEADERS ? JSON.parse(env.SMS_API_HEADERS) : {};
      const method = (env.SMS_API_METHOD ?? 'POST').toUpperCase();
      for (const to of list(env.SMS_TO)) {
        const fill = (template, encode) => template
          .replaceAll('{to}', encode ? encodeURIComponent(to) : to)
          .replaceAll('{message}', encode ? encodeURIComponent(message) : JSON.stringify(message).slice(1, -1));
        const url = fill(env.SMS_API_URL, true);
        await http(url, method === 'GET'
          ? { method, headers }
          : { method, headers: { 'Content-Type': 'application/json', ...headers }, body: env.SMS_API_BODY ? fill(env.SMS_API_BODY, false) : JSON.stringify({ to, message }) });
      }
    },
  },
};

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** « Nom <adresse> » ou « adresse » → format Brevo */
function parseAddress(value) {
  const match = value.match(/^\s*(.*?)\s*<(.+)>\s*$/);
  return match ? { name: match[1] || undefined, email: match[2] } : { email: value.trim() };
}

/* ---------- API publique du module ---------- */

/** Canaux actifs (pour l'admin) */
export function notificationStatus() {
  return Object.fromEntries(Object.entries(channels).map(([name, c]) => [name, c.configured()]));
}

/** Envoie un texte sur tous les canaux configurés ; renvoie le résultat de chacun, sans jamais lever d'erreur */
export async function broadcast(text, subject) {
  const active = Object.entries(channels).filter(([, c]) => c.configured());
  const results = await Promise.allSettled(active.map(([, c]) => c.send(text, subject)));
  return Object.fromEntries(active.map(([name], i) => {
    const r = results[i];
    if (r.status === 'rejected') console.error(`[alerte ${name}]`, r.reason?.message ?? r.reason);
    return [name, r.status === 'fulfilled' ? 'ok' : String(r.reason?.message ?? r.reason)];
  }));
}

/** Alerte « nouveau message » à partir d'un message des formulaires */
export function notifyNewMessage(message, siteUrl = '') {
  const isAppointment = /^RDV/i.test(message.subject);
  const lines = [
    isAppointment ? '📅 Nouvelle demande de rendez-vous' : '📩 Nouveau message sur le site',
    '',
    `Nom : ${message.name}`,
    `Téléphone : ${message.phone}`,
    message.email ? `Email : ${message.email}` : null,
    message.subject ? `Objet : ${message.subject}` : null,
    '',
    message.message,
    '',
    `Répondre sur WhatsApp : https://wa.me/${message.phone.replace(/\D/g, '')}`,
    siteUrl ? `Administration : ${siteUrl}/admin` : null,
  ].filter(line => line !== null);
  const subject = isAppointment ? `Nouvelle demande de RDV – ${message.name}` : `Nouveau message – ${message.name}`;
  // Sans attendre : l'enregistrement du message ne dépend jamais des alertes
  void broadcast(lines.join('\n'), subject);
}

/** Envoie un fichier de sauvegarde (Telegram et/ou e-mail) */
export async function sendBackupFile(name, data, caption) {
  const results = {};
  if (channels.telegram.configured()) {
    try {
      await channels.telegram.sendFile(name, data, caption);
      results.telegram = 'ok';
    } catch (error) {
      results.telegram = String(error.message ?? error);
      console.error('[sauvegarde telegram]', results.telegram);
    }
  }
  if (channels.email.configured()) {
    try {
      await channels.email.send(caption, `Sauvegarde Building Service – ${name}`, { name, data });
      results.email = 'ok';
    } catch (error) {
      results.email = String(error.message ?? error);
      console.error('[sauvegarde e-mail]', results.email);
    }
  }
  return results;
}

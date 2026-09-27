/** Demande envoyée par les formulaires Contact et RDV */
export interface OutgoingMessage {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  lang: string;
  website?: string; // piège à robots : doit rester vide
  /** Demande de rendez-vous : alimente l'agenda de l'admin */
  appointment?: { type: 'appel' | 'visite'; date: string; slot: string; service: string; address: string };
}

export type SendResult = 'ok' | 'rate-limited' | 'error';

/** Enregistre la demande sur le serveur ; elle apparaît dans l'onglet Messages de l'admin */
export async function sendMessage(data: OutgoingMessage): Promise<SendResult> {
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.status === 429) return 'rate-limited';
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export function exportMessages(messages: unknown[]) {
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `messages_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

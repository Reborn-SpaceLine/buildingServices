import type { SiteContent } from '../content/types';

const API = '/api/admin';
const TOKEN_KEY = 'bs_admin_token';

/* ---------- Session (jeton gardé le temps de l'onglet) ---------- */
function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function setToken(token: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* navigation privée : la session dure le temps de la page */
  }
}

/** Levée quand la session a expiré : l'admin revient à l'écran de connexion */
export class AuthError extends Error {}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), 'x-admin-token': getToken() },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.includes('/auth/')) throw new AuthError(data.error ?? 'Session expirée');
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
  return data as T;
}

const postJson = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/* ---------- Authentification ---------- */
export function authStatus() {
  return request<{ configured: boolean; authenticated: boolean; canSetup: boolean }>(`${API}/auth/status`);
}

export async function setupPassword(password: string) {
  const { token } = await postJson<{ token: string }>(`${API}/auth/setup`, { password });
  setToken(token);
}

export async function login(password: string) {
  const { token } = await postJson<{ token: string }>(`${API}/auth/login`, { password });
  setToken(token);
}

export async function logout() {
  await postJson(`${API}/auth/logout`, {}).catch(() => {});
  setToken('');
}

export async function changePassword(current: string, next: string) {
  const { token } = await postJson<{ token: string }>(`${API}/auth/password`, { current, next });
  setToken(token);
}

/* ---------- Contenu ---------- */
/** Contenu complet (avec données privées) */
export function fetchContent() {
  return request<SiteContent>(`${API}/content`);
}

export function saveContent(content: SiteContent) {
  return postJson<{ ok: true }>(`${API}/content`, content);
}

/** Envoie un fichier dans public/uploads/<dossier>/ et renvoie son adresse publique */
export async function uploadFile(file: File, folder: string) {
  const params = new URLSearchParams({ folder, name: file.name });
  const { url } = await request<{ url: string }>(`${API}/upload?${params}`, { method: 'POST', body: file });
  return url;
}

export function slugify(text: string) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------- Messages des formulaires ---------- */
export interface ServerMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  lang?: string;
  timestamp: string;
  status: 'nouveau' | 'lu' | 'traité';
}

export function fetchMessages() {
  return request<ServerMessage[]>(`${API}/messages`);
}

export function setMessageStatus(id: string, status: ServerMessage['status']) {
  return request<{ ok: true }>(`${API}/messages/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

export function deleteMessage(id: string) {
  return request<{ ok: true }>(`${API}/messages/${id}`, { method: 'DELETE' });
}
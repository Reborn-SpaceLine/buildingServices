import type { Platform } from './types';

export const platforms: Record<Platform, { label: string; color: string }> = {
  youtube: { label: 'YouTube', color: '#ff0000' },
  tiktok: { label: 'TikTok', color: '#000000' },
  instagram: { label: 'Instagram', color: '#e4405f' },
  facebook: { label: 'Facebook', color: '#1877f2' },
  fichier: { label: 'Vidéo', color: '#1f1a17' },
  autre: { label: 'Lien', color: '#5b5552' },
};

/** Devine la plateforme à partir d'un lien collé */
export function detectPlatform(url: string): Platform {
  if (/youtu\.?be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/facebook\.com|fb\.watch/.test(url)) return 'facebook';
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url) || url.startsWith('/uploads/')) return 'fichier';
  return 'autre';
}

/** Identifiant d'une vidéo YouTube, quel que soit le format du lien */
export function youtubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return match?.[1] ?? null;
}
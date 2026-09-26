import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ExternalLink, Film, Link2, Check } from 'lucide-react';
import { TikTokIcon, FacebookIcon, InstagramIcon, YouTubeIcon, WhatsAppIcon, LinkedInIcon } from './SocialIcons';
import type { MediaLink, Platform } from '../content/types';
import { platforms, youtubeId } from '../content/platforms';
import { useLang, useUi } from '../i18n/context';
import '../styles/media.css';

export function PlatformIcon({ platform, size = 20 }: { platform: Platform; size?: number }) {
  switch (platform) {
    case 'youtube': return <YouTubeIcon size={size} />;
    case 'tiktok': return <TikTokIcon size={size} />;
    case 'instagram': return <InstagramIcon size={size} />;
    case 'facebook': return <FacebookIcon size={size} />;
    case 'fichier': return <Film size={size} />;
    default: return <ExternalLink size={size} />;
  }
}

export function MediaEmbed({ media }: { media: MediaLink }) {
  const ui = useUi();
  const color = (platforms[media.platform] ?? platforms.autre).color;
  const label = ui.media.platforms[media.platform] ?? ui.media.platforms.autre;
  const ytId = media.platform === 'youtube' ? youtubeId(media.url) : null;

  if (ytId) {
    return (
      <figure className="media-card">
        <div className="media-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            title={media.title || ui.media.youtubeVideo}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {media.title && <figcaption>{media.title}</figcaption>}
      </figure>
    );
  }

  if (media.platform === 'fichier') {
    return (
      <figure className="media-card">
        <div className="media-frame">
          <video src={media.url} controls preload="metadata" playsInline />
        </div>
        {media.title && <figcaption>{media.title}</figcaption>}
      </figure>
    );
  }

  return (
    <a href={media.url} target="_blank" rel="noopener noreferrer" className="media-link" style={{ '--platform': color } as CSSProperties}>
      <span className="media-link-icon"><PlatformIcon platform={media.platform} size={22} /></span>
      <span className="media-link-text">
        <strong>{media.title || ui.media.watchVideo}</strong>
        <span>{ui.media.seeOn} {label}</span>
      </span>
      <ExternalLink size={18} />
    </a>
  );
}

export function MediaList({ videos }: { videos: MediaLink[] }) {
  const valid = videos.filter(v => v.url);
  if (valid.length === 0) return null;
  return (
    <div className="media-list">
      {valid.map((v, i) => <MediaEmbed key={`${v.url}-${i}`} media={v} />)}
    </div>
  );
}

/** Partage d'une page (projet, service) sur les réseaux, dans la langue affichée */
export function ShareButtons({ title }: { title: string }) {
  const ui = useUi();
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  const current = new URL(window.location.href);
  if (lang === 'fr') current.searchParams.delete('lang');
  else current.searchParams.set('lang', lang);
  const url = current.toString();

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(`${title} – Building Service`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(ui.media.copyPrompt, url);
    }
  };

  return (
    <div className="share">
      <span>{ui.media.share}</span>
      <a href={`https://wa.me/?text=${text}%20${encoded}`} target="_blank" rel="noopener noreferrer" aria-label={`${ui.media.shareOn} WhatsApp`}><WhatsAppIcon size={18} /></a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} target="_blank" rel="noopener noreferrer" aria-label={`${ui.media.shareOn} Facebook`}><FacebookIcon size={18} /></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`} target="_blank" rel="noopener noreferrer" aria-label={`${ui.media.shareOn} LinkedIn`}><LinkedInIcon size={18} /></a>
      <button onClick={copy} aria-label={ui.media.copyLink}>{copied ? <Check size={18} /> : <Link2 size={18} />}</button>
    </div>
  );
}

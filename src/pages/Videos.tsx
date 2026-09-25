import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero, Reveal } from '../components/ui';
import { MediaEmbed } from '../components/Media';
import { SocialIcons } from '../components/SocialIcons';
import { usePageTitle } from '../lib/usePageTitle';
import { projects, services, featuredVideos } from '../data/site';
import { platforms } from '../content/platforms';
import type { MediaLink, Platform } from '../content/types';
import '../styles/pages.css';

interface IndexedVideo {
  media: MediaLink;
  source?: string;
  to?: string;
}

/** Index de toutes les vidéos du site, avec la page d'où elles viennent */
const allVideos: IndexedVideo[] = [
  ...featuredVideos.map(media => ({ media })),
  ...projects.flatMap(p => p.videos.filter(v => v.url).map(media => ({ media, source: p.title, to: `/realisations/${p.slug}` }))),
  ...services.flatMap(s => s.videos.filter(v => v.url).map(media => ({ media, source: s.title, to: `/services/${s.slug}` }))),
];

const usedPlatforms = Array.from(new Set(allVideos.map(v => v.media.platform)));

export function VideosPage() {
  usePageTitle('Vidéos des projets');
  const [platform, setPlatform] = useState<Platform | 'toutes'>('toutes');
  const visible = platform === 'toutes' ? allVideos : allVideos.filter(v => v.media.platform === platform);

  return (
    <>
      <PageHero
        eyebrow="Vidéos"
        title="Nos chantiers en vidéo."
        text="Avant/après, étapes de chantier, astuces : retrouvez ici toutes les vidéos de nos projets, publiées sur nos réseaux sociaux."
      />

      <section className="section">
        <div className="container">
          <div className="videos-follow">
            <p>Suivez-nous pour ne rien manquer :</p>
            <SocialIcons variant="dark" size="md" />
          </div>

          {usedPlatforms.length > 1 && (
            <div className="filter-bar" role="tablist" aria-label="Filtrer par réseau">
              {(['toutes', ...usedPlatforms] as const).map(p => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={platform === p}
                  className={`filter-chip ${platform === p ? 'active' : ''}`}
                  onClick={() => setPlatform(p)}
                >
                  {p === 'toutes' ? 'Toutes' : platforms[p].label}
                </button>
              ))}
            </div>
          )}

          {visible.length === 0 ? (
            <p className="empty-state">
              Les vidéos de nos chantiers arrivent bientôt. En attendant, découvrez nos <Link to="/realisations" className="highlight">réalisations en photos</Link>.
            </p>
          ) : (
            <div className="videos-grid">
              {visible.map((video, i) => (
                <Reveal key={`${video.media.url}-${i}`} className="video-item">
                  <MediaEmbed media={video.media} />
                  {video.to && <Link to={video.to} className="video-source">{video.source} →</Link>}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

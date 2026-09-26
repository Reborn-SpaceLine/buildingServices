import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHero, Reveal } from '../components/ui';
import { MediaEmbed } from '../components/Media';
import { SocialIcons } from '../components/SocialIcons';
import { usePageTitle } from '../lib/usePageTitle';
import { useSite, useUi } from '../i18n/context';
import type { MediaLink, Platform } from '../content/types';
import '../styles/pages.css';

interface IndexedVideo {
  media: MediaLink;
  source?: string;
  to?: string;
}

export function VideosPage() {
  const ui = useUi();
  const t = ui.videos;
  const { projects, services, featuredVideos } = useSite();
  usePageTitle(t.title);
  const [platform, setPlatform] = useState<Platform | 'toutes'>('toutes');

  /** Index de toutes les vidéos du site, avec la page d'où elles viennent */
  const allVideos: IndexedVideo[] = [
    ...featuredVideos.map(media => ({ media })),
    ...projects.flatMap(p => p.videos.filter(v => v.url).map(media => ({ media, source: p.title, to: `/realisations/${p.slug}` }))),
    ...services.flatMap(s => s.videos.filter(v => v.url).map(media => ({ media, source: s.title, to: `/services/${s.slug}` }))),
  ];
  const usedPlatforms = Array.from(new Set(allVideos.map(v => v.media.platform)));
  const visible = platform === 'toutes' ? allVideos : allVideos.filter(v => v.media.platform === platform);

  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} text={t.heroText} />

      <section className="section">
        <div className="container">
          <div className="videos-follow">
            <p>{t.follow}</p>
            <SocialIcons variant="dark" size="md" />
          </div>

          {usedPlatforms.length > 1 && (
            <div className="filter-bar" role="tablist" aria-label={t.filterLabel}>
              {(['toutes', ...usedPlatforms] as const).map(p => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={platform === p}
                  className={`filter-chip ${platform === p ? 'active' : ''}`}
                  onClick={() => setPlatform(p)}
                >
                  {p === 'toutes' ? ui.common.allFem : ui.media.platforms[p]}
                </button>
              ))}
            </div>
          )}

          {visible.length === 0 ? (
            <p className="empty-state">
              {t.emptyStart} <Link to="/realisations" className="highlight">{t.emptyLink}</Link>.
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

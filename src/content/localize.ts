import type { Lang, MediaLink, SiteContent } from './types';

/** Texte traduit s'il existe, sinon le texte français */
const pick = (base: string, translated?: string) => (translated?.trim() ? translated : base);

/** Liste traduite ligne par ligne, avec repli sur le français pour chaque ligne manquante */
const pickList = (base: string[], translated?: string[]) => base.map((line, i) => pick(line, translated?.[i]));

const localizeVideo = (video: MediaLink, lang: Lang): MediaLink =>
  lang === 'fr' ? video : { ...video, title: pick(video.title, video.i18n?.[lang]?.title) };

/** Contenu du site dans la langue demandée */
export function localizeContent(content: SiteContent, lang: Lang): SiteContent {
  if (lang === 'fr') return content;

  const { company, hero } = content;
  const companyTr = company.i18n?.[lang];
  const heroTr = hero.i18n?.[lang];

  return {
    ...content,
    company: {
      ...company,
      tagline: pick(company.tagline, companyTr?.tagline),
      city: pick(company.city, companyTr?.city),
      hours: pick(company.hours, companyTr?.hours),
    },
    hero: {
      ...hero,
      eyebrow: pick(hero.eyebrow, heroTr?.eyebrow),
      description: pick(hero.description, heroTr?.description),
    },
    stats: content.stats.map(stat => ({ ...stat, label: pick(stat.label, stat.i18n?.[lang]?.label) })),
    services: content.services.map(service => {
      const tr = service.i18n?.[lang];
      return {
        ...service,
        title: pick(service.title, tr?.title),
        short: pick(service.short, tr?.short),
        intro: pick(service.intro, tr?.intro),
        features: pickList(service.features, tr?.features),
        steps: pickList(service.steps, tr?.steps),
        videos: service.videos.map(v => localizeVideo(v, lang)),
      };
    }),
    projects: content.projects.map(project => {
      const tr = project.i18n?.[lang];
      return {
        ...project,
        title: pick(project.title, tr?.title),
        description: pick(project.description, tr?.description),
        details: pick(project.details, tr?.details),
        location: pick(project.location, tr?.location),
        duration: pick(project.duration, tr?.duration),
        // Seul le libellé générique se traduit : un nom ou des initiales restent tels quels
        client: project.client.visibility === 'anonyme'
          ? { ...project.client, label: pick(project.client.label, tr?.clientLabel) }
          : project.client,
        steps: project.steps.map(step => ({
          ...step,
          title: pick(step.title, step.i18n?.[lang]?.title),
          text: pick(step.text, step.i18n?.[lang]?.text),
        })),
        videos: project.videos.map(v => localizeVideo(v, lang)),
      };
    }),
    faq: content.faq.map(item => ({
      ...item,
      q: pick(item.q, item.i18n?.[lang]?.q),
      a: pick(item.a, item.i18n?.[lang]?.a),
    })),
    videos: (content.videos ?? []).map(v => localizeVideo(v, lang)),
  };
}

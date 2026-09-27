import type { SiteContent } from '../src/content/types';

export interface PageMeta {
  lang: string;
  title: string;
  description: string;
  image: string;
  url: string;
  alternates: { fr: string; en: string };
  type: string;
  jsonLd: object[];
  notFound: boolean;
  noindex: boolean;
}

export function pageMeta(pathname: string, lang: string, content: SiteContent, siteUrl?: string): PageMeta;
export function metaTags(meta: PageMeta): string;

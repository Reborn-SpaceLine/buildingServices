import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LanguageContext } from './context';
import { defaultLanguage, translatedLanguages } from '../content/types';
import type { Lang } from '../content/types';

const STORAGE_KEY = 'bs_lang';
const supported: Lang[] = [defaultLanguage, ...translatedLanguages];
const isLang = (value: unknown): value is Lang => supported.includes(value as Lang);

/** Langue au premier affichage : lien ?lang=…, puis choix mémorisé, puis langue du navigateur */
function initialLanguage(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (isLang(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* stockage indisponible */
  }
  const browser = navigator.language?.slice(0, 2);
  return isLang(browser) ? browser : defaultLanguage;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLanguage);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* stockage indisponible : la langue vaut pour cette visite */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

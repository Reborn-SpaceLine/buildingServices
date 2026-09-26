import { createContext, useContext } from 'react';
import type { Lang } from '../content/types';
import { dictionaries } from './ui';
import type { UiText } from './ui';
import { getSite } from '../data/site';
import type { Site } from '../data/site';

export interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const LanguageContext = createContext<LanguageState>({ lang: 'fr', setLang: () => {} });

/** Langue affichée et moyen de la changer */
export function useLang() {
  return useContext(LanguageContext);
}

/** Textes fixes de l'interface dans la langue affichée */
export function useUi(): UiText {
  return dictionaries[useContext(LanguageContext).lang];
}

/** Contenu du site (services, projets, FAQ…) dans la langue affichée */
export function useSite(): Site {
  return getSite(useContext(LanguageContext).lang);
}

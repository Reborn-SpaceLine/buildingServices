import { Fragment } from 'react';
import { useLang } from '../i18n/context';
import { languageNames } from '../i18n/ui';
import { defaultLanguage, translatedLanguages } from '../content/types';
import { useAdminText } from './i18n';

/** Affiche un texte du dictionnaire avec **gras** et `code` */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const languages = [defaultLanguage, ...translatedLanguages];

/** Sélecteur FR / EN de l'admin (partage la langue avec le site) */
export function AdminLanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  const t = useAdminText();
  const next = languages[(languages.indexOf(lang) + 1) % languages.length];
  return (
    <button
      type="button"
      className={`a-lang ${className}`}
      onClick={() => setLang(next)}
      aria-label={`${t.header.language} : ${languageNames[lang].label} → ${languageNames[next].label}`}
      title={languageNames[next].label}
    >
      {languages.map(code => (
        <span key={code} lang={code} className={code === lang ? 'active' : ''}>{languageNames[code].short}</span>
      ))}
    </button>
  );
}

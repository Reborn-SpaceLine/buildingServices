import { useState } from 'react';
import { Languages, Copy } from 'lucide-react';
import { translatedLanguages } from '../content/types';
import type { SiteContent, TranslatedLang, MediaLink } from '../content/types';
import { languageNames } from '../i18n/ui';

type TabProps = {
  content: SiteContent;
  update: (patch: Partial<SiteContent>) => void;
};

interface Entry {
  group: string;
  subgroup?: string;
  label: string;
  source: string;
  value: string;
  multiline?: boolean;
  set: (value: string) => void;
}

/** Ajoute ou modifie la traduction d'un élément, sans toucher au reste */
function withTr<T extends { i18n?: object }>(obj: T, lang: TranslatedLang, patch: Record<string, unknown>): T {
  const i18n = (obj.i18n ?? {}) as Record<string, Record<string, unknown> | undefined>;
  return { ...obj, i18n: { ...i18n, [lang]: { ...i18n[lang], ...patch } } };
}

/** Remplace la ligne `index` d'une liste traduite (prestations, étapes…) */
function setLine(list: string[] | undefined, index: number, value: string, length: number) {
  const next = Array.from({ length }, (_, i) => list?.[i] ?? '');
  next[index] = value;
  return next;
}

/** Toutes les chaînes à traduire, dans l'ordre d'affichage */
function collectEntries(content: SiteContent, update: TabProps['update'], lang: TranslatedLang): Entry[] {
  const entries: Entry[] = [];
  const add = (entry: Entry) => {
    if (entry.source.trim()) entries.push(entry);
  };

  /* Accueil et entreprise */
  const group = 'Accueil et entreprise';
  const heroTr = content.hero.i18n?.[lang];
  const companyTr = content.company.i18n?.[lang];
  const setHero = (patch: Record<string, unknown>) => update({ hero: withTr(content.hero, lang, patch) });
  const setCompany = (patch: Record<string, unknown>) => update({ company: withTr(content.company, lang, patch) });
  add({ group, label: 'Étiquette au-dessus du titre', source: content.hero.eyebrow, value: heroTr?.eyebrow ?? '', set: v => setHero({ eyebrow: v }) });
  add({ group, label: 'Texte sous le titre', source: content.hero.description, value: heroTr?.description ?? '', multiline: true, set: v => setHero({ description: v }) });
  add({ group, label: 'Slogan', source: content.company.tagline, value: companyTr?.tagline ?? '', set: v => setCompany({ tagline: v }) });
  add({ group, label: 'Zone d’intervention', source: content.company.city, value: companyTr?.city ?? '', set: v => setCompany({ city: v }) });
  add({ group, label: 'Horaires', source: content.company.hours, value: companyTr?.hours ?? '', set: v => setCompany({ hours: v }) });

  /* Chiffres */
  content.stats.forEach((stat, i) => {
    add({
      group: 'Chiffres clés', label: `${stat.prefix}${stat.value}${stat.suffix}`, source: stat.label, value: stat.i18n?.[lang]?.label ?? '',
      set: v => update({ stats: content.stats.map((s, j) => (j === i ? withTr(s, lang, { label: v }) : s)) }),
    });
  });

  /* Services */
  content.services.forEach((service, i) => {
    const tr = service.i18n?.[lang];
    const set = (patch: Record<string, unknown>) => update({ services: content.services.map((s, j) => (j === i ? withTr(s, lang, patch) : s)) });
    const base = { group: 'Services', subgroup: service.title };
    add({ ...base, label: 'Titre', source: service.title, value: tr?.title ?? '', set: v => set({ title: v }) });
    add({ ...base, label: 'Résumé', source: service.short, value: tr?.short ?? '', multiline: true, set: v => set({ short: v }) });
    add({ ...base, label: 'Présentation', source: service.intro, value: tr?.intro ?? '', multiline: true, set: v => set({ intro: v }) });
    service.features.forEach((line, k) => add({
      ...base, label: `Prestation ${k + 1}`, source: line, value: tr?.features?.[k] ?? '',
      set: v => set({ features: setLine(tr?.features, k, v, service.features.length) }),
    }));
    service.steps.forEach((line, k) => add({
      ...base, label: `Étape ${k + 1}`, source: line, value: tr?.steps?.[k] ?? '',
      set: v => set({ steps: setLine(tr?.steps, k, v, service.steps.length) }),
    }));
    addVideos(service.videos, base, videos => update({ services: content.services.map((s, j) => (j === i ? { ...s, videos } : s)) }));
  });

  /* Réalisations */
  content.projects.forEach((project, i) => {
    const tr = project.i18n?.[lang];
    const replace = (next: typeof project) => update({ projects: content.projects.map((p, j) => (j === i ? next : p)) });
    const set = (patch: Record<string, unknown>) => replace(withTr(project, lang, patch));
    const base = { group: 'Réalisations', subgroup: `${project.title}${project.published ? '' : ' (brouillon)'}` };
    add({ ...base, label: 'Titre', source: project.title, value: tr?.title ?? '', set: v => set({ title: v }) });
    add({ ...base, label: 'Résumé', source: project.description, value: tr?.description ?? '', multiline: true, set: v => set({ description: v }) });
    add({ ...base, label: 'Description détaillée', source: project.details, value: tr?.details ?? '', multiline: true, set: v => set({ details: v }) });
    add({ ...base, label: 'Ville / quartier', source: project.location, value: tr?.location ?? '', set: v => set({ location: v }) });
    add({ ...base, label: 'Durée', source: project.duration, value: tr?.duration ?? '', set: v => set({ duration: v }) });
    if (project.client.visibility === 'anonyme') {
      add({ ...base, label: 'Libellé du client', source: project.client.label, value: tr?.clientLabel ?? '', set: v => set({ clientLabel: v }) });
    }
    project.steps.forEach((step, k) => {
      const stepTr = step.i18n?.[lang];
      const setStep = (patch: Record<string, unknown>) => replace({ ...project, steps: project.steps.map((s, m) => (m === k ? withTr(s, lang, patch) : s)) });
      add({ ...base, label: `Étape ${k + 1} – titre`, source: step.title, value: stepTr?.title ?? '', set: v => setStep({ title: v }) });
      add({ ...base, label: `Étape ${k + 1} – texte`, source: step.text, value: stepTr?.text ?? '', multiline: true, set: v => setStep({ text: v }) });
    });
    addVideos(project.videos, base, videos => replace({ ...project, videos }));
  });

  /* FAQ */
  content.faq.forEach((item, i) => {
    const tr = item.i18n?.[lang];
    const set = (patch: Record<string, unknown>) => update({ faq: content.faq.map((f, j) => (j === i ? withTr(f, lang, patch) : f)) });
    const base = { group: 'FAQ', subgroup: `Question ${i + 1}` };
    add({ ...base, label: 'Question', source: item.q, value: tr?.q ?? '', set: v => set({ q: v }) });
    add({ ...base, label: 'Réponse', source: item.a, value: tr?.a ?? '', multiline: true, set: v => set({ a: v }) });
  });

  /* Vidéos mises en avant */
  addVideos(content.videos ?? [], { group: 'Vidéos mises en avant' }, videos => update({ videos }));

  return entries;

  function addVideos(videos: MediaLink[], base: { group: string; subgroup?: string }, save: (videos: MediaLink[]) => void) {
    videos.forEach((video, k) => add({
      ...base, label: `Titre de la vidéo ${k + 1}`, source: video.title, value: video.i18n?.[lang]?.title ?? '',
      set: v => save(videos.map((x, m) => (m === k ? withTr(x, lang, { title: v }) : x))),
    }));
  }
}

function TranslationRow({ entry, langLabel }: { entry: Entry; langLabel: string }) {
  const missing = !entry.value.trim();
  return (
    <div className={`a-tr-row ${missing ? 'missing' : ''}`}>
      <div className="a-tr-source">
        <span className="a-label">{entry.label} <small>· Français</small></span>
        <p>{entry.source}</p>
      </div>
      <div className="a-tr-target">
        <span className="a-label">
          {langLabel}
          {missing && (
            <button type="button" className="a-tr-copy" onClick={() => entry.set(entry.source)} title="Partir du texte français">
              <Copy size={13} /> Copier le français
            </button>
          )}
        </span>
        {entry.multiline
          ? <textarea rows={3} value={entry.value} onChange={e => entry.set(e.target.value)} placeholder="Traduction…" />
          : <input value={entry.value} onChange={e => entry.set(e.target.value)} placeholder="Traduction…" />}
      </div>
    </div>
  );
}

export function TranslationsTab({ content, update }: TabProps) {
  const [lang, setLang] = useState<TranslatedLang>(translatedLanguages[0]);
  const [onlyMissing, setOnlyMissing] = useState(false);

  const entries = collectEntries(content, update, lang);
  const done = entries.filter(e => e.value.trim()).length;
  const percent = entries.length ? Math.round((done / entries.length) * 100) : 100;
  const visible = onlyMissing ? entries.filter(e => !e.value.trim()) : entries;
  const langLabel = languageNames[lang].label;

  // Regroupement : groupe → sous-groupe → lignes
  const groups = new Map<string, Map<string, Entry[]>>();
  for (const entry of visible) {
    const sub = groups.get(entry.group) ?? new Map<string, Entry[]>();
    const key = entry.subgroup ?? '';
    sub.set(key, [...(sub.get(key) ?? []), entry]);
    groups.set(entry.group, sub);
  }

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2><Languages size={20} /> Traductions</h2>
        <p className="a-muted">
          Le français est la langue de référence. Traduisez ici les textes que vous avez saisis dans les autres onglets.
          Tant qu’une traduction manque, le visiteur voit le texte français : rien n’est jamais vide.
          Les menus, boutons et formulaires sont déjà traduits.
        </p>
        <div className="a-row a-between">
          {translatedLanguages.length > 1 ? (
            <select value={lang} onChange={e => setLang(e.target.value as TranslatedLang)} aria-label="Langue">
              {translatedLanguages.map(l => <option key={l} value={l}>{languageNames[l].label}</option>)}
            </select>
          ) : <strong>{langLabel}</strong>}
          <label className="a-row">
            <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} style={{ width: 'auto' }} />
            Seulement les traductions manquantes
          </label>
        </div>
        <div className="a-progress" aria-label={`${percent} % traduit`}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="a-muted">{done} / {entries.length} textes traduits ({percent} %)</p>
      </section>

      {visible.length === 0 && <section className="a-card"><p className="a-empty">Tout est traduit.</p></section>}

      {Array.from(groups).map(([groupName, subgroups]) => (
        <section key={groupName} className="a-card">
          <h2>{groupName}</h2>
          {Array.from(subgroups).map(([subName, rows]) => (
            <div key={subName} className="a-tr-group">
              {subName && <h3>{subName}</h3>}
              {rows.map((entry, i) => <TranslationRow key={`${entry.label}-${i}`} entry={entry} langLabel={langLabel} />)}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { ShieldCheck, EyeOff, Download, KeyRound, LogOut, Bell, Send, Archive, History, RotateCcw } from 'lucide-react';
import { TextInput, TextArea, Select, Toggle, ImageField, ImageListField, StringListField, VideoListField, ListEditor, BilingualField } from './fields';
import { slugify, changePassword, fetchMessages, setMessageStatus, deleteMessage, fetchNotificationStatus, sendTestNotification, runBackup, downloadBackup, fetchVersions, restoreVersion } from './api';
import type { ServerMessage, ChannelName } from './api';
import { useAdminText } from './i18n';
import { Rich } from './Rich';
import { serviceIcons } from '../content/icons';
import { publicClientLabel } from '../content/privacy';
import { serviceCategories } from '../content/types';
import type { SiteContent, Service, Project, FaqItem, Stat, ClientVisibility, ServiceCategory, Testimonial, MaintenancePlan, Partner } from '../content/types';
import { exportMessages } from '../lib/messages';
import { useUi } from '../i18n/context';

type TabProps = {
  content: SiteContent;
  update: (patch: Partial<SiteContent>) => void;
};

/* =========================
   Général : entreprise, réseaux, accueil, chiffres
   ========================= */
export function GeneralTab({ content, update }: TabProps) {
  const t = useAdminText().general;
  const company = content.company;
  const setCompany = (patch: Partial<typeof company>) => update({ company: { ...company, ...patch } });
  const setSocial = (key: keyof typeof company.socials, value: string) => setCompany({ socials: { ...company.socials, [key]: value } });
  const companyEn = company.i18n?.en ?? {};
  const setCompanyEn = (patch: Partial<NonNullable<NonNullable<typeof company.i18n>['en']>>) =>
    setCompany({ i18n: { ...company.i18n, en: { ...companyEn, ...patch } } });

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2>{t.company}</h2>
        <div className="a-grid">
          <TextInput label={t.name} value={company.name} onChange={v => setCompany({ name: v })} />
          <BilingualField label={t.tagline} value={company.tagline} onChange={v => setCompany({ tagline: v })} en={companyEn.tagline ?? ''} onChangeEn={v => setCompanyEn({ tagline: v })} />
          <TextInput label={t.phone} value={company.phone} onChange={v => setCompany({ phone: v })} />
          <TextInput label={t.whatsapp} value={company.whatsapp} onChange={v => setCompany({ whatsapp: v.replace(/\D/g, '') })} hint={t.whatsappHint} />
          <TextInput label={t.email} type="email" value={company.email} onChange={v => setCompany({ email: v })} />
          <TextInput label={t.website} value={company.website} onChange={v => setCompany({ website: v })} />
          <BilingualField label={t.area} value={company.city} onChange={v => setCompany({ city: v })} en={companyEn.city ?? ''} onChangeEn={v => setCompanyEn({ city: v })} />
          <BilingualField label={t.hours} value={company.hours} onChange={v => setCompany({ hours: v })} en={companyEn.hours ?? ''} onChangeEn={v => setCompanyEn({ hours: v })} />
          <TextInput label={t.map} value={company.mapQuery} onChange={v => setCompany({ mapQuery: v })} hint={t.mapHint} />
        </div>
      </section>

      <section className="a-card">
        <h2>{t.footer}</h2>
        <p className="a-muted">{t.footerHint}</p>
        <BilingualField
          label={t.footerTitle}
          value={company.footerTitle ?? ''}
          onChange={v => setCompany({ footerTitle: v })}
          en={companyEn.footerTitle ?? ''}
          onChangeEn={v => setCompanyEn({ footerTitle: v })}
        />
        <BilingualField
          label={t.footerText}
          value={company.footerText ?? ''}
          onChange={v => setCompany({ footerText: v })}
          en={companyEn.footerText ?? ''}
          onChangeEn={v => setCompanyEn({ footerText: v })}
          multiline
        />
      </section>

      <section className="a-card">
        <h2>{t.socials}</h2>
        <p className="a-muted">{t.socialsHint}</p>
        <div className="a-grid">
          <TextInput label="Facebook" value={company.socials.facebook} onChange={v => setSocial('facebook', v)} placeholder="https://facebook.com/…" />
          <TextInput label="Instagram" value={company.socials.instagram} onChange={v => setSocial('instagram', v)} placeholder="https://instagram.com/…" />
          <TextInput label="TikTok" value={company.socials.tiktok} onChange={v => setSocial('tiktok', v)} placeholder="https://tiktok.com/@…" />
          <TextInput label="YouTube" value={company.socials.youtube} onChange={v => setSocial('youtube', v)} placeholder="https://youtube.com/@…" />
          <TextInput label="LinkedIn" value={company.socials.linkedin} onChange={v => setSocial('linkedin', v)} placeholder="https://linkedin.com/company/…" />
          <TextInput label={t.googleReviews} value={company.googleReviewsUrl ?? ''} onChange={v => setCompany({ googleReviewsUrl: v })} placeholder="https://g.page/r/…" hint={t.googleReviewsHint} />
        </div>
      </section>

      <section className="a-card">
        <h2>{t.home}</h2>
        <TextInput label={t.eyebrow} value={content.hero.eyebrow ?? ''} onChange={v => update({ hero: { ...content.hero, eyebrow: v } })} hint={t.eyebrowHint} />
        <TextArea label={t.description} value={content.hero.description} onChange={v => update({ hero: { ...content.hero, description: v } })} rows={3} />
        <ImageListField
          label={t.slides}
          value={content.hero.slides}
          onChange={v => update({ hero: { ...content.hero, slides: v } })}
          folder="accueil"
          hint={t.slidesHint}
        />
      </section>

      <section className="a-card">
        <h2>{t.stats}</h2>
        <ListEditor<Stat>
          items={content.stats}
          onChange={stats => update({ stats })}
          itemTitle={s => `${s.prefix}${s.value}${s.suffix} ${s.label}`}
          addLabel={t.addStat}
          createItem={() => ({ value: 0, prefix: '', suffix: '', label: '' })}
          renderItem={(s, set) => (
            <div className="a-grid">
              <TextInput label={t.value} type="number" value={String(s.value)} onChange={v => set({ value: Number(v) || 0 })} />
              <TextInput label={t.prefix} value={s.prefix} onChange={v => set({ prefix: v })} />
              <TextInput label={t.suffix} value={s.suffix} onChange={v => set({ suffix: v })} />
              <TextInput label={t.label} value={s.label} onChange={v => set({ label: v })} />
            </div>
          )}
        />
      </section>
    </div>
  );
}

/* =========================
   Services
   ========================= */
export function ServicesTab({ content, update }: TabProps) {
  const a = useAdminText();
  const t = a.services;
  const ui = useUi();
  const iconOptions = Object.keys(serviceIcons).map(value => ({ value, label: a.icons[value] ?? value }));
  const categoryOptions = serviceCategories.map(c => ({ value: c, label: ui.categories[c] ?? c }));

  return (
    <section className="a-card">
      <h2>{t.title(content.services.length)}</h2>
      <p className="a-muted">{t.intro}</p>
      <ListEditor<Service>
        items={content.services}
        onChange={services => update({ services })}
        itemTitle={s => s.title}
        itemBadge={s => (s.featured ? <span className="a-badge">{t.homeBadge}</span> : null)}
        addLabel={t.add}
        createItem={() => ({
          slug: '', title: t.newTitle, category: 'Finitions', icon: 'maison', short: '', intro: '',
          image: '', features: [], steps: [], featured: false, videos: [],
        })}
        renderItem={(s, set) => {
          const Icon = serviceIcons[s.icon]?.icon;
          return (
            <div className="a-stack">
              <div className="a-grid">
                <TextInput label={t.fieldTitle} value={s.title} onChange={v => set({ title: v, slug: s.slug || slugify(v) })} />
                <TextInput label={t.slug} value={s.slug} onChange={v => set({ slug: slugify(v) })} hint={`/services/${s.slug || '…'}`} />
                <Select<ServiceCategory> label={t.category} value={s.category} options={categoryOptions} onChange={v => set({ category: v })} />
                <Select<string> label={t.icon} value={s.icon} options={iconOptions} onChange={v => set({ icon: v })} hint={Icon ? <span className="a-icon-preview"><Icon size={18} /> {t.preview}</span> : undefined} />
              </div>
              <Toggle label={t.featured} checked={s.featured} onChange={v => set({ featured: v })} />
              <TextArea label={t.short} value={s.short} onChange={v => set({ short: v })} rows={2} />
              <TextArea label={t.intro2} value={s.intro} onChange={v => set({ intro: v })} rows={5} />
              <ImageField label={t.image} value={s.image} onChange={v => set({ image: v })} folder="services" />
              <div className="a-grid">
                <StringListField label={t.features} value={s.features} onChange={v => set({ features: v })} placeholder={t.featuresPlaceholder} />
                <StringListField label={t.steps} value={s.steps} onChange={v => set({ steps: v })} placeholder={t.stepsPlaceholder} />
              </div>
              <VideoListField value={s.videos} onChange={v => set({ videos: v })} folder="services" />
            </div>
          );
        }}
      />
    </section>
  );
}

/* =========================
   Réalisations : documentation des chantiers + confidentialité
   ========================= */
export function ProjectsTab({ content, update }: TabProps) {
  const t = useAdminText().projects;
  const serviceOptions = content.services.map(s => ({ value: s.slug, label: s.title }));
  const published = content.projects.filter(p => p.published).length;
  const visibilityOptions: { value: ClientVisibility; label: string }[] = [
    { value: 'anonyme', label: t.visibilityAnon },
    { value: 'initiales', label: t.visibilityInitials },
    { value: 'public', label: t.visibilityPublic },
  ];

  return (
    <section className="a-card">
      <h2>{t.title(published, content.projects.length - published)}</h2>
      <p className="a-muted">{t.intro}</p>
      <ListEditor<Project>
        items={content.projects}
        onChange={projects => update({ projects })}
        itemTitle={p => p.title}
        itemBadge={p => (p.published
          ? <span className="a-badge ok">{t.published}</span>
          : <span className="a-badge"><EyeOff size={12} /> {t.draft}</span>)}
        addLabel={t.add}
        createItem={() => ({
          slug: '', title: t.newTitle, service: content.services[0]?.slug ?? '', location: '', year: String(new Date().getFullYear()),
          duration: '', surface: '', image: '', gallery: [], description: '', details: '',
          client: { visibility: 'anonyme', label: t.newClientLabel, name: '', notes: '' },
          steps: [], videos: [], published: false,
        })}
        renderItem={(p, set) => {
          const setClient = (patch: Partial<Project['client']>) => set({ client: { ...p.client, ...patch } });
          const folder = `projets/${p.slug || 'nouveau'}`;
          return (
            <div className="a-stack">
              <Toggle label={t.publish} checked={p.published} onChange={v => set({ published: v })} hint={t.publishHint} />
              <div className="a-grid">
                <TextInput label={t.fieldTitle} value={p.title} onChange={v => set({ title: v, slug: p.slug || slugify(v) })} />
                <TextInput label={t.slug} value={p.slug} onChange={v => set({ slug: slugify(v) })} hint={`/realisations/${p.slug || '…'}`} />
                <Select<string> label={t.service} value={p.service} options={serviceOptions} onChange={v => set({ service: v })} />
                <TextInput label={t.location} value={p.location} onChange={v => set({ location: v })} hint={t.locationHint} />
                <TextInput label={t.year} value={p.year} onChange={v => set({ year: v })} />
                <TextInput label={t.duration} value={p.duration} onChange={v => set({ duration: v })} placeholder={t.durationPlaceholder} />
                <TextInput label={t.surface} value={p.surface} onChange={v => set({ surface: v })} placeholder={t.surfacePlaceholder} />
              </div>

              <fieldset className="a-private">
                <legend><ShieldCheck size={16} /> {t.privacy}</legend>
                <div className="a-grid">
                  <TextInput label={t.clientName} value={p.client.name ?? ''} onChange={v => setClient({ name: v })} hint={t.clientNameHint} />
                  <Select<ClientVisibility> label={t.visibility} value={p.client.visibility} options={visibilityOptions} onChange={v => setClient({ visibility: v })} />
                  <TextInput label={t.clientLabel} value={p.client.label} onChange={v => setClient({ label: v })} placeholder={t.clientLabelPlaceholder} />
                </div>
                <TextArea label={t.notes} value={p.client.notes ?? ''} onChange={v => setClient({ notes: v })} rows={3} hint={t.notesHint} />
                <p className="a-preview">{t.shownAs} <strong>{t.client} : {publicClientLabel(p.client)}</strong></p>
                {p.client.visibility === 'public' && <p className="a-warning">{t.publicWarning}</p>}
              </fieldset>

              <TextArea label={t.summary} value={p.description} onChange={v => set({ description: v })} rows={2} />
              <TextArea label={t.details} value={p.details} onChange={v => set({ details: v })} rows={5} />
              <ImageField label={t.mainPhoto} value={p.image} onChange={v => set({ image: v })} folder={folder} />
              <ImageListField label={t.gallery} value={p.gallery} onChange={v => set({ gallery: v })} folder={folder} hint={t.galleryHint} />

              <div className="a-field">
                <span className="a-label">{t.journal}</span>
                <small className="a-hint">{t.journalHint}</small>
                <ListEditor<Project['steps'][number]>
                  items={p.steps}
                  onChange={steps => set({ steps })}
                  itemTitle={(s, i) => `${i + 1}. ${s.title}`}
                  addLabel={t.addStep}
                  createItem={() => ({ title: '', text: '', image: '' })}
                  renderItem={(s, setStep) => (
                    <div className="a-stack">
                      <TextInput label={t.step} value={s.title} onChange={v => setStep({ title: v })} placeholder={t.stepPlaceholder} />
                      <TextArea label={t.stepText} value={s.text} onChange={v => setStep({ text: v })} rows={3} />
                      <ImageField label={t.stepPhoto} value={s.image} onChange={v => setStep({ image: v })} folder={folder} />
                    </div>
                  )}
                />
              </div>

              <VideoListField value={p.videos} onChange={v => set({ videos: v })} folder={folder} />
            </div>
          );
        }}
      />
    </section>
  );
}

/* =========================
   Vidéos mises en avant + récapitulatif de toutes les vidéos du site
   ========================= */
export function VideosTab({ content, update, goTo }: TabProps & { goTo: (tab: 'services' | 'projects') => void }) {
  const t = useAdminText().videos;
  const attached = [
    ...content.projects.flatMap(p => p.videos.filter(v => v.url).map(v => ({ v, where: t.fromProject(p.title, !p.published) }))),
    ...content.services.flatMap(s => s.videos.filter(v => v.url).map(v => ({ v, where: t.fromService(s.title) }))),
  ];

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2>{t.featured}</h2>
        <p className="a-muted"><Rich text={t.featuredIntro} /></p>
        <VideoListField label={t.field} value={content.videos ?? []} onChange={videos => update({ videos })} folder="videos" />
      </section>

      <section className="a-card">
        <h2>{t.attached(attached.length)}</h2>
        <p className="a-muted"><Rich text={t.attachedIntro} /></p>
        {attached.length === 0 ? <p className="a-empty">{t.none}</p> : (
          <ul className="a-video-summary">
            {attached.map(({ v, where }, i) => (
              <li key={`${v.url}-${i}`}>
                <strong>{v.title || v.url}</strong>
                <small>{where}</small>
              </li>
            ))}
          </ul>
        )}
        <div className="a-row">
          <button type="button" className="a-btn a-btn-light" onClick={() => goTo('projects')}>{t.addToProject}</button>
          <button type="button" className="a-btn a-btn-light" onClick={() => goTo('services')}>{t.addToService}</button>
        </div>
      </section>
    </div>
  );
}

/* =========================
   Sécurité : changement du mot de passe
   ========================= */
export function SecurityTab({ onLogout }: { onLogout: () => void }) {
  const t = useAdminText().security;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmation) {
      setMessage({ ok: false, text: t.mismatch });
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setMessage({ ok: true, text: t.changed });
      setCurrent('');
      setNext('');
      setConfirmation('');
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : t.failed });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2><KeyRound size={20} /> {t.change}</h2>
        <form className="a-password-form" onSubmit={submit}>
          <TextInput label={t.current} type="password" value={current} onChange={setCurrent} />
          <TextInput label={t.next} type="password" value={next} onChange={setNext} hint={t.nextHint} />
          <TextInput label={t.confirm} type="password" value={confirmation} onChange={setConfirmation} />
          {message && <p className={message.ok ? 'a-success' : 'a-error'}>{message.text}</p>}
          <button type="submit" className="a-btn a-btn-primary" disabled={busy || !current || !next}>{t.submit}</button>
        </form>
      </section>

      <AlertsCard />
      <BackupsCard />
      <VersionsCard />

      <section className="a-card">
        <h2>{t.session}</h2>
        <p className="a-muted"><Rich text={t.sessionText} /></p>
        <button type="button" className="a-btn a-btn-dark" onClick={onLogout}><LogOut size={16} /> {t.logout}</button>
      </section>
    </div>
  );
}

/** Canaux d'alerte actifs + test */
function AlertsCard() {
  const t = useAdminText().security;
  const [status, setStatus] = useState<Record<ChannelName, boolean> | null>(null);
  const [results, setResults] = useState<Partial<Record<ChannelName, string>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotificationStatus().then(setStatus).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const test = async () => {
    setBusy(true);
    setError('');
    try {
      setResults(await sendTestNotification());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const names = Object.keys(t.channels) as ChannelName[];
  const anyActive = status && names.some(n => status[n]);

  return (
    <section className="a-card">
      <h2><Bell size={20} /> {t.alertsTitle}</h2>
      <p className="a-muted"><Rich text={t.alertsIntro} /></p>
      {status && (
        <ul className="a-channels">
          {names.map(name => (
            <li key={name} className={status[name] ? 'on' : ''}>
              <strong>{t.channels[name]}</strong>
              <span>{status[name] ? t.active : t.inactive}</span>
              {results?.[name] && <small>{results[name] === 'ok' ? `✓ ${t.testOk}` : `✗ ${results[name]}`}</small>}
            </li>
          ))}
        </ul>
      )}
      {status && !anyActive && <p className="a-warning"><Rich text={t.noChannel} /></p>}
      {error && <p className="a-error">{error}</p>}
      <button type="button" className="a-btn a-btn-light" disabled={busy || !anyActive} onClick={test}>
        <Send size={16} /> {busy ? t.testing : t.test}
      </button>
    </section>
  );
}

/** Versions précédentes du contenu : restauration en un clic */
function VersionsCard() {
  const a = useAdminText();
  const t = a.versions;
  const [versions, setVersions] = useState<{ file: string; date: string }[] | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchVersions().then(setVersions).catch(e => setMessage({ ok: false, text: String(e.message ?? e) }));
  }, []);

  const format = (iso: string) => new Date(iso).toLocaleString(a.locale, { dateStyle: 'long', timeStyle: 'short' });

  const restore = async (file: string, date: string) => {
    if (!confirm(t.confirm(format(date)))) return;
    try {
      await restoreVersion(file);
      setMessage({ ok: true, text: t.restored });
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <section className="a-card">
      <h2><History size={20} /> {t.title}</h2>
      <p className="a-muted">{t.intro}</p>
      {message && <p className={message.ok ? 'a-success' : 'a-error'}>{message.text}</p>}
      {versions && versions.length === 0 && <p className="a-empty">{t.empty}</p>}
      {versions && versions.length > 0 && (
        <ul className="a-versions">
          {versions.map(v => (
            <li key={v.file}>
              <span>{format(v.date)}</span>
              <button type="button" className="a-btn a-btn-light" onClick={() => restore(v.file, v.date)}>
                <RotateCcw size={16} /> {t.restore}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Sauvegarde immédiate + téléchargement */
function BackupsCard() {
  const t = useAdminText().security;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const now = async () => {
    setBusy(true);
    try {
      const { name, sent } = await runBackup();
      const channels = Object.entries(sent).map(([k, v]) => `${k} : ${v}`).join(', ');
      setMessage({ ok: true, text: `${t.backupDone(name)}${channels ? ` (${channels})` : ''}` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="a-card">
      <h2><Archive size={20} /> {t.backupsTitle}</h2>
      <p className="a-muted">{t.backupsIntro}</p>
      {message && <p className={message.ok ? 'a-success' : 'a-error'}>{message.text}</p>}
      <div className="a-row">
        <button type="button" className="a-btn a-btn-light" disabled={busy} onClick={now}><Archive size={16} /> {t.backupNow}</button>
        <button type="button" className="a-btn a-btn-light" onClick={() => downloadBackup().catch(e => setMessage({ ok: false, text: String(e.message ?? e) }))}>
          <Download size={16} /> {t.download}
        </button>
      </div>
    </section>
  );
}

/* =========================
   Avis clients (publiés uniquement avec l'accord écrit du client)
   ========================= */
export function TestimonialsTab({ content, update }: TabProps) {
  const t = useAdminText().testimonials;
  const items = content.testimonials ?? [];
  const published = items.filter(i => i.published && i.consent).length;
  const projectOptions = [{ value: '', label: t.noProject }, ...content.projects.map(p => ({ value: p.slug, label: p.title }))];
  const ratingOptions = [5, 4, 3, 2, 1].map(n => ({ value: String(n), label: t.stars(n) }));

  return (
    <section className="a-card">
      <h2>{t.title(published, items.length)}</h2>
      <p className="a-muted"><Rich text={t.intro} /></p>
      <ListEditor<Testimonial>
        items={items}
        onChange={testimonials => update({ testimonials })}
        itemTitle={i => i.name}
        itemBadge={i => (i.published && i.consent
          ? <span className="a-badge ok">{t.badgePublished}</span>
          : !i.consent
            ? <span className="a-badge warn">{t.badgeNoConsent}</span>
            : <span className="a-badge"><EyeOff size={12} /> {t.badgeDraft}</span>)}
        addLabel={t.add}
        createItem={() => ({
          id: `avis_${Date.now().toString(36)}`, name: t.newName, role: '', text: '', rating: 5, project: '',
          date: new Date().toISOString().slice(0, 7), consent: false, published: false,
        })}
        renderItem={(item, set) => {
          const en = item.i18n?.en ?? {};
          const setEn = (patch: Record<string, string>) => set({ i18n: { ...item.i18n, en: { ...en, ...patch } } });
          return (
            <div className="a-stack">
              <Toggle label={t.consent} checked={item.consent} onChange={v => set({ consent: v, published: v ? item.published : false })} hint={t.consentHint} />
              <Toggle
                label={t.publish}
                checked={item.published && item.consent}
                onChange={v => item.consent && set({ published: v })}
                hint={item.consent ? undefined : t.publishNeedsConsent}
              />
              <div className="a-grid">
                <TextInput label={t.name} value={item.name} onChange={v => set({ name: v })} hint={t.nameHint} />
                <Select<string> label={t.rating} value={String(item.rating)} options={ratingOptions} onChange={v => set({ rating: Number(v) })} />
                <Select<string> label={t.project} value={item.project} options={projectOptions} onChange={v => set({ project: v })} />
                <TextInput label={t.date} type="month" value={item.date} onChange={v => set({ date: v })} />
              </div>
              <BilingualField label={t.role} value={item.role} onChange={v => set({ role: v })} en={en.role ?? ''} onChangeEn={v => setEn({ role: v })} />
              <BilingualField label={t.text} value={item.text} onChange={v => set({ text: v })} en={en.text ?? ''} onChangeEn={v => setEn({ text: v })} hint={t.textHint} multiline rows={4} />
              <VideoListField
                label={t.video}
                value={item.video?.url ? [item.video] : []}
                onChange={videos => set({ video: videos[videos.length - 1] })}
                folder="avis"
              />
              <small className="a-hint">{t.videoHint}</small>
            </div>
          );
        }}
      />
    </section>
  );
}

/* =========================
   Page Maintenance : formules (prix en FCFA) et partenaires
   ========================= */
export function MaintenanceTab({ content, update }: TabProps) {
  const t = useAdminText().maintenance;
  const maintenance = content.maintenance ?? { plans: [], partners: [] };
  const set = (patch: Partial<typeof maintenance>) => update({ maintenance: { ...maintenance, ...patch } });

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2>{t.plans}</h2>
        <p className="a-muted">{t.intro}</p>
        <ListEditor<MaintenancePlan>
          items={maintenance.plans}
          onChange={plans => set({ plans })}
          itemTitle={p => `${p.title} — ${p.price}`}
          itemBadge={p => (p.featured ? <span className="a-badge ok">★</span> : null)}
          addLabel={t.addPlan}
          createItem={() => ({ title: t.newPlan, description: '', features: [], price: '', featured: false })}
          renderItem={(p, setPlan) => {
            const en = p.i18n?.en ?? {};
            const setEn = (patch: NonNullable<MaintenancePlan['i18n']>['en']) => setPlan({ i18n: { ...p.i18n, en: { ...en, ...patch } } });
            return (
              <div className="a-stack">
                {/* Une seule formule mise en avant à la fois */}
                <Toggle
                  label={t.featured}
                  checked={p.featured}
                  onChange={v => set({ plans: maintenance.plans.map(x => (x === p ? { ...x, featured: v } : v ? { ...x, featured: false } : x)) })}
                />
                <BilingualField label={t.planTitle} value={p.title} onChange={v => setPlan({ title: v })} en={en.title ?? ''} onChangeEn={v => setEn({ title: v })} />
                <BilingualField label={t.price} value={p.price} onChange={v => setPlan({ price: v })} en={en.price ?? ''} onChangeEn={v => setEn({ price: v })} hint={t.pricePlaceholder} />
                <BilingualField label={t.description} value={p.description} onChange={v => setPlan({ description: v })} en={en.description ?? ''} onChangeEn={v => setEn({ description: v })} multiline />
                <div className="a-grid">
                  <StringListField label={`${t.features} (FR)`} value={p.features} onChange={v => setPlan({ features: v })} placeholder={t.featuresPlaceholder} />
                  <StringListField label={`${t.features} (EN)`} value={en.features ?? []} onChange={v => setEn({ features: v })} />
                </div>
              </div>
            );
          }}
        />
      </section>

      <section className="a-card">
        <h2>{t.partners}</h2>
        <ListEditor<Partner>
          items={maintenance.partners}
          onChange={partners => set({ partners })}
          itemTitle={p => p.name}
          addLabel={t.addPartner}
          createItem={() => ({ name: t.newPartner, description: '' })}
          renderItem={(p, setPartner) => (
            <div className="a-stack">
              <TextInput label={t.partnerName} value={p.name} onChange={v => setPartner({ name: v })} />
              <BilingualField
                label={t.description}
                value={p.description}
                onChange={v => setPartner({ description: v })}
                en={p.i18n?.en?.description ?? ''}
                onChangeEn={v => setPartner({ i18n: { ...p.i18n, en: { description: v } } })}
              />
            </div>
          )}
        />
      </section>
    </div>
  );
}

/* =========================
   FAQ
   ========================= */
export function FaqTab({ content, update }: TabProps) {
  const t = useAdminText().faq;
  return (
    <section className="a-card">
      <h2>{t.title}</h2>
      <ListEditor<FaqItem>
        items={content.faq}
        onChange={faq => update({ faq })}
        itemTitle={f => f.q}
        addLabel={t.add}
        createItem={() => ({ q: t.newQuestion, a: '' })}
        renderItem={(f, set) => (
          <div className="a-stack">
            <TextInput label={t.question} value={f.q} onChange={v => set({ q: v })} />
            <TextArea label={t.answer} value={f.a} onChange={v => set({ a: v })} rows={4} />
          </div>
        )}
      />
    </section>
  );
}

/* =========================
   Messages reçus par les formulaires Contact et RDV (enregistrés sur le serveur)
   ========================= */
export function MessagesTab() {
  const a = useAdminText();
  const t = a.messages;
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [filter, setFilter] = useState<'tous' | ServerMessage['status']>('tous');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loadFailed = t.loadFailed;

  const reload = useCallback(() => {
    setLoading(true);
    fetchMessages()
      .then(list => { setMessages(list); setError(''); })
      .catch(e => setError(e instanceof Error ? e.message : loadFailed))
      .finally(() => setLoading(false));
  }, [loadFailed]);
  useEffect(reload, [reload]);

  const setStatus = async (id: string, status: ServerMessage['status']) => {
    setMessages(list => list.map(m => (m.id === id ? { ...m, status } : m)));
    await setMessageStatus(id, status).catch(() => reload());
  };
  const remove = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setMessages(list => list.filter(m => m.id !== id));
    await deleteMessage(id).catch(() => reload());
  };

  const unread = messages.filter(m => m.status === 'nouveau').length;
  const visible = filter === 'tous' ? messages : messages.filter(m => m.status === filter);

  return (
    <section className="a-card">
      <div className="a-row a-between">
        <h2>{t.title(messages.length, unread)}</h2>
        <div className="a-row">
          <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} aria-label={t.filter}>
            <option value="tous">{t.all}</option>
            <option value="nouveau">{t.filterNew}</option>
            <option value="lu">{t.filterRead}</option>
            <option value="traité">{t.filterDone}</option>
          </select>
          <button type="button" className="a-btn a-btn-light" onClick={reload}>{t.reload}</button>
          <button type="button" className="a-btn a-btn-light" disabled={!messages.length} onClick={() => exportMessages(messages)}><Download size={16} /> {t.export}</button>
        </div>
      </div>
      <p className="a-muted">{t.intro}</p>
      {error && <p className="a-error">{error}</p>}
      {loading ? <p className="a-empty">{a.loading}</p> : visible.length === 0 ? <p className="a-empty">{t.empty}</p> : (
        <div className="a-messages">
          {visible.map(m => (
            <article key={m.id} className={`a-message ${m.status}`}>
              <header>
                <strong>{m.name}</strong> · <a href={`tel:${m.phone.replace(/\s/g, '')}`}>{m.phone}</a>{m.email && <> · <a href={`mailto:${m.email}`}>{m.email}</a></>}
                <small>{new Date(m.timestamp).toLocaleString(a.locale)} · {m.subject || t.contact}{m.lang && m.lang !== 'fr' ? ` · ${m.lang.toUpperCase()}` : ''}</small>
              </header>
              <p>{m.message}</p>
              <div className="a-row">
                <select value={m.status} onChange={e => setStatus(m.id, e.target.value as ServerMessage['status'])} aria-label={t.status}>
                  <option value="nouveau">{t.statusNew}</option>
                  <option value="lu">{t.statusRead}</option>
                  <option value="traité">{t.statusDone}</option>
                </select>
                <a className="a-btn a-btn-light" href={`https://wa.me/${m.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{t.reply}</a>
                <button type="button" className="a-btn a-btn-ghost" onClick={() => remove(m.id)}>{t.delete}</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================
   Guide : documentation et confidentialité
   ========================= */
export function GuideTab() {
  const t = useAdminText().guide;
  return (
    <div className="a-stack">
      <section className="a-card a-guide">
        <h2>{t.howTitle}</h2>
        <ol>
          {t.how.map(item => <li key={item}><Rich text={item} /></li>)}
        </ol>
      </section>

      <section className="a-card a-guide">
        <h2><ShieldCheck size={20} /> {t.privacyTitle}</h2>
        <ul>
          {t.privacy.map(item => <li key={item}><Rich text={item} /></li>)}
        </ul>
      </section>
    </div>
  );
}

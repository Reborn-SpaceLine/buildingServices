import { useState } from 'react';
import { EyeOff, Copy, MessageCircle, RefreshCw, FileText, Trash2 } from 'lucide-react';
import { TextInput, Select, Toggle, ImageField, ImageListField, ListEditor, BilingualField, UploadButton } from './fields';
import { slugify } from './api';
import { useAdminText } from './i18n';
import type { SiteContent, EstimateRate, EstimateUnit, EstimatorSettings, CatalogItem, Post, ClientSpace, ClientUpdate } from '../content/types';

type TabProps = {
  content: SiteContent;
  update: (patch: Partial<SiteContent>) => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => Math.max(0, Number(v.replace(/\s/g, '').replace(',', '.')) || 0);

/** Code secret d'un espace client : 16 caractères aléatoires (impossible à deviner) */
function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
}

/* =========================
   Estimateur de budget
   ========================= */
const DEFAULT_ESTIMATOR: EstimatorSettings = { rates: [], finishes: { standard: 1, confort: 1.3, premium: 1.75 }, note: '' };

export function EstimatorTab({ content, update }: TabProps) {
  const t = useAdminText().estimator;
  const estimator = content.estimator ?? DEFAULT_ESTIMATOR;
  const set = (patch: Partial<EstimatorSettings>) => update({ estimator: { ...estimator, ...patch } });
  const serviceOptions = content.services.map(s => ({ value: s.slug, label: s.title }));
  const unitOptions = (Object.keys(t.units) as EstimateUnit[]).map(u => ({ value: u, label: t.units[u] }));
  const finishKeys = Object.keys(estimator.finishes) as (keyof EstimatorSettings['finishes'])[];

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2>{t.rates}</h2>
        <p className="a-muted">{t.intro}</p>
        <ListEditor<EstimateRate>
          items={estimator.rates}
          onChange={rates => set({ rates })}
          itemTitle={r => `${r.label} — ${r.low.toLocaleString()} à ${r.high.toLocaleString()} FCFA / ${t.units[r.unit]}`}
          addLabel={t.add}
          createItem={() => ({ id: `t_${Date.now().toString(36)}`, service: content.services[0]?.slug ?? '', label: t.newLabel, unit: 'm2', low: 0, high: 0 })}
          renderItem={(r, setRate) => (
            <div className="a-stack">
              <BilingualField label={t.label} value={r.label} onChange={v => setRate({ label: v })} en={r.i18n?.en?.label ?? ''} onChangeEn={v => setRate({ i18n: { ...r.i18n, en: { label: v } } })} />
              <div className="a-grid">
                <Select<string> label={t.service} value={r.service} options={serviceOptions} onChange={v => setRate({ service: v })} />
                <Select<EstimateUnit> label={t.unit} value={r.unit} options={unitOptions} onChange={v => setRate({ unit: v })} />
                <TextInput label={t.low} type="number" value={String(r.low)} onChange={v => setRate({ low: num(v) })} />
                <TextInput label={t.high} type="number" value={String(r.high)} onChange={v => setRate({ high: num(v) })} />
              </div>
              {r.high < r.low && <p className="a-warning">{t.rangeError}</p>}
            </div>
          )}
        />
      </section>

      <section className="a-card">
        <h2>{t.finishes}</h2>
        <div className="a-grid">
          {finishKeys.map(key => (
            <TextInput
              key={key}
              label={t.finishNames[key]}
              type="number"
              value={String(estimator.finishes[key])}
              onChange={v => set({ finishes: { ...estimator.finishes, [key]: num(v) || 1 } })}
              hint={key === 'confort' ? t.finishHint : undefined}
            />
          ))}
        </div>
        <BilingualField
          label={t.note}
          value={estimator.note}
          onChange={v => set({ note: v })}
          en={estimator.i18n?.en?.note ?? ''}
          onChangeEn={v => set({ i18n: { ...estimator.i18n, en: { note: v } } })}
          multiline
        />
      </section>
    </div>
  );
}

/* =========================
   Catalogue
   ========================= */
export function CatalogTab({ content, update }: TabProps) {
  const t = useAdminText().catalog;
  const items = content.catalog ?? [];

  return (
    <section className="a-card">
      <h2>{t.title(items.length)}</h2>
      <p className="a-muted">{t.intro}</p>
      <ListEditor<CatalogItem>
        items={items}
        onChange={catalog => update({ catalog })}
        itemTitle={i => `${i.name} — ${i.price ? `${i.price.toLocaleString()} FCFA` : t.onQuote}`}
        itemBadge={i => (i.available ? null : <span className="a-badge"><EyeOff size={12} /> {t.unavailableBadge}</span>)}
        addLabel={t.add}
        createItem={() => ({ id: `p_${Date.now().toString(36)}`, name: t.newName, category: items[0]?.category ?? '', description: '', price: 0, priceNote: '', image: '', available: true })}
        renderItem={(item, set) => {
          const en = item.i18n?.en ?? {};
          const setEn = (patch: NonNullable<CatalogItem['i18n']>['en']) => set({ i18n: { ...item.i18n, en: { ...en, ...patch } } });
          return (
            <div className="a-stack">
              <Toggle label={t.available} checked={item.available} onChange={v => set({ available: v })} />
              <BilingualField label={t.name} value={item.name} onChange={v => set({ name: v })} en={en.name ?? ''} onChangeEn={v => setEn({ name: v })} />
              <BilingualField label={t.category} value={item.category} onChange={v => set({ category: v })} en={en.category ?? ''} onChangeEn={v => setEn({ category: v })} hint={t.categoryHint} />
              <BilingualField label={t.description} value={item.description} onChange={v => set({ description: v })} en={en.description ?? ''} onChangeEn={v => setEn({ description: v })} multiline />
              <div className="a-grid">
                <TextInput label={t.price} type="number" value={String(item.price)} onChange={v => set({ price: num(v) })} />
              </div>
              <BilingualField label={t.priceNote} value={item.priceNote} onChange={v => set({ priceNote: v })} en={en.priceNote ?? ''} onChangeEn={v => setEn({ priceNote: v })} hint={t.priceNotePlaceholder} />
              <ImageField label={t.image} value={item.image} onChange={v => set({ image: v })} folder="catalogue" />
            </div>
          );
        }}
      />
    </section>
  );
}

/* =========================
   Blog
   ========================= */
export function BlogTab({ content, update }: TabProps) {
  const t = useAdminText().blog;
  const posts = content.posts ?? [];
  const published = posts.filter(p => p.published).length;

  return (
    <section className="a-card">
      <h2>{t.title(published, posts.length - published)}</h2>
      <p className="a-muted">{t.intro}</p>
      <ListEditor<Post>
        items={posts}
        onChange={list => update({ posts: list })}
        itemTitle={p => `${p.date} · ${p.title}`}
        itemBadge={p => (p.published
          ? <span className="a-badge ok">{t.published}</span>
          : <span className="a-badge"><EyeOff size={12} /> {t.draft}</span>)}
        addLabel={t.add}
        createItem={() => ({ slug: '', title: t.newTitle, excerpt: '', body: '', image: '', date: today(), published: false })}
        renderItem={(p, set) => {
          const en = p.i18n?.en ?? {};
          const setEn = (patch: NonNullable<Post['i18n']>['en']) => set({ i18n: { ...p.i18n, en: { ...en, ...patch } } });
          return (
            <div className="a-stack">
              <Toggle label={t.publish} checked={p.published} onChange={v => set({ published: v })} />
              <BilingualField label={t.fieldTitle} value={p.title} onChange={v => set({ title: v, slug: p.slug || slugify(v) })} en={en.title ?? ''} onChangeEn={v => setEn({ title: v })} />
              <div className="a-grid">
                <TextInput label={t.slug} value={p.slug} onChange={v => set({ slug: slugify(v) })} hint={`/blog/${p.slug || '…'}`} />
                <TextInput label={t.date} type="date" value={p.date} onChange={v => set({ date: v })} />
              </div>
              <BilingualField label={t.excerpt} value={p.excerpt} onChange={v => set({ excerpt: v })} en={en.excerpt ?? ''} onChangeEn={v => setEn({ excerpt: v })} multiline rows={2} />
              <BilingualField label={t.body} value={p.body} onChange={v => set({ body: v })} en={en.body ?? ''} onChangeEn={v => setEn({ body: v })} multiline rows={12} hint={t.bodyHint} />
              <ImageField label={t.image} value={p.image} onChange={v => set({ image: v })} folder="blog" />
            </div>
          );
        }}
      />
    </section>
  );
}

/* =========================
   Espaces clients (suivi de chantier privé)
   ========================= */
function ShareLink({ space, onNewCode }: { space: ClientSpace; onNewCode: () => void }) {
  const t = useAdminText().clients;
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/suivi/${space.code}`;
  const phone = space.phone.replace(/\D/g, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt(t.link, url);
    }
  };

  return (
    <div className="a-field">
      <span className="a-label">{t.link}</span>
      <code className="a-share-link">{url}</code>
      <small className="a-hint">{t.saveFirst}</small>
      <div className="a-row">
        <button type="button" className="a-btn a-btn-light" onClick={copy}><Copy size={16} /> {copied ? t.copied : t.copy}</button>
        {phone && (
          <a className="a-btn a-btn-light" href={`https://wa.me/${phone}?text=${encodeURIComponent(t.shareMessage(space.clientName.split(' ')[0], url))}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={16} /> {t.sendWhatsapp}
          </a>
        )}
        <button type="button" className="a-btn a-btn-ghost" onClick={() => confirm(t.newCodeConfirm) && onNewCode()}><RefreshCw size={16} /> {t.newCode}</button>
      </div>
    </div>
  );
}

export function ClientsTab({ content, update }: TabProps) {
  const t = useAdminText().clients;
  const spaces = content.clientSpaces ?? [];
  const statusOptions = (Object.keys(t.statuses) as ClientSpace['status'][]).map(s => ({ value: s, label: t.statuses[s] }));

  return (
    <section className="a-card">
      <h2>{t.title(spaces.length)}</h2>
      <p className="a-muted">{t.intro}</p>
      <ListEditor<ClientSpace>
        items={spaces}
        onChange={clientSpaces => update({ clientSpaces })}
        itemTitle={s => `${s.clientName} · ${s.projectTitle} (${s.progress} %)`}
        itemBadge={s => (s.active ? null : <span className="a-badge warn">{t.inactiveBadge}</span>)}
        addLabel={t.add}
        createItem={() => ({
          code: newCode(), clientName: t.newClient, phone: '', projectTitle: '', status: 'etude', progress: 0,
          nextStep: '', updates: [], documents: [], active: true,
        })}
        renderItem={(s, set) => {
          const folder = `suivi-${s.code}`;
          return (
            <div className="a-stack">
              <Toggle label={t.active} checked={s.active} onChange={v => set({ active: v })} hint={t.activeHint} />
              <div className="a-grid">
                <TextInput label={t.clientName} value={s.clientName} onChange={v => set({ clientName: v })} />
                <TextInput label={t.phone} value={s.phone} onChange={v => set({ phone: v })} placeholder="237 6XX XX XX XX" />
                <TextInput label={t.projectTitle} value={s.projectTitle} onChange={v => set({ projectTitle: v })} />
                <Select<ClientSpace['status']> label={t.status} value={s.status} options={statusOptions} onChange={v => set({ status: v })} />
                <TextInput label={t.progress} type="number" value={String(s.progress)} onChange={v => set({ progress: Math.min(100, num(v)) })} />
                <TextInput label={t.nextStep} value={s.nextStep} onChange={v => set({ nextStep: v })} />
              </div>
              {s.active && <ShareLink space={s} onNewCode={() => set({ code: newCode() })} />}

              <div className="a-field">
                <span className="a-label">{t.updates}</span>
                <ListEditor<ClientUpdate>
                  items={s.updates}
                  onChange={updates => set({ updates })}
                  itemTitle={u => `${u.date} · ${u.text.slice(0, 60)}`}
                  addLabel={t.addUpdate}
                  createItem={() => ({ date: today(), text: '', images: [] })}
                  renderItem={(u, setUpdate) => (
                    <div className="a-stack">
                      <TextInput label={t.updateDate} type="date" value={u.date} onChange={v => setUpdate({ date: v })} />
                      <label className="a-field">
                        <span className="a-label">{t.updateText}</span>
                        <textarea rows={3} value={u.text} onChange={e => setUpdate({ text: e.target.value })} />
                      </label>
                      <ImageListField label={t.photos} value={u.images} onChange={v => setUpdate({ images: v })} folder={folder} />
                    </div>
                  )}
                />
              </div>

              <div className="a-field">
                <span className="a-label">{t.documents}</span>
                <ul className="a-docs">
                  {s.documents.map((d, i) => (
                    <li key={d.url}>
                      <FileText size={16} />
                      <input
                        value={d.title}
                        placeholder={t.docTitle}
                        aria-label={t.docTitle}
                        onChange={e => set({ documents: s.documents.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                      />
                      <a href={d.url} target="_blank" rel="noopener noreferrer">↗</a>
                      <button type="button" className="a-icon-btn" onClick={() => set({ documents: s.documents.filter((_, j) => j !== i) })} aria-label="×">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <UploadButton
                  accept=".pdf,image/*"
                  folder={folder}
                  multiple
                  label={t.addDocument}
                  onUploaded={urls => set({ documents: [...s.documents, ...urls.map(url => ({ title: '', url }))] })}
                />
              </div>
            </div>
          );
        }}
      />
    </section>
  );
}

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Upload, Trash2, ArrowUp, ArrowDown, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { uploadFile } from './api';
import { useAdminText } from './i18n';
import { platforms, detectPlatform, youtubeId } from '../content/platforms';
import { useUi } from '../i18n/context';
import type { MediaLink, Platform } from '../content/types';

/* =========================
   Champs simples
   ========================= */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="a-field">
      <span className="a-label">{label}</span>
      {children}
      {hint && <small className="a-hint">{hint}</small>}
    </label>
  );
}

export function TextInput({ label, value, onChange, hint, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; placeholder?: string; type?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} value={value ?? ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

export function TextArea({ label, value, onChange, hint, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; rows?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </Field>
  );
}

/** Texte en français + sa traduction anglaise, l'un sous l'autre (la traduction ne peut pas être oubliée) */
export function BilingualField({ label, value, onChange, en, onChangeEn, hint, multiline = false, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; en: string; onChangeEn: (v: string) => void;
  hint?: ReactNode; multiline?: boolean; rows?: number;
}) {
  const t = useAdminText();
  const input = (v: string, set: (v: string) => void, placeholder?: string) => (multiline
    ? <textarea rows={rows} value={v ?? ''} placeholder={placeholder} onChange={e => set(e.target.value)} />
    : <input value={v ?? ''} placeholder={placeholder} onChange={e => set(e.target.value)} />);
  return (
    <div className="a-field a-bilingual">
      <span className="a-label">{label}</span>
      <div className="a-bilingual-row"><span className="a-lang-tag">FR</span>{input(value, onChange)}</div>
      <div className="a-bilingual-row"><span className="a-lang-tag en">EN</span>{input(en, onChangeEn, t.fields.enPlaceholder)}</div>
      {hint && <small className="a-hint">{hint}</small>}
    </div>
  );
}

export function Select<T extends string>({ label, value, options, onChange, hint }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; hint?: ReactNode;
}) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode }) {
  return (
    <label className="a-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="a-toggle-ui" aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        {hint && <small className="a-hint">{hint}</small>}
      </span>
    </label>
  );
}

/* =========================
   Envoi de fichiers
   ========================= */
function useUpload(folder: string) {
  const t = useAdminText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      return await uploadFile(file, folder);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.fields.uploadFailed);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, upload };
}

function UploadButton({ accept, folder, onUploaded, label, multiple = false }: {
  accept: string; folder: string; onUploaded: (urls: string[]) => void; label?: string; multiple?: boolean;
}) {
  const t = useAdminText();
  const input = useRef<HTMLInputElement>(null);
  const { busy, error, upload } = useUpload(folder);

  const handle = async (files: FileList | null) => {
    if (!files) return;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await upload(file);
      if (url) urls.push(url);
    }
    if (urls.length) onUploaded(urls);
    if (input.current) input.current.value = '';
  };

  return (
    <span className="a-upload">
      <input ref={input} type="file" accept={accept} multiple={multiple} hidden onChange={e => handle(e.target.files)} />
      <button type="button" className="a-btn a-btn-light" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 size={16} className="a-spin" /> : <Upload size={16} />} {busy ? t.fields.uploading : (label ?? t.fields.uploadFile)}
      </button>
      {error && <small className="a-error">{error}</small>}
    </span>
  );
}

export function ImageField({ label, value, onChange, folder, hint }: {
  label: string; value: string; onChange: (v: string) => void; folder: string; hint?: ReactNode;
}) {
  const t = useAdminText();
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-image">
        <div className="a-thumb">{value ? <img src={value} alt="" /> : <span>{t.fields.noImage}</span>}</div>
        <div className="a-image-actions">
          <input value={value ?? ''} placeholder={t.fields.imagePlaceholder} onChange={e => onChange(e.target.value)} />
          <div className="a-row">
            <UploadButton accept="image/*" folder={folder} label={t.fields.chooseImage} onUploaded={urls => onChange(urls[0])} />
            {value && <button type="button" className="a-btn a-btn-ghost" onClick={() => onChange('')}><Trash2 size={16} /> {t.fields.remove}</button>}
          </div>
        </div>
      </div>
      {hint && <small className="a-hint">{hint}</small>}
    </div>
  );
}

export function ImageListField({ label, value, onChange, folder, hint }: {
  label: string; value: string[]; onChange: (v: string[]) => void; folder: string; hint?: ReactNode;
}) {
  const t = useAdminText();
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-gallery">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="a-gallery-item">
            <img src={src} alt="" />
            <div className="a-gallery-tools">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t.fields.moveBack}><ArrowUp size={14} /></button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={t.fields.moveForward}><ArrowDown size={14} /></button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t.fields.delete}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <UploadButton accept="image/*" folder={folder} multiple label={t.fields.addPhotos} onUploaded={urls => onChange([...value, ...urls])} />
      {hint && <small className="a-hint">{hint}</small>}
    </div>
  );
}

export function StringListField({ label, value, onChange, placeholder }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const t = useAdminText();
  return (
    <div className="a-field">
      <span className="a-label">{label}</span>
      <div className="a-strings">
        {value.map((item, i) => (
          <div key={i} className="a-row">
            <input value={item} placeholder={placeholder} onChange={e => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} />
            <button type="button" className="a-icon-btn" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t.fields.delete}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button type="button" className="a-btn a-btn-light" onClick={() => onChange([...value, ''])}><Plus size={16} /> {t.fields.addLine}</button>
    </div>
  );
}

/* =========================
   Vidéos : liens vers les réseaux ou fichiers envoyés
   ========================= */

/** Aperçu d'une vidéo dans l'admin */
function VideoPreview({ video }: { video: MediaLink }) {
  const t = useAdminText();
  const ui = useUi();
  const ytId = video.platform === 'youtube' ? youtubeId(video.url) : null;
  if (ytId) return <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" />;
  if (video.platform === 'fichier' && video.url) return <video src={video.url} preload="metadata" muted controls />;
  return (
    <span className="a-video-placeholder" style={{ background: platforms[video.platform]?.color }}>
      {video.url ? ui.media.platforms[video.platform] : t.fields.noVideo}
    </span>
  );
}

export function VideoListField({ value, onChange, folder, label }: {
  value: MediaLink[]; onChange: (v: MediaLink[]) => void; folder: string; label?: string;
}) {
  const t = useAdminText();
  const ui = useUi();
  const platformOptions = (Object.keys(platforms) as Platform[]).map(p => ({ value: p, label: ui.media.platforms[p] }));
  const update = (i: number, patch: Partial<MediaLink>) => onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="a-field">
      <span className="a-label">{label ?? t.fields.videos}</span>
      <small className="a-hint">{t.fields.videosHint}</small>
      {value.map((video, i) => (
        <div key={i} className="a-video">
          <div className="a-video-preview"><VideoPreview video={video} /></div>
          <div className="a-video-fields">
            <input
              value={video.url}
              placeholder={t.fields.videoUrl}
              onChange={e => update(i, { url: e.target.value, platform: detectPlatform(e.target.value) })}
            />
            <div className="a-row">
              <select value={video.platform} onChange={e => update(i, { platform: e.target.value as Platform })} aria-label={t.fields.network}>
                {platformOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input value={video.title} placeholder={t.fields.videoTitle} onChange={e => update(i, { title: e.target.value })} />
            </div>
          </div>
          <div className="a-video-tools">
            <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t.fields.moveUp}><ArrowUp size={16} /></button>
            <button type="button" className="a-icon-btn" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={t.fields.moveDown}><ArrowDown size={16} /></button>
            <button type="button" className="a-icon-btn danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t.fields.delete}><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <div className="a-row">
        <button type="button" className="a-btn a-btn-light" onClick={() => onChange([...value, { platform: 'youtube', url: '', title: '' }])}>
          <Plus size={16} /> {t.fields.addLink}
        </button>
        <UploadButton
          accept="video/mp4,video/webm,video/quicktime"
          folder={folder}
          label={t.fields.uploadVideo}
          onUploaded={urls => onChange([...value, ...urls.map(url => ({ platform: 'fichier' as const, url, title: '' }))])}
        />
      </div>
    </div>
  );
}

/* =========================
   Liste d'éléments repliables (services, projets, FAQ, étapes…)
   ========================= */
export function ListEditor<T>({ items, onChange, renderItem, createItem, itemTitle, itemBadge, addLabel, startOpen }: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  createItem: () => T;
  itemTitle: (item: T, index: number) => string;
  itemBadge?: (item: T) => ReactNode;
  addLabel: string;
  startOpen?: boolean;
}) {
  const t = useAdminText();
  const [open, setOpen] = useState<number | null>(startOpen ? 0 : null);

  const update = (i: number, patch: Partial<T>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
    if (open === i) setOpen(i + dir);
  };
  const remove = (i: number) => {
    if (!confirm(t.fields.confirmDelete(itemTitle(items[i], i)))) return;
    onChange(items.filter((_, j) => j !== i));
    setOpen(null);
  };

  return (
    <div className="a-list">
      {items.map((item, i) => (
        <div key={i} className={`a-item ${open === i ? 'open' : ''}`}>
          <div className="a-item-head">
            <button type="button" className="a-item-title" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <ChevronDown size={18} className="a-chevron" />
              <span>{itemTitle(item, i) || t.fields.untitled}</span>
              {itemBadge?.(item)}
            </button>
            <div className="a-item-tools">
              <button type="button" className="a-icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t.fields.moveUp}><ArrowUp size={16} /></button>
              <button type="button" className="a-icon-btn" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={t.fields.moveDown}><ArrowDown size={16} /></button>
              <button type="button" className="a-icon-btn danger" onClick={() => remove(i)} aria-label={t.fields.delete}><Trash2 size={16} /></button>
            </div>
          </div>
          {open === i && <div className="a-item-body">{renderItem(item, patch => update(i, patch), i)}</div>}
        </div>
      ))}
      <button
        type="button"
        className="a-btn a-btn-dark"
        onClick={() => {
          onChange([...items, createItem()]);
          setOpen(items.length);
        }}
      >
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}

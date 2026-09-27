import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound, Loader2, FileText, CalendarDays, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { PageHero, Lightbox } from '../components/ui';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { useSite, useUi } from '../i18n/context';
import type { ClientSpace } from '../content/types';
import '../styles/pages.css';
import '../styles/shop.css';

type Space = Omit<ClientSpace, 'code' | 'active' | 'phone'>;
type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; space: Space };

/** Espace client : suivi de chantier privé (/suivi/<code>) */
export function TrackingPage() {
  const ui = useUi();
  const t = ui.tracking;
  const { code } = useParams();
  usePageTitle(t.title);

  return (
    <>
      <PageHero eyebrow={t.title} title={t.heroTitle} text={t.heroText} />
      <section className="section">
        <div className="container">
          {code ? <TrackingSpace key={code} code={code} /> : <CodeForm />}
        </div>
      </section>
    </>
  );
}

function CodeForm() {
  const t = useUi().tracking;
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  // Le client peut coller le lien complet ou seulement le code
  const code = value.trim().split('/').filter(Boolean).pop()?.replace(/[^\w-]/g, '') ?? '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code) navigate(`/suivi/${code}`);
  };

  return (
    <form className="tracking-form" onSubmit={submit}>
      <KeyRound />
      <label>
        <span>{t.codeLabel}</span>
        <input value={value} onChange={e => setValue(e.target.value)} autoComplete="off" spellCheck={false} />
        <small>{t.codeHint}</small>
      </label>
      <button type="submit" className="btn btn-primary" disabled={!code}>{t.open} <ArrowRight /></button>
    </form>
  );
}

function TrackingSpace({ code }: { code: string }) {
  const ui = useUi();
  const t = ui.tracking;
  const { whatsappLink } = useSite();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [photos, setPhotos] = useState<{ list: string[]; index: number | null }>({ list: [], index: null });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/suivi/${encodeURIComponent(code)}`, { cache: 'no-store' })
      .then(async res => {
        if (cancelled) return;
        if (res.ok) setState({ kind: 'ready', space: await res.json() });
        else setState({ kind: 'error', message: res.status === 429 ? t.tooMany : t.invalid });
      })
      .catch(() => !cancelled && setState({ kind: 'error', message: t.invalid }));
    return () => { cancelled = true; };
  }, [code, t.invalid, t.tooMany]);

  if (state.kind === 'loading') return <p className="empty-state"><Loader2 className="spin" /> {t.loading}</p>;
  if (state.kind === 'error') return <><p className="empty-state">{state.message}</p><CodeForm /></>;

  const { space } = state;
  const progress = Math.min(100, Math.max(0, space.progress));
  const date = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(ui.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const updates = [...space.updates].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="tracking">
      <header className="tracking-head">
        <p>{t.hello(space.clientName)}</p>
        <h2>{space.projectTitle}</h2>
        <div className="tracking-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t.progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <dl>
          <div><dt>{t.progress}</dt><dd>{progress} %</dd></div>
          <div><dt>{t.status}</dt><dd>{t.statuses[space.status] ?? space.status}</dd></div>
          {space.nextStep && <div><dt>{t.nextStep}</dt><dd>{space.nextStep}</dd></div>}
        </dl>
      </header>

      <div className="tracking-grid">
        <section>
          <h3>{t.updates}</h3>
          {updates.length === 0 ? <p className="empty-state">{t.noUpdates}</p> : (
            <ol className="tracking-log">
              {updates.map((u, i) => (
                <li key={i}>
                  <p className="blog-meta"><CalendarDays size={14} /> {date(u.date)}</p>
                  <p>{u.text}</p>
                  {u.images.length > 0 && (
                    <div className="tracking-photos">
                      {u.images.map((src, j) => (
                        <button key={src} type="button" onClick={() => setPhotos({ list: u.images, index: j })}>
                          <SafeImage src={src} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside>
          {space.documents.length > 0 && (
            <>
              <h3>{t.documents}</h3>
              <ul className="tracking-docs">
                {space.documents.map(d => (
                  <li key={d.url}><a href={d.url} target="_blank" rel="noopener noreferrer"><FileText size={18} /> {d.title || d.url.split('/').pop()}</a></li>
                ))}
              </ul>
            </>
          )}
          <div className="tracking-contact">
            <p>{t.contact}</p>
            <a href={whatsappLink(`${space.projectTitle} – `)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
              <MessageCircle /> {ui.common.writeWhatsapp}
            </a>
          </div>
          <p className="tracking-privacy"><ShieldCheck size={16} /> {t.privacy}</p>
        </aside>
      </div>

      <Lightbox
        images={photos.list}
        index={photos.index}
        onClose={() => setPhotos(p => ({ ...p, index: null }))}
        onChange={index => setPhotos(p => ({ ...p, index }))}
      />
    </div>
  );
}

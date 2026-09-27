import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Save, Download, ExternalLink, Loader2, CheckCircle, AlertCircle, Lock, KeyRound, LogOut, Menu, X, Eye } from 'lucide-react';
import { authStatus, setupPassword, login, logout, fetchContent, saveContent, downloadJson, AuthError } from './api';
import { GeneralTab, ServicesTab, ProjectsTab, TestimonialsTab, MaintenanceTab, VideosTab, FaqTab, MessagesTab, SecurityTab, GuideTab } from './tabs';
import { AgendaTab } from './agenda';
import { StatsTab } from './stats';
import { PREVIEW_KEY } from '../content';
import { toPublicContent } from '../content/privacy';
import { TextInput } from './fields';
import { TranslationsTab } from './translations';
import { useAdminText } from './i18n';
import type { AdminText } from './i18n';
import { Rich, AdminLanguageSwitch } from './Rich';
import type { SiteContent } from '../content/types';
import '../styles/admin.css';

const tabIds = ['general', 'services', 'projects', 'testimonials', 'maintenance', 'videos', 'faq', 'translations', 'agenda', 'messages', 'stats', 'security', 'guide'] as const;

type TabId = typeof tabIds[number];
type Mode = 'loading' | 'unavailable' | 'no-password' | 'setup' | 'login' | 'ready';
/** `message` : texte venant du serveur ou de la validation ; sinon le texte suit la langue */
type Status = { type: 'idle' | 'saving' | 'saved' | 'error' | 'expired'; message?: string };

/** Vérifie les erreurs bloquantes avant d'enregistrer */
function validate(content: SiteContent, t: AdminText) {
  const errors: string[] = [];
  const check = (kind: string, slugs: string[]) => {
    slugs.forEach((slug, i) => {
      if (!slug) errors.push(t.status.emptySlug(kind, i + 1));
      else if (slugs.indexOf(slug) !== i) errors.push(t.status.duplicateSlug(kind, slug));
    });
  };
  check(t.status.kindService, content.services.map(s => s.slug));
  check(t.status.kindProject, content.projects.map(p => p.slug));
  return errors;
}

/** Écran simple (chargement, accès impossible…) avec le sélecteur de langue */
function CenteredCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  const t = useAdminText();
  return (
    <div className="a-center">
      <div className="a-card a-locked">
        <AdminLanguageSwitch className="a-lang-corner" />
        {icon}
        <h1>{title}</h1>
        <p><Rich text={text} /></p>
        <Link to="/" className="a-btn a-btn-dark">{t.backToSite}</Link>
      </div>
    </div>
  );
}

/* =========================
   Écran de connexion / création du mot de passe
   ========================= */
function LoginScreen({ setup, onSuccess }: { setup: boolean; onSuccess: () => void }) {
  const t = useAdminText();
  const l = t.login;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (setup && password !== confirmation) {
      setError(l.mismatch);
      return;
    }
    setBusy(true);
    try {
      if (setup) await setupPassword(password);
      else await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : l.failed);
      setBusy(false);
    }
  };

  return (
    <div className="a-center">
      <div className="a-card a-locked a-login">
        <AdminLanguageSwitch className="a-lang-corner" />
        {setup ? <KeyRound size={32} /> : <Lock size={32} />}
        <h1>{setup ? l.setupTitle : l.title}</h1>
        <p className="a-muted">{setup ? l.setupText : l.text}</p>
        <form onSubmit={submit}>
          <TextInput label={l.password} type="password" value={password} onChange={setPassword} hint={setup ? l.min : undefined} />
          {setup && <TextInput label={l.confirm} type="password" value={confirmation} onChange={setConfirmation} />}
          {error && <p className="a-error" role="alert">{error}</p>}
          <button type="submit" className="a-btn a-btn-primary" disabled={busy || !password}>
            {busy && <Loader2 size={16} className="a-spin" />} {setup ? l.create : l.submit}
          </button>
        </form>
        <Link to="/" className="a-btn a-btn-ghost">{t.backToSite}</Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const t = useAdminText();
  const h = t.header;
  const [mode, setMode] = useState<Mode>('loading');
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saved, setSaved] = useState('');
  const [tab, setTab] = useState<TabId>('general');
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Menu mobile (même principe que celui du site) : fermé au clic à l'extérieur ou avec Échap,
  // et la page ne défile pas derrière tant qu'il est ouvert
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    // Blocage du défilement sur <html> (et non <body>) : sur <body>, l'en-tête collant perdait
    // son repère et remontait en haut de la page, hors de l'écran quand on était en bas
    const root = document.documentElement;
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    root.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      root.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  const openTab = (id: TabId) => {
    setTab(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  /** Charge le contenu après connexion (sans écraser des modifications en cours) */
  const loadContent = async () => {
    try {
      const data = await fetchContent();
      setContent(prev => prev ?? data);
      setSaved(prev => prev || JSON.stringify(data));
      setMode('ready');
    } catch (e) {
      setMode(e instanceof AuthError ? 'login' : 'unavailable');
    }
  };

  useEffect(() => {
    authStatus()
      .then(({ configured, authenticated, canSetup }) => {
        if (!configured) setMode(canSetup ? 'setup' : 'no-password');
        else if (!authenticated) setMode('login');
        else loadContent();
      })
      .catch(() => setMode('unavailable'));
  }, []);

  const dirty = useMemo(() => content !== null && JSON.stringify(content) !== saved, [content, saved]);

  // Avertit avant de quitter avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (patch: Partial<SiteContent>) => {
    setContent(prev => (prev ? { ...prev, ...patch } : prev));
    setStatus({ type: 'idle' });
  };

  const save = async () => {
    if (!content) return;
    const errors = validate(content, t);
    if (errors.length) {
      setStatus({ type: 'error', message: errors.join(' ') });
      return;
    }
    setStatus({ type: 'saving' });
    try {
      await saveContent(content);
      setSaved(JSON.stringify(content));
      setStatus({ type: 'saved' });
    } catch (e) {
      if (e instanceof AuthError) {
        // Session expirée : on se reconnecte, les modifications restent en mémoire
        setStatus({ type: 'expired' });
        setMode('login');
        return;
      }
      setStatus({ type: 'error', message: e instanceof Error ? e.message : undefined });
    }
  };

  /** Aperçu : le site s'ouvre avec le contenu en cours (filtré comme en ligne), sans rien publier */
  const preview = () => {
    if (!content) return;
    try {
      localStorage.setItem(PREVIEW_KEY, JSON.stringify(toPublicContent(content)));
      window.open('/?preview=1', '_blank', 'noopener');
    } catch (e) {
      setStatus({ type: 'error', message: e instanceof Error ? e.message : undefined });
    }
  };

  const exportContent = () => {
    if (content) downloadJson(content, `building-service-contenu-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleLogout = async () => {
    if (dirty && !confirm(t.status.confirmLogout)) return;
    await logout();
    setContent(null);
    setSaved('');
    setMode('login');
  };

  const statusText =
    status.type === 'saved' ? t.status.saved
      : status.type === 'expired' ? t.status.sessionExpired
        : status.type === 'error' ? (status.message ?? t.status.saveError)
          : '';

  if (mode === 'loading') {
    return <div className="a-center"><Loader2 className="a-spin" /> {t.loading}</div>;
  }

  if (mode === 'setup' || mode === 'login') {
    return <LoginScreen setup={mode === 'setup'} onSuccess={loadContent} />;
  }

  if (mode === 'no-password') {
    return <CenteredCard icon={<KeyRound size={32} />} title={t.login.noPasswordTitle} text={t.login.noPasswordText} />;
  }

  if (mode === 'unavailable' || !content) {
    return <CenteredCard icon={<Lock size={32} />} title={t.login.unavailableTitle} text={t.login.unavailableText} />;
  }

  return (
    <div className="admin">
      <header className="a-header" ref={headerRef}>
        <div className="a-bar">
          <div className="a-brand">
            <strong translate="no">Building Service</strong>
            <span>{t.brandSub}</span>
          </div>

          <div className="a-actions">
            <AdminLanguageSwitch />

            {/* Ordinateur : toutes les actions visibles */}
            <a className="a-btn a-btn-ghost a-secondary" href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> {h.viewSite}</a>
            <button className="a-btn a-btn-ghost a-secondary" onClick={preview} title={t.preview.title}>
              <Eye size={16} /> {t.preview.button}
            </button>
            <button className="a-btn a-btn-ghost a-secondary" onClick={exportContent}>
              <Download size={16} /> {h.export}
            </button>

            <button className="a-btn a-btn-primary a-save" disabled={!dirty || status.type === 'saving'} onClick={save}>
              {status.type === 'saving' ? <Loader2 size={16} className="a-spin" /> : <Save size={16} />}
              {dirty ? h.save : h.saved}
              {dirty && <span className="a-dirty" aria-label={h.unsaved} />}
            </button>

            <button className="a-btn a-btn-ghost a-logout a-secondary" onClick={handleLogout} title={h.logoutTitle}>
              <LogOut size={16} /> {h.logout}
            </button>

            {/* Mobile : bouton menu, comme sur le site */}
            <button
              className="a-burger"
              aria-label={menuOpen ? h.closeMenu : h.openMenu}
              aria-expanded={menuOpen}
              aria-controls="admin-mobile-nav"
              onClick={() => setMenuOpen(open => !open)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Ordinateur : onglets sur une ligne */}
        <nav className="a-tabs" aria-label={h.sections}>
          {tabIds.map(id => (
            <button key={id} className={tab === id ? 'active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              {t.tabs[id]}
            </button>
          ))}
        </nav>

        {/* Mobile : panneau déroulant, même style que le menu du site */}
        <nav id="admin-mobile-nav" className={`a-mobile-nav ${menuOpen ? 'open' : ''}`} aria-label={h.sections}>
          {tabIds.map(id => (
            <button key={id} className={`a-mobile-link ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => openTab(id)}>
              {t.tabs[id]}
            </button>
          ))}
          <div className="a-mobile-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
              <ExternalLink size={18} /> {h.viewSite}
            </a>
            <button onClick={() => { preview(); setMenuOpen(false); }}>
              <Eye size={18} /> {t.preview.title}
            </button>
            <button onClick={() => { exportContent(); setMenuOpen(false); }}>
              <Download size={18} /> {h.exportContent}
            </button>
            <button className="danger" onClick={() => { setMenuOpen(false); handleLogout(); }}>
              <LogOut size={18} /> {h.logout}
            </button>
          </div>
        </nav>
      </header>

      {statusText && (
        <div className={`a-status ${status.type === 'saved' ? 'saved' : 'error'}`} role="status">
          {status.type === 'saved' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {statusText}
        </div>
      )}

      <main className="a-main">
        {tab === 'general' && <GeneralTab content={content} update={update} />}
        {tab === 'services' && <ServicesTab content={content} update={update} />}
        {tab === 'projects' && <ProjectsTab content={content} update={update} />}
        {tab === 'testimonials' && <TestimonialsTab content={content} update={update} />}
        {tab === 'maintenance' && <MaintenanceTab content={content} update={update} />}
        {tab === 'videos' && <VideosTab content={content} update={update} goTo={setTab} />}
        {tab === 'faq' && <FaqTab content={content} update={update} />}
        {tab === 'translations' && <TranslationsTab content={content} update={update} />}
        {tab === 'agenda' && <AgendaTab />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'security' && <SecurityTab onLogout={handleLogout} />}
        {tab === 'guide' && <GuideTab />}
      </main>
    </div>
  );
}

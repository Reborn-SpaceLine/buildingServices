import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Save, Download, ExternalLink, Loader2, CheckCircle, AlertCircle, Lock, KeyRound, LogOut } from 'lucide-react';
import { authStatus, setupPassword, login, logout, fetchContent, saveContent, downloadJson, AuthError } from './api';
import { GeneralTab, ServicesTab, ProjectsTab, VideosTab, FaqTab, MessagesTab, SecurityTab, GuideTab } from './tabs';
import { TextInput } from './fields';
import { TranslationsTab } from './translations';
import type { SiteContent } from '../content/types';
import '../styles/admin.css';

const tabs = [
  { id: 'general', label: 'Général' },
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Réalisations' },
  { id: 'videos', label: 'Vidéos' },
  { id: 'faq', label: 'FAQ' },
  { id: 'translations', label: 'Traductions' },
  { id: 'messages', label: 'Messages' },
  { id: 'security', label: 'Sécurité' },
  { id: 'guide', label: 'Guide' },
] as const;

type TabId = typeof tabs[number]['id'];
type Mode = 'loading' | 'unavailable' | 'no-password' | 'setup' | 'login' | 'ready';
type Status = { type: 'idle' | 'saving' | 'saved' | 'error'; message?: string };

/** Vérifie les erreurs bloquantes avant d'enregistrer */
function validate(content: SiteContent) {
  const errors: string[] = [];
  const check = (kind: string, slugs: string[]) => {
    slugs.forEach((slug, i) => {
      if (!slug) errors.push(`${kind} n°${i + 1} : l’adresse de la page est vide.`);
      else if (slugs.indexOf(slug) !== i) errors.push(`${kind} : l’adresse « ${slug} » est utilisée deux fois.`);
    });
  };
  check('Service', content.services.map(s => s.slug));
  check('Réalisation', content.projects.map(p => p.slug));
  return errors;
}

/* =========================
   Écran de connexion / création du mot de passe
   ========================= */
function LoginScreen({ setup, onSuccess }: { setup: boolean; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (setup && password !== confirmation) {
      setError('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    setBusy(true);
    try {
      if (setup) await setupPassword(password);
      else await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
      setBusy(false);
    }
  };

  return (
    <div className="a-center">
      <div className="a-card a-locked a-login">
        {setup ? <KeyRound size={32} /> : <Lock size={32} />}
        <h1>{setup ? 'Créer le mot de passe' : 'Administration'}</h1>
        <p className="a-muted">
          {setup
            ? 'Première connexion : choisissez le mot de passe qui protégera l’espace d’administration. Vous pourrez le changer ensuite.'
            : 'Entrez votre mot de passe pour gérer le contenu du site.'}
        </p>
        <form onSubmit={submit}>
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} hint={setup ? '8 caractères minimum.' : undefined} />
          {setup && <TextInput label="Confirmer le mot de passe" type="password" value={confirmation} onChange={setConfirmation} />}
          {error && <p className="a-error" role="alert">{error}</p>}
          <button type="submit" className="a-btn a-btn-primary" disabled={busy || !password}>
            {busy && <Loader2 size={16} className="a-spin" />} {setup ? 'Créer et entrer' : 'Se connecter'}
          </button>
        </form>
        <Link to="/" className="a-btn a-btn-ghost">Retour au site</Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [mode, setMode] = useState<Mode>('loading');
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saved, setSaved] = useState('');
  const [tab, setTab] = useState<TabId>('general');
  const [status, setStatus] = useState<Status>({ type: 'idle' });

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
    document.title = 'Administration | Building Service';
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
    const errors = validate(content);
    if (errors.length) {
      setStatus({ type: 'error', message: errors.join(' ') });
      return;
    }
    setStatus({ type: 'saving' });
    try {
      await saveContent(content);
      setSaved(JSON.stringify(content));
      setStatus({ type: 'saved', message: 'Enregistré. Le site est à jour.' });
    } catch (e) {
      if (e instanceof AuthError) {
        // Session expirée : on se reconnecte, les modifications restent en mémoire
        setStatus({ type: 'error', message: 'Session expirée : reconnectez-vous puis cliquez à nouveau sur Enregistrer.' });
        setMode('login');
        return;
      }
      setStatus({ type: 'error', message: e instanceof Error ? e.message : 'Enregistrement impossible.' });
    }
  };

  const handleLogout = async () => {
    if (dirty && !confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')) return;
    await logout();
    setContent(null);
    setSaved('');
    setMode('login');
  };

  if (mode === 'loading') {
    return <div className="a-center"><Loader2 className="a-spin" /> Chargement…</div>;
  }

  if (mode === 'setup' || mode === 'login') {
    return <LoginScreen setup={mode === 'setup'} onSuccess={loadContent} />;
  }

  if (mode === 'no-password') {
    return (
      <div className="a-center">
        <div className="a-card a-locked">
          <KeyRound size={32} />
          <h1>Mot de passe à définir</h1>
          <p>
            Pour des raisons de sécurité, le premier mot de passe de l’administration ne se crée pas depuis Internet.
            Définissez la variable <code>ADMIN_PASSWORD</code> sur le serveur, puis redémarrez-le.
          </p>
          <Link to="/" className="a-btn a-btn-dark">Retour au site</Link>
        </div>
      </div>
    );
  }

  if (mode === 'unavailable' || !content) {
    return (
      <div className="a-center">
        <div className="a-card a-locked">
          <Lock size={32} />
          <h1>Espace d’administration</h1>
          <p>
            Le serveur d’administration ne répond pas. En production, lancez le site avec son serveur
            (<code>npm start</code> ou l’image Docker) ; en local, avec <code>npm run dev</code>.
          </p>
          <Link to="/" className="a-btn a-btn-dark">Retour au site</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="a-header">
        <div className="a-brand">
          <strong>Building Service</strong>
          <span>Administration</span>
        </div>
        <nav className="a-tabs" aria-label="Sections de l’administration">
          {tabs.map(t => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <div className="a-actions">
          <a className="a-btn a-btn-ghost" href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> Voir le site</a>
          <button className="a-btn a-btn-ghost" onClick={() => downloadJson(content, `building-service-contenu-${new Date().toISOString().split('T')[0]}.json`)}>
            <Download size={16} /> Exporter
          </button>
          <button className="a-btn a-btn-primary" disabled={!dirty || status.type === 'saving'} onClick={save}>
            {status.type === 'saving' ? <Loader2 size={16} className="a-spin" /> : <Save size={16} />}
            {dirty ? 'Enregistrer' : 'Enregistré'}
          </button>
          <button className="a-btn a-btn-ghost a-logout" onClick={handleLogout} title="Se déconnecter">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      {status.message && (
        <div className={`a-status ${status.type}`} role="status">
          {status.type === 'saved' ? <CheckCircle size={18} /> : <AlertCircle size={18} />} {status.message}
        </div>
      )}

      <main className="a-main">
        {tab === 'general' && <GeneralTab content={content} update={update} />}
        {tab === 'services' && <ServicesTab content={content} update={update} />}
        {tab === 'projects' && <ProjectsTab content={content} update={update} />}
        {tab === 'videos' && <VideosTab content={content} update={update} goTo={setTab} />}
        {tab === 'faq' && <FaqTab content={content} update={update} />}
        {tab === 'translations' && <TranslationsTab content={content} update={update} />}
        {tab === 'messages' && <MessagesTab />}
        {tab === 'security' && <SecurityTab onLogout={handleLogout} />}
        {tab === 'guide' && <GuideTab />}
      </main>
    </div>
  );
}

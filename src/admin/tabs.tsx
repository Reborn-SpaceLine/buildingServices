import { useEffect, useState } from 'react';
import type React from 'react';
import { ShieldCheck, EyeOff, Download, KeyRound, LogOut } from 'lucide-react';
import { TextInput, TextArea, Select, Toggle, ImageField, ImageListField, StringListField, VideoListField, ListEditor } from './fields';
import { slugify, changePassword } from './api';
import { serviceIcons } from '../content/icons';
import { publicClientLabel } from '../content/privacy';
import { serviceCategories } from '../content/types';
import type { SiteContent, Service, Project, FaqItem, Stat, ClientVisibility, ServiceCategory } from '../content/types';
import { loadMessages, saveMessages, exportMessages } from '../lib/messages';
import type { ContactMessage } from '../lib/messages';

type TabProps = {
  content: SiteContent;
  update: (patch: Partial<SiteContent>) => void;
};

/* =========================
   Général : entreprise, réseaux, accueil, chiffres
   ========================= */
export function GeneralTab({ content, update }: TabProps) {
  const company = content.company;
  const setCompany = (patch: Partial<typeof company>) => update({ company: { ...company, ...patch } });
  const setSocial = (key: keyof typeof company.socials, value: string) => setCompany({ socials: { ...company.socials, [key]: value } });

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2>Entreprise</h2>
        <div className="a-grid">
          <TextInput label="Nom" value={company.name} onChange={v => setCompany({ name: v })} />
          <TextInput label="Slogan" value={company.tagline} onChange={v => setCompany({ tagline: v })} />
          <TextInput label="Téléphone affiché" value={company.phone} onChange={v => setCompany({ phone: v })} />
          <TextInput label="Numéro WhatsApp" value={company.whatsapp} onChange={v => setCompany({ whatsapp: v.replace(/\D/g, '') })} hint="Format international sans + ni espaces, ex. 237656524739" />
          <TextInput label="Email" type="email" value={company.email} onChange={v => setCompany({ email: v })} />
          <TextInput label="Site web" value={company.website} onChange={v => setCompany({ website: v })} />
          <TextInput label="Zone d’intervention" value={company.city} onChange={v => setCompany({ city: v })} />
          <TextInput label="Horaires" value={company.hours} onChange={v => setCompany({ hours: v })} />
          <TextInput label="Adresse pour la carte (page Contact)" value={company.mapQuery} onChange={v => setCompany({ mapQuery: v })} hint="Ville ou adresse de votre bureau, jamais celle d’un client." />
        </div>
      </section>

      <section className="a-card">
        <h2>Réseaux sociaux</h2>
        <p className="a-muted">Les icônes n’apparaissent sur le site que si le lien est rempli.</p>
        <div className="a-grid">
          <TextInput label="Facebook" value={company.socials.facebook} onChange={v => setSocial('facebook', v)} placeholder="https://facebook.com/…" />
          <TextInput label="Instagram" value={company.socials.instagram} onChange={v => setSocial('instagram', v)} placeholder="https://instagram.com/…" />
          <TextInput label="TikTok" value={company.socials.tiktok} onChange={v => setSocial('tiktok', v)} placeholder="https://tiktok.com/@…" />
          <TextInput label="YouTube" value={company.socials.youtube} onChange={v => setSocial('youtube', v)} placeholder="https://youtube.com/@…" />
          <TextInput label="LinkedIn" value={company.socials.linkedin} onChange={v => setSocial('linkedin', v)} placeholder="https://linkedin.com/company/…" />
        </div>
      </section>

      <section className="a-card">
        <h2>Accueil</h2>
        <TextInput label="Étiquette au-dessus du titre" value={content.hero.eyebrow ?? ''} onChange={v => update({ hero: { ...content.hero, eyebrow: v } })} hint="Courte, ex. « Construction · Rénovation · Aménagement ». Laisser vide pour la masquer." />
        <TextArea label="Texte sous le titre" value={content.hero.description} onChange={v => update({ hero: { ...content.hero, description: v } })} rows={3} />
        <ImageListField
          label="Photos du diaporama"
          value={content.hero.slides}
          onChange={v => update({ hero: { ...content.hero, slides: v } })}
          folder="accueil"
          hint="Photos larges (paysage), idéalement moins de 500 Ko chacune."
        />
      </section>

      <section className="a-card">
        <h2>Chiffres clés</h2>
        <ListEditor<Stat>
          items={content.stats}
          onChange={stats => update({ stats })}
          itemTitle={s => `${s.prefix}${s.value}${s.suffix} ${s.label}`}
          addLabel="Ajouter un chiffre"
          createItem={() => ({ value: 0, prefix: '', suffix: '', label: '' })}
          renderItem={(s, set) => (
            <div className="a-grid">
              <TextInput label="Valeur" type="number" value={String(s.value)} onChange={v => set({ value: Number(v) || 0 })} />
              <TextInput label="Avant (ex. +)" value={s.prefix} onChange={v => set({ prefix: v })} />
              <TextInput label="Après (ex. %)" value={s.suffix} onChange={v => set({ suffix: v })} />
              <TextInput label="Libellé" value={s.label} onChange={v => set({ label: v })} />
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
const iconOptions = Object.entries(serviceIcons).map(([value, { label }]) => ({ value, label }));
const categoryOptions = serviceCategories.map(c => ({ value: c, label: c }));

export function ServicesTab({ content, update }: TabProps) {
  return (
    <section className="a-card">
      <h2>Services ({content.services.length})</h2>
      <p className="a-muted">L’ordre ici est l’ordre d’affichage sur le site. « Mis en avant » = affiché en grand sur l’accueil (6 conseillés).</p>
      <ListEditor<Service>
        items={content.services}
        onChange={services => update({ services })}
        itemTitle={s => s.title}
        itemBadge={s => (s.featured ? <span className="a-badge">Accueil</span> : null)}
        addLabel="Ajouter un service"
        createItem={() => ({
          slug: '', title: 'Nouveau service', category: 'Finitions', icon: 'maison', short: '', intro: '',
          image: '', features: [], steps: [], featured: false, videos: [],
        })}
        renderItem={(s, set) => {
          const Icon = serviceIcons[s.icon]?.icon;
          return (
            <div className="a-stack">
              <div className="a-grid">
                <TextInput label="Titre" value={s.title} onChange={v => set({ title: v, slug: s.slug || slugify(v) })} />
                <TextInput label="Adresse de la page" value={s.slug} onChange={v => set({ slug: slugify(v) })} hint={`/services/${s.slug || '…'}`} />
                <Select<ServiceCategory> label="Catégorie" value={s.category} options={categoryOptions} onChange={v => set({ category: v })} />
                <Select<string> label="Icône" value={s.icon} options={iconOptions} onChange={v => set({ icon: v })} hint={Icon ? <span className="a-icon-preview"><Icon size={18} /> aperçu</span> : undefined} />
              </div>
              <Toggle label="Mettre en avant sur l’accueil" checked={s.featured} onChange={v => set({ featured: v })} />
              <TextArea label="Résumé (cartes)" value={s.short} onChange={v => set({ short: v })} rows={2} />
              <TextArea label="Présentation (page du service)" value={s.intro} onChange={v => set({ intro: v })} rows={5} />
              <ImageField label="Image" value={s.image} onChange={v => set({ image: v })} folder="services" />
              <div className="a-grid">
                <StringListField label="Prestations" value={s.features} onChange={v => set({ features: v })} placeholder="Ex. Plans de masse" />
                <StringListField label="Étapes" value={s.steps} onChange={v => set({ steps: v })} placeholder="Ex. Visite et relevé" />
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
const visibilityOptions: { value: ClientVisibility; label: string }[] = [
  { value: 'anonyme', label: 'Anonyme : seul le libellé est affiché' },
  { value: 'initiales', label: 'Initiales seulement' },
  { value: 'public', label: 'Nom complet (avec accord écrit du client)' },
];

export function ProjectsTab({ content, update }: TabProps) {
  const serviceOptions = content.services.map(s => ({ value: s.slug, label: s.title }));
  const published = content.projects.filter(p => p.published).length;

  return (
    <section className="a-card">
      <h2>Réalisations ({published} publiées, {content.projects.length - published} brouillons)</h2>
      <p className="a-muted">
        Documentez chaque chantier, même ceux que vous ne publiez pas : un brouillon reste uniquement sur cet ordinateur
        (dossier <code>content-private</code>) et n’apparaît jamais sur le site.
      </p>
      <ListEditor<Project>
        items={content.projects}
        onChange={projects => update({ projects })}
        itemTitle={p => p.title}
        itemBadge={p => (p.published
          ? <span className="a-badge ok">Publié</span>
          : <span className="a-badge"><EyeOff size={12} /> Brouillon</span>)}
        addLabel="Documenter un nouveau chantier"
        createItem={() => ({
          slug: '', title: 'Nouveau chantier', service: content.services[0]?.slug ?? '', location: '', year: String(new Date().getFullYear()),
          duration: '', surface: '', image: '', gallery: [], description: '', details: '',
          client: { visibility: 'anonyme', label: 'Particulier', name: '', notes: '' },
          steps: [], videos: [], published: false,
        })}
        renderItem={(p, set) => {
          const setClient = (patch: Partial<Project['client']>) => set({ client: { ...p.client, ...patch } });
          const folder = `projets/${p.slug || 'nouveau'}`;
          return (
            <div className="a-stack">
              <Toggle
                label="Publier sur le site"
                checked={p.published}
                onChange={v => set({ published: v })}
                hint="Décoché = brouillon privé, visible seulement dans cet espace."
              />
              <div className="a-grid">
                <TextInput label="Titre" value={p.title} onChange={v => set({ title: v, slug: p.slug || slugify(v) })} />
                <TextInput label="Adresse de la page" value={p.slug} onChange={v => set({ slug: slugify(v) })} hint={`/realisations/${p.slug || '…'}`} />
                <Select<string> label="Service principal" value={p.service} options={serviceOptions} onChange={v => set({ service: v })} />
                <TextInput label="Ville / quartier" value={p.location} onChange={v => set({ location: v })} hint="Jamais l’adresse exacte du client." />
                <TextInput label="Année" value={p.year} onChange={v => set({ year: v })} />
                <TextInput label="Durée" value={p.duration} onChange={v => set({ duration: v })} placeholder="Ex. 6 semaines" />
                <TextInput label="Surface" value={p.surface} onChange={v => set({ surface: v })} placeholder="Ex. 45 m²" />
              </div>

              <fieldset className="a-private">
                <legend><ShieldCheck size={16} /> Client et confidentialité</legend>
                <div className="a-grid">
                  <TextInput label="Nom réel du client (privé)" value={p.client.name ?? ''} onChange={v => setClient({ name: v })} hint="Conservé uniquement sur cet ordinateur." />
                  <Select<ClientVisibility> label="Affichage sur le site" value={p.client.visibility} options={visibilityOptions} onChange={v => setClient({ visibility: v })} />
                  <TextInput label="Libellé générique" value={p.client.label} onChange={v => setClient({ label: v })} placeholder="Ex. Particulier, Hôtel, Entreprise" />
                </div>
                <TextArea label="Notes internes (privé)" value={p.client.notes ?? ''} onChange={v => setClient({ notes: v })} rows={3} hint="Contacts, conditions, remarques : jamais publié." />
                <p className="a-preview">Affiché sur le site : <strong>Client : {publicClientLabel(p.client)}</strong></p>
                {p.client.visibility === 'public' && (
                  <p className="a-warning">Publiez le nom complet uniquement avec l’accord écrit du client.</p>
                )}
              </fieldset>

              <TextArea label="Résumé (cartes)" value={p.description} onChange={v => set({ description: v })} rows={2} />
              <TextArea label="Description détaillée" value={p.details} onChange={v => set({ details: v })} rows={5} />
              <ImageField label="Photo principale" value={p.image} onChange={v => set({ image: v })} folder={folder} />
              <ImageListField
                label="Galerie"
                value={p.gallery}
                onChange={v => set({ gallery: v })}
                folder={folder}
                hint="Évitez les visages, plaques d’immatriculation, numéros de rue et documents personnels."
              />

              <div className="a-field">
                <span className="a-label">Journal de chantier</span>
                <small className="a-hint">Racontez le chantier étape par étape : démolition, gros œuvre, installations, finitions…</small>
                <ListEditor<Project['steps'][number]>
                  items={p.steps}
                  onChange={steps => set({ steps })}
                  itemTitle={(s, i) => `${i + 1}. ${s.title}`}
                  addLabel="Ajouter une étape"
                  createItem={() => ({ title: '', text: '', image: '' })}
                  renderItem={(s, setStep) => (
                    <div className="a-stack">
                      <TextInput label="Étape" value={s.title} onChange={v => setStep({ title: v })} placeholder="Ex. Pose du faux plafond" />
                      <TextArea label="Description" value={s.text} onChange={v => setStep({ text: v })} rows={3} />
                      <ImageField label="Photo de l’étape" value={s.image} onChange={v => setStep({ image: v })} folder={folder} />
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
  const attached = [
    ...content.projects.flatMap(p => p.videos.filter(v => v.url).map(v => ({ v, where: `Réalisation : ${p.title}${p.published ? '' : ' (brouillon)'}`, tab: 'projects' as const }))),
    ...content.services.flatMap(s => s.videos.filter(v => v.url).map(v => ({ v, where: `Service : ${s.title}`, tab: 'services' as const }))),
  ];

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2>Vidéos mises en avant</h2>
        <p className="a-muted">
          Ces vidéos sont présentées en premier sur l’accueil (section « En vidéo », les 3 premières) et sur la page <code>/videos</code>.
          Utilisez-les pour vos vidéos de présentation, reportages ou meilleurs avant/après.
        </p>
        <VideoListField
          label="Vidéos"
          value={content.videos ?? []}
          onChange={videos => update({ videos })}
          folder="videos"
        />
      </section>

      <section className="a-card">
        <h2>Vidéos liées aux projets et services ({attached.length})</h2>
        <p className="a-muted">
          Chaque réalisation et chaque service peut aussi avoir ses propres vidéos : elles s’affichent sur sa page et sur <code>/videos</code>.
          Pour les ajouter ou les modifier, ouvrez l’élément dans l’onglet correspondant.
        </p>
        {attached.length === 0 ? <p className="a-empty">Aucune vidéo liée pour le moment.</p> : (
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
          <button type="button" className="a-btn a-btn-light" onClick={() => goTo('projects')}>Ajouter des vidéos à une réalisation</button>
          <button type="button" className="a-btn a-btn-light" onClick={() => goTo('services')}>Ajouter des vidéos à un service</button>
        </div>
      </section>
    </div>
  );
}

/* =========================
   Sécurité : changement du mot de passe
   ========================= */
export function SecurityTab({ onLogout }: { onLogout: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirmation) {
      setMessage({ ok: false, text: 'Les deux nouveaux mots de passe ne sont pas identiques.' });
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setMessage({ ok: true, text: 'Mot de passe modifié. Les autres sessions ouvertes ont été déconnectées.' });
      setCurrent('');
      setNext('');
      setConfirmation('');
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Modification impossible.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="a-stack">
      <section className="a-card">
        <h2><KeyRound size={20} /> Changer le mot de passe</h2>
        <form className="a-password-form" onSubmit={submit}>
          <TextInput label="Mot de passe actuel" type="password" value={current} onChange={setCurrent} />
          <TextInput label="Nouveau mot de passe" type="password" value={next} onChange={setNext} hint="8 caractères minimum. Mélangez lettres, chiffres et symboles." />
          <TextInput label="Confirmer le nouveau mot de passe" type="password" value={confirmation} onChange={setConfirmation} />
          {message && <p className={message.ok ? 'a-success' : 'a-error'}>{message.text}</p>}
          <button type="submit" className="a-btn a-btn-primary" disabled={busy || !current || !next}>Enregistrer le nouveau mot de passe</button>
        </form>
      </section>

      <section className="a-card">
        <h2>Session</h2>
        <p className="a-muted">
          La session se ferme automatiquement après 8 heures d’inactivité ou à la fermeture de l’onglet.
          Mot de passe oublié : supprimez le fichier <code>content-private/admin.json</code>, puis rouvrez <code>/admin</code> pour en créer un nouveau
          (seule une personne ayant accès à cet ordinateur peut le faire).
        </p>
        <button type="button" className="a-btn a-btn-dark" onClick={onLogout}><LogOut size={16} /> Se déconnecter</button>
      </section>
    </div>
  );
}

/* =========================
   FAQ
   ========================= */
export function FaqTab({ content, update }: TabProps) {
  return (
    <section className="a-card">
      <h2>Questions fréquentes</h2>
      <ListEditor<FaqItem>
        items={content.faq}
        onChange={faq => update({ faq })}
        itemTitle={f => f.q}
        addLabel="Ajouter une question"
        createItem={() => ({ q: 'Nouvelle question', a: '' })}
        renderItem={(f, set) => (
          <div className="a-stack">
            <TextInput label="Question" value={f.q} onChange={v => set({ q: v })} />
            <TextArea label="Réponse" value={f.a} onChange={v => set({ a: v })} rows={4} />
          </div>
        )}
      />
    </section>
  );
}

/* =========================
   Messages reçus par les formulaires (enregistrés dans ce navigateur)
   ========================= */
export function MessagesTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  useEffect(() => setMessages(loadMessages()), []);

  const setStatus = (id: string, status: ContactMessage['status']) => {
    const next = messages.map(m => (m.id === id ? { ...m, status } : m));
    setMessages(next);
    saveMessages(next);
  };
  const remove = (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    const next = messages.filter(m => m.id !== id);
    setMessages(next);
    saveMessages(next);
  };

  return (
    <section className="a-card">
      <div className="a-row a-between">
        <h2>Messages ({messages.length})</h2>
        <button type="button" className="a-btn a-btn-light" disabled={!messages.length} onClick={() => exportMessages(messages)}><Download size={16} /> Exporter</button>
      </div>
      <p className="a-muted">
        Les formulaires Contact et RDV vous envoient la demande sur WhatsApp. Ils en gardent aussi une copie dans le navigateur
        où ils ont été remplis : vous voyez ici celles envoyées depuis cet ordinateur (utile pour les tests).
      </p>
      {messages.length === 0 ? <p className="a-empty">Aucun message.</p> : (
        <div className="a-messages">
          {messages.map(m => (
            <article key={m.id} className={`a-message ${m.status}`}>
              <header>
                <strong>{m.name}</strong> · {m.phone}{m.email && ` · ${m.email}`}
                <small>{new Date(m.timestamp).toLocaleString('fr-FR')} · {m.subject ?? 'Contact'}</small>
              </header>
              <p>{m.message}</p>
              <div className="a-row">
                <select value={m.status} onChange={e => setStatus(m.id, e.target.value as ContactMessage['status'])}>
                  <option value="nouveau">Nouveau</option>
                  <option value="lu">Lu</option>
                  <option value="traité">Traité</option>
                </select>
                <a className="a-btn a-btn-light" href={`https://wa.me/${m.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">Répondre sur WhatsApp</a>
                <button type="button" className="a-btn a-btn-ghost" onClick={() => remove(m.id)}>Supprimer</button>
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
  return (
    <div className="a-stack">
      <section className="a-card a-guide">
        <h2>Comment ça marche</h2>
        <ol>
          <li>Lancez le site en local : <code>npm run dev</code>, puis ouvrez <code>http://localhost:5173/admin</code> et entrez votre mot de passe (modifiable dans l’onglet Sécurité).</li>
          <li>Modifiez textes, images et vidéos, puis cliquez sur <strong>Enregistrer</strong>. Le site se met à jour immédiatement.</li>
          <li>Les images et vidéos envoyées sont copiées dans <code>public/uploads/</code>. Pour les vidéos lourdes, préférez un lien YouTube : le site reste rapide.</li>
          <li>Pour mettre en ligne : <code>npm run build</code> puis déployez comme d’habitude (ou poussez sur GitHub).</li>
          <li>Chaque enregistrement garde une sauvegarde de l’ancienne version dans <code>content-private/sauvegardes/</code>.</li>
        </ol>
      </section>

      <section className="a-card a-guide">
        <h2><ShieldCheck size={20} /> Documenter les chantiers en respectant les clients</h2>
        <ul>
          <li><strong>Brouillon par défaut</strong> : un nouveau chantier n’est pas publié. Vous pouvez tout documenter, puis ne publier que ce qui est validé.</li>
          <li><strong>Nom du client</strong> : il est stocké uniquement dans <code>content-private/</code> (exclu de Git et du site). Sur le site, choisissez anonyme, initiales ou nom complet (avec accord écrit).</li>
          <li><strong>Lieu</strong> : indiquez la ville ou le quartier, jamais l’adresse.</li>
          <li><strong>Photos</strong> : pas de visages sans accord, pas de plaques d’immatriculation, de numéros de rue, de documents, de photos de famille ou d’objets de valeur identifiables.</li>
          <li><strong>Vidéos</strong> : mêmes règles ; coupez le son si des conversations privées sont audibles.</li>
          <li><strong>Notes internes</strong> : contacts, conditions, montants restent dans les notes privées, jamais dans la description publique.</li>
          <li><strong>Sauvegarde</strong> : copiez régulièrement le dossier <code>content-private/</code> sur un support sûr : il n’est pas envoyé sur GitHub.</li>
        </ul>
      </section>
    </div>
  );
}

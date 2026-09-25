import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { company, services, whatsappLink } from '../data/site';
import { addMessage } from '../lib/messages';
import '../styles/pages.css';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type Status = { type: 'success' | 'error' | null; message: string };

const subjects = [...services.map(s => ({ value: s.slug, label: s.title })), { value: 'maintenance', label: 'Maintenance' }, { value: 'autre', label: 'Autre demande' }];

export function ContactPage() {
  usePageTitle('Contact');
  const [params] = useSearchParams();
  const initialSubject = subjects.some(s => s.value === params.get('service')) ? params.get('service')! : '';

  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', subject: initialSubject, message: '' });
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [status, setStatus] = useState<Status>({ type: null, message: '' });

  const contactInfo = [
    { icon: Phone, title: 'Téléphone', value: company.phone, href: company.phoneHref },
    { icon: Mail, title: 'Email', value: company.email, href: `mailto:${company.email}` },
    { icon: MapPin, title: 'Zone d’intervention', value: company.city },
    { icon: Clock, title: 'Horaires', value: company.hours },
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subjectLabel = subjects.find(s => s.value === formData.subject)?.label ?? 'Non précisé';

    try {
      addMessage({ ...formData, subject: subjectLabel });
    } catch {
      setStatus({ type: 'error', message: 'Une erreur est survenue. Veuillez réessayer ou nous appeler directement.' });
      return;
    }

    // Ouvert immédiatement (dans le clic) pour ne pas être bloqué par le navigateur
    if (sendWhatsapp) {
      const text = `Bonjour Building Service,\n\nNom : ${formData.name}\nTéléphone : ${formData.phone}\nEmail : ${formData.email}\nObjet : ${subjectLabel}\n\n${formData.message}`;
      window.open(whatsappLink(text), '_blank', 'noopener');
    }

    setStatus({ type: 'success', message: 'Merci ! Votre message a bien été envoyé. Nous vous recontactons rapidement.' });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Entrons en contact."
        text="Une question, un projet, une demande de devis ? Laissez-nous un message : nous vous répondons sous 24 h ouvrées."
      />

      <section className="section">
        <div className="container contact-layout">
          <Reveal className="contact-form-card">
            <h2>Envoyez-nous un <span className="highlight">message</span></h2>
            <p className="form-lead">Décrivez-nous votre projet, nous vous recontactons rapidement.</p>

            {status.type && (
              <div className={`form-status ${status.type}`} role="status">
                {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form" aria-label="Formulaire de contact">
              <div className="form-row">
                <label className="field">
                  <span>Nom complet *</span>
                  <input name="name" required value={formData.name} onChange={handleChange} placeholder="Votre nom complet" autoComplete="name" />
                </label>
                <label className="field">
                  <span>Téléphone *</span>
                  <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="+237 6XX XX XX XX" autoComplete="tel" />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="votre.email@exemple.com" autoComplete="email" />
                </label>
                <label className="field">
                  <span>Objet</span>
                  <select name="subject" value={formData.subject} onChange={handleChange}>
                    <option value="">Choisissez un service</option>
                    {subjects.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Message *</span>
                <textarea name="message" required rows={6} value={formData.message} onChange={handleChange} placeholder="Décrivez votre projet : type de travaux, surface, délais souhaités…" />
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={sendWhatsapp} onChange={e => setSendWhatsapp(e.target.checked)} />
                <span>M’envoyer aussi sur WhatsApp pour une réponse plus rapide</span>
              </label>
              <button type="submit" className="btn btn-primary form-submit">
                <Send /> Envoyer mon message
              </button>
            </form>
          </Reveal>

          <Reveal delay={120} className="contact-side">
            {contactInfo.map(info => {
              const Icon = info.icon;
              const content = (
                <>
                  <span className="info-icon"><Icon size={22} /></span>
                  <div>
                    <strong>{info.title}</strong>
                    <span>{info.value}</span>
                  </div>
                </>
              );
              return info.href
                ? <a key={info.title} href={info.href} className="info-box">{content}</a>
                : <div key={info.title} className="info-box">{content}</div>;
            })}
            <div className="map-box">
              <iframe
                title="Carte de notre zone d’intervention"
                src={`https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

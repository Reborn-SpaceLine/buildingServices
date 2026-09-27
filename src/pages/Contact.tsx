import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { useLang, useSite, useUi } from '../i18n/context';
import { sendMessage } from '../lib/messages';
import '../styles/pages.css';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export function ContactPage() {
  const ui = useUi();
  const t = ui.contact;
  const { company, services, whatsappLink } = useSite();
  const { lang } = useLang();
  usePageTitle(t.title);

  const subjects = [
    ...services.map(s => ({ value: s.slug, label: s.title })),
    { value: 'maintenance', label: t.maintenance },
    { value: 'autre', label: t.otherRequest },
  ];

  const [params] = useSearchParams();
  const initialSubject = subjects.some(s => s.value === params.get('service')) ? params.get('service')! : '';

  // Message pré-rempli (ex. depuis l'estimateur de budget)
  const initialMessage = (params.get('message') ?? '').slice(0, 2000);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', subject: initialSubject, message: initialMessage });
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'rate' | null>(null);
  const [sending, setSending] = useState(false);
  const [website, setWebsite] = useState(''); // piège à robots

  const contactInfo = [
    { icon: Phone, title: t.infoPhone, value: company.phone, href: company.phoneHref },
    { icon: Mail, title: t.infoEmail, value: company.email, href: `mailto:${company.email}` },
    { icon: MapPin, title: t.infoArea, value: company.city },
    { icon: Clock, title: t.infoHours, value: company.hours },
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subjectLabel = subjects.find(s => s.value === formData.subject)?.label ?? t.notSpecified;

    // Ouvert immédiatement (dans le clic) pour ne pas être bloqué par le navigateur
    if (sendWhatsapp) {
      window.open(whatsappLink(t.whatsappMessage({ ...formData, subject: subjectLabel })), '_blank', 'noopener');
    }

    setSending(true);
    const result = await sendMessage({ ...formData, subject: subjectLabel, lang, website });
    setSending(false);

    // Envoyé sur WhatsApp : la demande est transmise même si le serveur n'a pas répondu
    if (result === 'ok' || sendWhatsapp) {
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } else {
      setStatus(result === 'rate-limited' ? 'rate' : 'error');
    }
  };

  return (
    <>
      <PageHero eyebrow={t.title} title={t.heroTitle} text={t.heroText} />

      <section className="section">
        <div className="container contact-layout">
          <Reveal className="contact-form-card">
            <h2>{t.formTitleStart} <span className="highlight">{t.formTitleHighlight}</span></h2>
            <p className="form-lead">{t.formLead}</p>

            {status && (
              <div className={`form-status ${status}`} role="status">
                {status === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{status === 'success' ? t.success : status === 'rate' ? t.rateLimited : t.error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form" aria-label={t.formLabel}>
              <div className="form-row">
                <label className="field">
                  <span>{t.name}</span>
                  <input name="name" required value={formData.name} onChange={handleChange} placeholder={t.namePlaceholder} autoComplete="name" />
                </label>
                <label className="field">
                  <span>{t.phone}</span>
                  <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="+237 6XX XX XX XX" autoComplete="tel" />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>{t.email}</span>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t.emailPlaceholder} autoComplete="email" />
                </label>
                <label className="field">
                  <span>{t.subject}</span>
                  <select name="subject" value={formData.subject} onChange={handleChange}>
                    <option value="">{t.chooseService}</option>
                    {subjects.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>{t.message}</span>
                <textarea name="message" required rows={6} value={formData.message} onChange={handleChange} placeholder={t.messagePlaceholder} />
              </label>
              {/* Champ invisible : seuls les robots le remplissent */}
              <input className="hp-field" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} aria-hidden="true" />
              <label className="checkbox">
                <input type="checkbox" checked={sendWhatsapp} onChange={e => setSendWhatsapp(e.target.checked)} />
                <span>{t.alsoWhatsapp}</span>
              </label>
              <button type="submit" className="btn btn-primary form-submit" disabled={sending}>
                <Send /> {t.send}
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
                title={t.mapTitle}
                src={`https://www.google.com/maps?q=${encodeURIComponent(company.mapQuery)}&hl=${ui.locale.slice(0, 2)}&output=embed`}
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

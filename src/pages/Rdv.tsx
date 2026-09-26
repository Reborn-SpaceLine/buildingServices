import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Phone, HardHat, CheckCircle, CalendarDays, ArrowLeft } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { useLang, useSite, useUi } from '../i18n/context';
import { sendMessage } from '../lib/messages';
import '../styles/pages.css';

const formulas = [
  { id: 'appel', icon: Phone, image: images.work },
  { id: 'visite', icon: HardHat, image: images.renovation },
] as const;

const slots = ['08:00 – 10:00', '10:00 – 12:00', '13:00 – 15:00', '15:00 – 17:00'];

type FormulaId = typeof formulas[number]['id'];

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

export function RdvPage() {
  const ui = useUi();
  const t = ui.rdv;
  const { services, whatsappLink } = useSite();
  const { lang } = useLang();
  const [website, setWebsite] = useState(''); // piège à robots
  usePageTitle(t.title);

  const [formula, setFormula] = useState<FormulaId | null>(null);
  const [done, setDone] = useState(false);
  const [sundayError, setSundayError] = useState(false);
  const [data, setData] = useState({ name: '', phone: '', email: '', service: '', date: '', slot: slots[0], address: '', message: '' });

  const selected = formulas.find(f => f.id === formula);
  const selectedText = selected ? t.formulas[selected.id] : null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSundayError(false);
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedText) return;
    if (new Date(`${data.date}T12:00:00`).getDay() === 0) {
      setSundayError(true);
      return;
    }

    const dateLabel = new Date(`${data.date}T12:00:00`).toLocaleDateString(ui.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const s = t.summary;
    const summary = [
      `${s.request} : ${selectedText.title}`,
      `${s.date} : ${dateLabel}, ${data.slot}`,
      data.service && `${s.service} : ${data.service}`,
      data.address && `${s.address} : ${data.address}`,
      data.message && `${s.details} : ${data.message}`,
    ].filter(Boolean).join('\n');

    // WhatsApp d'abord (dans le clic, sinon le navigateur bloque la fenêtre), puis copie dans l'admin
    window.open(whatsappLink(`${t.greeting}\n\n${t.nameLabel} : ${data.name}\n${t.phoneLabel} : ${data.phone}\n${summary}`), '_blank', 'noopener');
    void sendMessage({ name: data.name, email: data.email, phone: data.phone, subject: `RDV – ${selectedText.title}`, message: summary, lang, website });
    setDone(true);
  };

  return (
    <>
      <PageHero eyebrow={t.heroEyebrow} title={t.heroTitle} text={t.heroText} />

      <section className="section">
        <div className="container">
          {done ? (
            <Reveal className="rdv-done">
              <CheckCircle />
              <h2>{t.doneTitle}</h2>
              <p>{t.doneText(data.name.split(' ')[0], data.phone)}</p>
              <button className="btn btn-dark" onClick={() => { setDone(false); setFormula(null); }}>
                {t.another}
              </button>
            </Reveal>
          ) : !selected || !selectedText ? (
            <div className="rdv-options">
              {formulas.map((f, i) => {
                const text = t.formulas[f.id];
                return (
                  <Reveal key={f.id} delay={i * 100} className="rdv-option">
                    <img src={f.image} alt="" loading="lazy" />
                    <div className="rdv-option-body">
                      <span className="rdv-option-icon"><f.icon /></span>
                      <span className="rdv-duration">{text.duration}</span>
                      <h2>{text.title}</h2>
                      <p>{text.text}</p>
                      <button className="btn btn-primary" onClick={() => setFormula(f.id)}>
                        {text.button} <CalendarDays />
                      </button>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <Reveal className="contact-form-card rdv-form">
              <button className="back-link" onClick={() => setFormula(null)}>
                <ArrowLeft size={18} /> {t.changeFormula}
              </button>
              <h2>{selectedText.title} <span className="rdv-duration">{selectedText.duration}</span></h2>
              <p className="form-lead">{selectedText.text}</p>

              {sundayError && <div className="form-status error" role="alert">{t.noSunday}</div>}

              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <label className="field">
                    <span>{t.name}</span>
                    <input name="name" required value={data.name} onChange={handleChange} autoComplete="name" />
                  </label>
                  <label className="field">
                    <span>{t.phone}</span>
                    <input name="phone" type="tel" required value={data.phone} onChange={handleChange} autoComplete="tel" placeholder="+237 6XX XX XX XX" />
                  </label>
                </div>
                <div className="form-row">
                  <label className="field">
                    <span>{t.date}</span>
                    <input name="date" type="date" required min={todayIso()} value={data.date} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>{t.slot}</span>
                    <select name="slot" value={data.slot} onChange={handleChange}>
                      {slots.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label className="field">
                    <span>{t.service}</span>
                    <select name="service" value={data.service} onChange={handleChange}>
                      <option value="">{t.dontKnow}</option>
                      {services.map(s => <option key={s.slug}>{s.title}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>{t.email}</span>
                    <input name="email" type="email" value={data.email} onChange={handleChange} autoComplete="email" />
                  </label>
                </div>
                {formula === 'visite' && (
                  <label className="field">
                    <span>{t.address}</span>
                    <input name="address" required value={data.address} onChange={handleChange} placeholder={t.addressPlaceholder} autoComplete="street-address" />
                  </label>
                )}
                {/* Champ invisible : seuls les robots le remplissent */}
                <input className="hp-field" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} aria-hidden="true" />
                <label className="field">
                  <span>{t.details}</span>
                  <textarea name="message" rows={4} value={data.message} onChange={handleChange} placeholder={t.detailsPlaceholder} />
                </label>
                <button type="submit" className="btn btn-primary form-submit">
                  {t.confirm} <CalendarDays />
                </button>
              </form>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}

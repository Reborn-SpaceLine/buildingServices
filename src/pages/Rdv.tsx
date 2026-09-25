import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Phone, HardHat, CheckCircle, CalendarDays, ArrowLeft } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { images, services, whatsappLink } from '../data/site';
import { addMessage } from '../lib/messages';
import '../styles/pages.css';

const formulas = [
  {
    id: 'appel',
    icon: Phone,
    title: 'Appel découverte',
    duration: '30 min · gratuit',
    text: 'Un échange téléphonique ou vidéo pour comprendre votre besoin, évaluer la faisabilité et estimer un budget.',
    image: images.work,
    button: 'Réserver un appel',
  },
  {
    id: 'visite',
    icon: HardHat,
    title: 'Visite sur site',
    duration: '1 h · sur place',
    text: 'Un de nos techniciens se déplace pour prendre les mesures, étudier les lieux et préparer un devis précis.',
    image: images.renovation,
    button: 'Planifier ma visite',
  },
] as const;

const slots = ['08:00 – 10:00', '10:00 – 12:00', '13:00 – 15:00', '15:00 – 17:00'];

type FormulaId = typeof formulas[number]['id'];

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

export function RdvPage() {
  usePageTitle('Prendre rendez-vous');
  const [formula, setFormula] = useState<FormulaId | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ name: '', phone: '', email: '', service: '', date: '', slot: slots[0], address: '', message: '' });

  const selected = formulas.find(f => f.id === formula);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setError('');
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    if (new Date(`${data.date}T12:00:00`).getDay() === 0) {
      setError('Nous ne travaillons pas le dimanche : merci de choisir un autre jour.');
      return;
    }

    const dateLabel = new Date(`${data.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const summary = [
      `Demande de RDV : ${selected.title}`,
      `Date souhaitée : ${dateLabel}, ${data.slot}`,
      data.service && `Service : ${data.service}`,
      data.address && `Adresse : ${data.address}`,
      data.message && `Précisions : ${data.message}`,
    ].filter(Boolean).join('\n');

    addMessage({ name: data.name, email: data.email, phone: data.phone, subject: `RDV – ${selected.title}`, message: summary });
    window.open(whatsappLink(`Bonjour Building Service,\n\nNom : ${data.name}\nTéléphone : ${data.phone}\n${summary}`), '_blank', 'noopener');
    setDone(true);
  };

  return (
    <>
      <PageHero
        eyebrow="Rendez-vous"
        title="Choisissez votre niveau d’accompagnement."
        text="Réservez un créneau en moins d’une minute. Nous confirmons votre rendez-vous par téléphone ou WhatsApp."
      />

      <section className="section">
        <div className="container">
          {done ? (
            <Reveal className="rdv-done">
              <CheckCircle />
              <h2>Demande envoyée !</h2>
              <p>Merci {data.name.split(' ')[0]}. Nous vous confirmons votre rendez-vous très rapidement au {data.phone}.</p>
              <button className="btn btn-dark" onClick={() => { setDone(false); setFormula(null); }}>
                Faire une autre demande
              </button>
            </Reveal>
          ) : !selected ? (
            <div className="rdv-options">
              {formulas.map((f, i) => (
                <Reveal key={f.id} delay={i * 100} className="rdv-option">
                  <img src={f.image} alt="" loading="lazy" />
                  <div className="rdv-option-body">
                    <span className="rdv-option-icon"><f.icon /></span>
                    <span className="rdv-duration">{f.duration}</span>
                    <h2>{f.title}</h2>
                    <p>{f.text}</p>
                    <button className="btn btn-primary" onClick={() => setFormula(f.id)}>
                      {f.button} <CalendarDays />
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="contact-form-card rdv-form">
              <button className="back-link" onClick={() => setFormula(null)}>
                <ArrowLeft size={18} /> Changer de formule
              </button>
              <h2>{selected.title} <span className="rdv-duration">{selected.duration}</span></h2>
              <p className="form-lead">{selected.text}</p>

              {error && <div className="form-status error" role="alert">{error}</div>}

              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <label className="field">
                    <span>Nom complet *</span>
                    <input name="name" required value={data.name} onChange={handleChange} autoComplete="name" />
                  </label>
                  <label className="field">
                    <span>Téléphone *</span>
                    <input name="phone" type="tel" required value={data.phone} onChange={handleChange} autoComplete="tel" placeholder="+237 6XX XX XX XX" />
                  </label>
                </div>
                <div className="form-row">
                  <label className="field">
                    <span>Date souhaitée *</span>
                    <input name="date" type="date" required min={todayIso()} value={data.date} onChange={handleChange} />
                  </label>
                  <label className="field">
                    <span>Créneau *</span>
                    <select name="slot" value={data.slot} onChange={handleChange}>
                      {slots.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label className="field">
                    <span>Service concerné</span>
                    <select name="service" value={data.service} onChange={handleChange}>
                      <option value="">Je ne sais pas encore</option>
                      {services.map(s => <option key={s.slug}>{s.title}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input name="email" type="email" value={data.email} onChange={handleChange} autoComplete="email" />
                  </label>
                </div>
                {formula === 'visite' && (
                  <label className="field">
                    <span>Adresse du chantier *</span>
                    <input name="address" required value={data.address} onChange={handleChange} placeholder="Quartier, ville" autoComplete="street-address" />
                  </label>
                )}
                <label className="field">
                  <span>Précisions</span>
                  <textarea name="message" rows={4} value={data.message} onChange={handleChange} placeholder="Quelques mots sur votre projet (facultatif)" />
                </label>
                <button type="submit" className="btn btn-primary form-submit">
                  Confirmer ma demande <CalendarDays />
                </button>
              </form>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}

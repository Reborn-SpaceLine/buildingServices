import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Phone, MapPin, Wrench, CheckCircle, XCircle, CalendarPlus, Flag } from 'lucide-react';
import { fetchMessages, setAppointmentStatus } from './api';
import type { ServerMessage, AppointmentStatus } from './api';
import { useAdminText, adminDictionaries } from './i18n';

type WithAppointment = ServerMessage & { appointment: NonNullable<ServerMessage['appointment']> };

const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Heure de début et de fin d'un créneau « 08:00 – 10:00 » */
function slotTimes(slot: string) {
  const [start = '09:00', end] = slot.match(/\d{1,2}:\d{2}/g) ?? [];
  return { start, end: end ?? start };
}

/** Fichier .ics : ajoute le rendez-vous à l'agenda du téléphone ou de l'ordinateur */
function downloadIcs(m: WithAppointment, visitLabel: string, callLabel: string) {
  const { start, end } = slotTimes(m.appointment.slot);
  const stamp = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '').padStart(4, '0')}00`;
  const esc = (s: string) => s.replace(/[\\,;]/g, c => `\\${c}`).replace(/\n/g, '\\n');
  const kind = m.appointment.type === 'visite' ? visitLabel : callLabel;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Building Service//Agenda//FR', 'BEGIN:VEVENT',
    `UID:${m.id}@building-service`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(m.appointment.date, start)}`,
    `DTEND:${stamp(m.appointment.date, end)}`,
    `SUMMARY:${esc(`${kind} – ${m.name}`)}`,
    `DESCRIPTION:${esc([m.phone, m.appointment.service, m.message].filter(Boolean).join('\n'))}`,
    m.appointment.address ? `LOCATION:${esc(m.appointment.address)}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `rdv-${m.appointment.date}-${m.name.replace(/\W+/g, '-')}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AgendaTab() {
  const a = useAdminText();
  const t = a.agenda;
  const [items, setItems] = useState<WithAppointment[]>([]);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    fetchMessages()
      .then(list => setItems(list.filter((m): m is WithAppointment => Boolean(m.appointment))))
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  useEffect(reload, [reload]);

  const today = todayIso();
  const visible = items
    .filter(m => filter === 'all' || (filter === 'upcoming' ? m.appointment.date >= today : m.appointment.date < today))
    .sort((x, y) => (x.appointment.date + x.appointment.slot).localeCompare(y.appointment.date + y.appointment.slot) * (filter === 'past' ? -1 : 1));
  const pending = items.filter(m => m.appointment.status === 'en attente' && m.appointment.date >= today).length;

  // Regroupement par jour
  const days = new Map<string, WithAppointment[]>();
  for (const m of visible) days.set(m.appointment.date, [...(days.get(m.appointment.date) ?? []), m]);

  const setStatus = async (m: WithAppointment, status: AppointmentStatus) => {
    setItems(list => list.map(x => (x.id === m.id ? { ...x, appointment: { ...x.appointment, status } } : x)));
    await setAppointmentStatus(m.id, status).catch(() => reload());
  };

  /** Message WhatsApp dans la langue du client */
  const whatsapp = (m: WithAppointment, kind: 'confirm' | 'decline') => {
    const clientText = adminDictionaries[m.lang === 'en' ? 'en' : 'fr'];
    const date = new Date(`${m.appointment.date}T12:00:00`).toLocaleDateString(clientText.locale, { weekday: 'long', day: 'numeric', month: 'long' });
    const firstName = m.name.split(' ')[0];
    const text = kind === 'confirm'
      ? clientText.agenda.confirmMessage(firstName, date, m.appointment.slot, m.appointment.type === 'visite')
      : clientText.agenda.declineMessage(firstName, date);
    window.open(`https://wa.me/${m.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const dayLabel = (date: string) => (date === today
    ? t.today
    : new Date(`${date}T12:00:00`).toLocaleDateString(a.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  return (
    <section className="a-card">
      <div className="a-row a-between">
        <h2><CalendarDays size={20} /> {t.title}</h2>
        <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} aria-label={t.title}>
          <option value="upcoming">{t.upcoming}</option>
          <option value="past">{t.past}</option>
          <option value="all">{t.all}</option>
        </select>
      </div>
      <p className="a-muted">{t.intro}</p>
      {pending > 0 && <p className="a-warning">{t.pendingCount(pending)}</p>}
      {error && <p className="a-error">{error}</p>}
      {days.size === 0 ? <p className="a-empty">{t.empty}</p> : (
        <div className="a-agenda">
          {Array.from(days).map(([date, list]) => (
            <div key={date} className="a-day">
              <h3 className={date === today ? 'today' : ''}>{dayLabel(date)}</h3>
              {list.map(m => (
                <article key={m.id} className={`a-appt status-${m.appointment.status.replace(/\s/g, '-')}`}>
                  <div className="a-appt-time">
                    <strong>{m.appointment.slot}</strong>
                    <span>{m.appointment.type === 'visite' ? t.visit : t.call}</span>
                  </div>
                  <div className="a-appt-body">
                    <header>
                      <strong>{m.name}</strong>
                      <span className={`a-badge appt-${m.appointment.status.replace(/\s/g, '-')}`}>{t.statuses[m.appointment.status]}</span>
                    </header>
                    <p><Phone size={14} /> <a href={`tel:${m.phone.replace(/\s/g, '')}`}>{m.phone}</a></p>
                    {m.appointment.service && <p><Wrench size={14} /> {m.appointment.service}</p>}
                    {m.appointment.address && <p><MapPin size={14} /> {m.appointment.address}</p>}
                    <div className="a-row">
                      {m.appointment.status !== 'confirmé' && (
                        <button type="button" className="a-btn a-btn-light" onClick={() => { void setStatus(m, 'confirmé'); whatsapp(m, 'confirm'); }}>
                          <CheckCircle size={16} /> {t.confirm}
                        </button>
                      )}
                      {m.appointment.status !== 'refusé' && m.appointment.status !== 'terminé' && (
                        <button type="button" className="a-btn a-btn-ghost" onClick={() => { void setStatus(m, 'refusé'); whatsapp(m, 'decline'); }}>
                          <XCircle size={16} /> {t.decline}
                        </button>
                      )}
                      {m.appointment.status === 'confirmé' && (
                        <>
                          <button type="button" className="a-btn a-btn-light" onClick={() => downloadIcs(m, t.visit, t.call)}>
                            <CalendarPlus size={16} /> {t.ics}
                          </button>
                          <button type="button" className="a-btn a-btn-ghost" onClick={() => void setStatus(m, 'terminé')}>
                            <Flag size={16} /> {t.done}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

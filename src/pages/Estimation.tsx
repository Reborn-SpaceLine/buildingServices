import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Plus, Trash2, Send, MessageCircle, Info } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { formatFcfa, roundEstimate } from '../lib/format';
import { useSite, useUi } from '../i18n/context';
import type { EstimatorSettings } from '../content/types';
import '../styles/pages.css';
import '../styles/shop.css';

type Finish = keyof EstimatorSettings['finishes'];
type Line = { key: number; rateId: string; quantity: number };

const FINISHES: Finish[] = ['standard', 'confort', 'premium'];
let nextKey = 1;

export function EstimationPage() {
  const ui = useUi();
  const t = ui.estimator;
  const { estimator, whatsappLink } = useSite();
  usePageTitle(t.title);

  const rates = estimator.rates;
  const [lines, setLines] = useState<Line[]>(() => (rates[0] ? [{ key: nextKey++, rateId: rates[0].id, quantity: rates[0].unit === 'forfait' ? 1 : 20 }] : []));
  const [finish, setFinish] = useState<Finish>('standard');

  const factor = estimator.finishes[finish] ?? 1;
  const priced = lines
    .map(line => ({ line, rate: rates.find(r => r.id === line.rateId) }))
    .filter((x): x is { line: Line; rate: typeof rates[number] } => Boolean(x.rate) && x.line.quantity > 0)
    .map(({ line, rate }) => ({
      line, rate,
      low: roundEstimate(rate.low * line.quantity * factor),
      high: roundEstimate(rate.high * line.quantity * factor),
    }));
  const low = priced.reduce((sum, p) => sum + p.low, 0);
  const high = priced.reduce((sum, p) => sum + p.high, 0);
  const money = (n: number) => formatFcfa(n, ui.locale);

  const update = (key: number, patch: Partial<Line>) => setLines(list => list.map(l => (l.key === key ? { ...l, ...patch } : l)));
  const add = () => {
    const unused = rates.find(r => !lines.some(l => l.rateId === r.id)) ?? rates[0];
    setLines(list => [...list, { key: nextKey++, rateId: unused.id, quantity: unused.unit === 'forfait' ? 1 : 10 }]);
  };

  // Message prêt à envoyer (formulaire de contact ou WhatsApp)
  const summary = priced.map(p => `- ${p.rate.label} : ${p.line.quantity} ${t.unitShort[p.rate.unit]} (${t.finishes[finish]})`).join('\n');
  const message = t.message(summary, `${money(low)} – ${money(high)}`);
  const service = priced[0]?.rate.service ?? '';

  return (
    <>
      <PageHero eyebrow={t.title} title={t.heroTitle} text={t.heroText} />

      <section className="section">
        <div className="container">
          {rates.length === 0 ? <p className="empty-state">{t.unavailable} <Link to="/contact" className="highlight">{ui.common.contactUs}</Link></p> : (
            <div className="estimator">
              <Reveal className="estimator-form">
                <h2><Calculator /> {t.works}</h2>
                {lines.map(line => {
                  const rate = rates.find(r => r.id === line.rateId);
                  return (
                    <div key={line.key} className="estimator-line">
                      <label className="estimator-field grow">
                        <span>{t.work}</span>
                        <select
                          value={line.rateId}
                          onChange={e => {
                            const next = rates.find(r => r.id === e.target.value);
                            update(line.key, { rateId: e.target.value, quantity: next?.unit === 'forfait' ? 1 : line.quantity });
                          }}
                        >
                          {rates.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      </label>
                      {rate && rate.unit !== 'forfait' && (
                        <label className="estimator-field qty">
                          <span>{t.quantity} ({t.units[rate.unit]})</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={rate.unit === 'unite' ? 1 : 0.5}
                            value={line.quantity || ''}
                            onChange={e => update(line.key, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </label>
                      )}
                      <button type="button" className="estimator-remove" aria-label={t.remove} onClick={() => setLines(list => list.filter(l => l.key !== line.key))}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
                <button type="button" className="btn btn-dark estimator-add" onClick={add}><Plus /> {t.add}</button>

                <fieldset className="estimator-finishes">
                  <legend>{t.finish}</legend>
                  {FINISHES.map(f => (
                    <label key={f} className={finish === f ? 'active' : ''}>
                      <input type="radio" name="finish" value={f} checked={finish === f} onChange={() => setFinish(f)} />
                      <strong>{t.finishes[f]}</strong>
                      <small>{t.finishHints[f]}</small>
                    </label>
                  ))}
                </fieldset>
              </Reveal>

              <Reveal className="estimator-result" delay={80}>
                <span className="eyebrow">{t.result}</span>
                {priced.length === 0 ? <p>{t.empty}</p> : (
                  <>
                    <p className="estimator-total" aria-live="polite">
                      <small>{t.between}</small> {money(low)} <small>{t.and}</small> {money(high)}
                    </p>
                    <details className="estimator-detail">
                      <summary>{t.detail}</summary>
                      <ul>
                        {priced.map(p => (
                          <li key={p.line.key}>
                            <span>{p.rate.label} · {p.line.quantity} {t.unitShort[p.rate.unit]}</span>
                            <strong>{money(p.low)} – {money(p.high)}</strong>
                          </li>
                        ))}
                      </ul>
                    </details>
                    <div className="estimator-actions">
                      <Link to={`/contact?service=${encodeURIComponent(service)}&message=${encodeURIComponent(message)}`} className="btn btn-primary">
                        <Send /> {t.ask}
                      </Link>
                      <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className="btn btn-light">
                        <MessageCircle /> {t.askWhatsapp}
                      </a>
                    </div>
                  </>
                )}
                {estimator.note && <p className="estimator-note"><Info size={16} /> {estimator.note}</p>}
              </Reveal>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

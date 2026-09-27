import { useCallback, useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { fetchStats } from './api';
import type { StatsCount, StatsSummary } from './api';
import { useAdminText } from './i18n';

const PERIODS = [7, 30, 90, 365];

/** Liste « clé — nombre » avec une barre proportionnelle */
function Ranking({ title, items, label }: { title: string; items: StatsCount[]; label?: (key: string) => string }) {
  const max = Math.max(1, ...items.map(i => i.count));
  return (
    <div className="a-card a-rank">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="a-empty">—</p> : (
        <ul>
          {items.map(item => (
            <li key={item.key}>
              <span className="a-rank-bar" style={{ width: `${(item.count / max) * 100}%` }} />
              <span className="a-rank-key">{label ? label(item.key) : item.key}</span>
              <strong>{item.count.toLocaleString()}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatsTab() {
  const a = useAdminText();
  const t = a.stats;
  const [days, setDays] = useState(30);
  const [data, setData] = useState<StatsSummary | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setError('');
    fetchStats(days).then(setData).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, [days]);
  useEffect(reload, [reload]);

  const max = Math.max(1, ...(data?.days.map(d => d.visitors) ?? []));
  const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(a.locale, { day: 'numeric', month: 'short' });
  const perVisitor = data && data.visitors ? (data.views / data.visitors).toFixed(1) : '0';

  return (
    <div className="a-stack">
      <section className="a-card">
        <div className="a-row a-between">
          <h2><BarChart3 size={20} /> {t.title}</h2>
          <div className="a-row">
            <select value={days} onChange={e => setDays(Number(e.target.value))} aria-label={t.period}>
              {PERIODS.map(p => <option key={p} value={p}>{t.periods[p]}</option>)}
            </select>
            <button type="button" className="a-btn a-btn-light" onClick={reload}><RefreshCw size={16} /> {t.reload}</button>
          </div>
        </div>
        <p className="a-muted">{t.intro}</p>
        {error && <p className="a-error">{error}</p>}

        {data && (
          <>
            <div className="a-kpis">
              <div><strong>{data.visitors.toLocaleString()}</strong><span>{t.visitors}</span></div>
              <div><strong>{data.views.toLocaleString()}</strong><span>{t.views}</span></div>
              <div><strong>{perVisitor}</strong><span>{t.perVisitor}</span></div>
            </div>

            {data.views === 0 ? <p className="a-empty">{t.empty}</p> : (
              <figure className="a-chart" aria-label={t.chart}>
                <figcaption>{t.chart}</figcaption>
                <div className="a-chart-bars">
                  {data.days.map(d => (
                    <span
                      key={d.date}
                      className="a-chart-bar"
                      style={{ height: `${(d.visitors / max) * 100}%` }}
                      title={`${shortDate(d.date)} : ${d.visitors} ${t.visitors.toLowerCase()}, ${d.views} ${t.views.toLowerCase()}`}
                    />
                  ))}
                </div>
                <div className="a-chart-axis">
                  <span>{shortDate(data.days[0].date)}</span>
                  <span>{shortDate(data.days[data.days.length - 1].date)}</span>
                </div>
              </figure>
            )}
          </>
        )}
      </section>

      {data && data.views > 0 && (
        <div className="a-rank-grid">
          <Ranking title={t.pages} items={data.pages} />
          <Ranking title={t.sources} items={data.sources} label={k => (k === 'direct' ? t.direct : k)} />
          <Ranking title={t.devices} items={data.devices} label={k => t.deviceNames[k] ?? k} />
          <Ranking title={t.langs} items={data.langs} label={k => t.langNames[k] ?? k} />
        </div>
      )}
    </div>
  );
}

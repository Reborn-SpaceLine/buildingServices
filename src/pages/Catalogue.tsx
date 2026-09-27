import { useState } from 'react';
import { Search, MessageCircle, Info } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { formatFcfa } from '../lib/format';
import { useSite, useUi } from '../i18n/context';
import '../styles/pages.css';
import '../styles/shop.css';

/** Recherche sans tenir compte des accents ni des majuscules */
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CataloguePage() {
  const ui = useUi();
  const t = ui.catalog;
  const { catalog, whatsappLink } = useSite();
  usePageTitle(t.title);

  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const categories = Array.from(new Set(catalog.map(i => i.category).filter(Boolean)));
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const visible = catalog
    .filter(i => !category || i.category === category)
    .filter(i => words.every(w => normalize(`${i.name} ${i.category} ${i.description}`).includes(w)));

  return (
    <>
      <PageHero eyebrow={t.title} title={t.heroTitle} text={t.heroText} />

      <section className="section">
        <div className="container">
          <div className="catalog-tools">
            <label className="catalog-search">
              <Search size={18} />
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} />
            </label>
            {categories.length > 1 && (
              <div className="filter-bar" role="tablist" aria-label={t.title}>
                {['', ...categories].map(c => (
                  <button key={c || 'all'} role="tab" aria-selected={category === c} className={`filter-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                    {c || ui.common.all}
                  </button>
                ))}
              </div>
            )}
          </div>

          {visible.length === 0 ? <p className="empty-state">{t.empty}</p> : (
            <div className="catalog-grid">
              {visible.map((item, i) => (
                <Reveal key={item.id} delay={(i % 3) * 60} className={`catalog-card ${item.available ? '' : 'unavailable'}`}>
                  <div className="catalog-image">
                    <SafeImage src={item.image} alt={item.name} />
                    {item.category && <span className="catalog-category">{item.category}</span>}
                  </div>
                  <div className="catalog-body">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <p className="catalog-price">
                      {item.price > 0 ? <>{formatFcfa(item.price, ui.locale)} {item.priceNote && <small>{item.priceNote}</small>}</> : t.onQuote}
                    </p>
                    {item.available ? (
                      <a href={whatsappLink(t.orderMessage(item.name))} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">
                        <MessageCircle /> {t.order}
                      </a>
                    ) : <span className="catalog-unavailable">{t.unavailable}</span>}
                  </div>
                </Reveal>
              ))}
            </div>
          )}
          <p className="catalog-note"><Info size={16} /> {t.note}</p>
        </div>
      </section>
    </>
  );
}

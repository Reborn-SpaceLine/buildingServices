import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock } from 'lucide-react';
import { PageHero, Reveal, CtaBanner } from '../components/ui';
import { SafeImage } from '../components/SafeImage';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import { useSite, useUi } from '../i18n/context';
import { NotFound } from './NotFound';
import '../styles/pages.css';
import '../styles/shop.css';

const formatDate = (iso: string, locale: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

const readingMinutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

/** Texte de l'article : paragraphes séparés par une ligne vide, « ## » pour un intertitre */
function ArticleBody({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean).map((block, i) => (block.startsWith('## ')
        ? <h2 key={i}>{block.slice(3)}</h2>
        : <p key={i}>{block}</p>))}
    </>
  );
}

export function BlogPage() {
  const ui = useUi();
  const t = ui.blog;
  const { posts } = useSite();
  usePageTitle(t.title);

  return (
    <>
      <PageHero eyebrow={t.title} title={t.heroTitle} text={t.heroText} />
      <section className="section">
        <div className="container">
          {posts.length === 0 ? <p className="empty-state">{t.empty}</p> : (
            <div className="blog-grid">
              {posts.map((post, i) => (
                <Reveal key={post.slug} delay={(i % 3) * 60} className="blog-card">
                  <Link to={`/blog/${post.slug}`} className="blog-card-image">
                    <SafeImage src={post.image} alt="" />
                  </Link>
                  <div className="blog-card-body">
                    <p className="blog-meta">
                      <span><CalendarDays size={14} /> {formatDate(post.date, ui.locale)}</span>
                      <span><Clock size={14} /> {t.readingTime(readingMinutes(post.body))}</span>
                    </p>
                    <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                    <p>{post.excerpt}</p>
                    <Link to={`/blog/${post.slug}`} className="blog-more">{t.readMore} →</Link>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function BlogPostPage() {
  const ui = useUi();
  const t = ui.blog;
  const { slug } = useParams();
  const { posts } = useSite();
  const post = posts.find(p => p.slug === slug);
  usePageTitle(post?.title ?? ui.notFound.title);

  if (!post) return <NotFound />;

  return (
    <>
      <article className="section blog-article">
        <div className="container">
          <Link to="/blog" className="blog-back">{t.back}</Link>
          <header>
            <p className="blog-meta">
              <span><CalendarDays size={14} /> {formatDate(post.date, ui.locale)}</span>
              <span><Clock size={14} /> {t.readingTime(readingMinutes(post.body))}</span>
            </p>
            <h1>{post.title}</h1>
            <p className="blog-lead">{post.excerpt}</p>
          </header>
          {post.image && <SafeImage src={post.image} alt="" className="blog-cover" eager />}
          <div className="blog-text"><ArticleBody text={post.body} /></div>
        </div>
      </article>
      <CtaBanner image={images.work} title={t.ctaTitle} text={t.ctaText} />
    </>
  );
}

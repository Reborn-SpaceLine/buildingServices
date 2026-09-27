// Tests des règles partagées entre le site et le serveur : confidentialité, référencement, contenu livré.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { toPublicContent, publicClientLabel, initials, isPublicTestimonial } from '../shared/privacy.js';
import { pageMeta, metaTags } from '../shared/seo.js';

const content = JSON.parse(fs.readFileSync(new URL('../src/content/content.json', import.meta.url), 'utf8'));

const project = (overrides = {}) => ({
  slug: 'villa', title: 'Villa', service: content.services[0].slug, location: 'Yaoundé', year: '2025', duration: '', surface: '',
  image: '', gallery: [], description: '', details: '', steps: [], videos: [], published: true,
  client: { visibility: 'anonyme', label: 'Particulier', name: 'Jean Mbarga', notes: 'Code du portail 1234' },
  ...overrides,
});

test('confidentialité : le nom et les notes du client ne sont jamais publiés', () => {
  const pub = toPublicContent({ ...content, projects: [project()] });
  const text = JSON.stringify(pub);
  assert.ok(!text.includes('Jean Mbarga'));
  assert.ok(!text.includes('1234'));
  assert.equal(pub.projects[0].client.label, 'Particulier');
});

test('confidentialité : les réalisations en brouillon ne sont pas publiées', () => {
  const pub = toPublicContent({ ...content, projects: [project(), project({ slug: 'secret', published: false })] });
  assert.deepEqual(pub.projects.map(p => p.slug), ['villa']);
});

test('confidentialité : initiales et libellé affiché selon le choix', () => {
  const short = initials('Jean Paul Mbarga');
  assert.ok(short.startsWith('J') && !short.includes('Jean') && !short.includes('Mbarga'));
  assert.equal(publicClientLabel({ visibility: 'public', label: 'x', name: 'Aline Ngo' }), 'Aline Ngo');
  assert.ok(!publicClientLabel({ visibility: 'initiales', label: 'x', name: 'Aline Ngo' }).includes('Aline'));
  assert.equal(publicClientLabel({ visibility: 'anonyme', label: 'Entreprise', name: 'Aline Ngo' }), 'Entreprise');
});

test('avis clients : publiés seulement avec accord ET case « publier »', () => {
  const avis = [
    { id: 'a', name: 'A', text: 'ok', consent: true, published: true },
    { id: 'b', name: 'B', text: 'sans accord', consent: false, published: true },
    { id: 'c', name: 'C', text: 'brouillon', consent: true, published: false },
  ];
  assert.deepEqual(avis.filter(isPublicTestimonial).map(t => t.id), ['a']);
  const pub = toPublicContent({ ...content, testimonials: avis });
  assert.deepEqual(pub.testimonials.map(t => t.id), ['a']);
});

test('référencement : titre, description et données structurées par page', () => {
  const home = pageMeta('/', 'fr', content, 'https://exemple.cm');
  assert.equal(home.notFound, false);
  assert.ok(home.title.includes('Building Service'));
  assert.equal(home.url, 'https://exemple.cm/');
  assert.ok(home.jsonLd.length > 0);

  const service = content.services[0];
  const page = pageMeta(`/services/${service.slug}`, 'fr', content, 'https://exemple.cm');
  assert.equal(page.notFound, false);
  assert.ok(page.title.includes(service.title));
});

test('référencement : page inconnue signalée (404) et non indexée', () => {
  const meta = pageMeta('/nexiste-pas', 'fr', content);
  assert.equal(meta.notFound, true);
  assert.equal(meta.noindex, true);
  assert.equal(pageMeta('/admin', 'fr', content).noindex, true);
});

test('référencement : les balises échappent le contenu (pas d’injection HTML)', () => {
  const hostile = { ...content, services: [{ ...content.services[0], slug: 'x', title: '</script><script>alert(1)</script>' }] };
  const html = metaTags(pageMeta('/services/x', 'fr', hostile));
  assert.ok(!html.includes('<script>alert(1)'));
});

test('contenu livré : identifiants uniques et liens valides', () => {
  const slugs = content.services.map(s => s.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'deux services ont la même adresse');
  assert.ok(slugs.every(Boolean), 'un service n’a pas d’adresse');
  const projectSlugs = content.projects.map(p => p.slug);
  assert.equal(new Set(projectSlugs).size, projectSlugs.length, 'deux réalisations ont la même adresse');
  for (const p of content.projects) assert.ok(slugs.includes(p.service), `service inconnu pour « ${p.title} »`);
  for (const t of content.testimonials ?? []) assert.ok(isPublicTestimonial(t), `avis « ${t.name} » publié sans accord`);
});

test('référencement : blog publié indexé, brouillon et espace client jamais indexés', () => {
  const withPosts = { ...content, posts: [
    { slug: 'ok', title: 'Article', excerpt: 'Résumé', body: '', image: '', date: '2026-09-01', published: true },
    { slug: 'brouillon', title: 'Brouillon', excerpt: '', body: '', image: '', date: '2026-09-01', published: false },
  ] };
  const article = pageMeta('/blog/ok', 'fr', withPosts);
  assert.equal(article.notFound, false);
  assert.ok(article.jsonLd.some(d => d['@type'] === 'BlogPosting'));
  assert.equal(pageMeta('/blog/brouillon', 'fr', withPosts).notFound, true);
  const tracking = pageMeta('/suivi/abcdef0123456789', 'fr', content);
  assert.equal(tracking.notFound, false);
  assert.equal(tracking.noindex, true);
  for (const page of ['/estimation', '/catalogue', '/blog']) assert.equal(pageMeta(page, 'en', content).notFound, false, page);
});

test('confidentialité : espaces clients et articles en brouillon retirés du contenu public', () => {
  const pub = toPublicContent({ ...content, clientSpaces: [{ code: 'x' }], posts: [{ slug: 'a', published: true }, { slug: 'b', published: false }] });
  assert.ok(!('clientSpaces' in pub));
  assert.deepEqual(pub.posts.map(p => p.slug), ['a']);
});

test('contenu livré : estimateur et catalogue cohérents', () => {
  const slugs = content.services.map(s => s.slug);
  for (const r of content.estimator?.rates ?? []) {
    assert.ok(slugs.includes(r.service), `service inconnu pour « ${r.label} »`);
    assert.ok(r.low > 0 && r.high >= r.low, `fourchette invalide pour « ${r.label} »`);
  }
  const ids = (content.catalog ?? []).map(i => i.id);
  assert.equal(new Set(ids).size, ids.length, 'deux produits ont le même identifiant');
});

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';
import '../styles/pages.css';

export function NotFound() {
  usePageTitle('Page introuvable');
  return (
    <section className="not-found">
      <div className="container">
        <p className="not-found-code">404</p>
        <h1>Cette page n’existe pas (ou plus).</h1>
        <p>Le lien est peut-être erroné. Revenez à l’accueil pour continuer votre visite.</p>
        <Link to="/" className="btn btn-primary"><ArrowLeft /> Retour à l’accueil</Link>
      </div>
    </section>
  );
}

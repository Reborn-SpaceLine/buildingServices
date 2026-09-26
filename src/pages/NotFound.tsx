import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';
import { useUi } from '../i18n/context';
import '../styles/pages.css';

export function NotFound() {
  const ui = useUi();
  usePageTitle(ui.notFound.title);
  return (
    <section className="not-found">
      <div className="container">
        <p className="not-found-code">404</p>
        <h1>{ui.notFound.heading}</h1>
        <p>{ui.notFound.text}</p>
        <Link to="/" className="btn btn-primary"><ArrowLeft /> {ui.common.backHome}</Link>
      </div>
    </section>
  );
}

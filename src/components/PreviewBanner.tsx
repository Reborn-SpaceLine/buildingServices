import { Eye } from 'lucide-react';
import { exitPreview, isPreview } from '../content';
import { useUi } from '../i18n/context';

/** Bandeau affiché quand le site montre le contenu de l'admin non encore enregistré */
export function PreviewBanner() {
  const t = useUi().preview;
  if (!isPreview()) return null;
  return (
    <div className="preview-banner" role="status">
      <Eye size={16} /> <span>{t.banner}</span>
      <button type="button" onClick={exitPreview}>{t.exit}</button>
    </div>
  );
}

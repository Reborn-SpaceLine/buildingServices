import { useEffect } from 'react';
import { useUi } from '../i18n/context';

export function usePageTitle(title: string) {
  const { meta } = useUi();
  useEffect(() => {
    document.title = title ? `${title} | ${meta.suffix}` : meta.defaultTitle;
  }, [title, meta]);
}

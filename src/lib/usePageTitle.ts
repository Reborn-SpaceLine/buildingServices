import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | Building Service` : 'Building Service – Construction, rénovation et aménagement';
  }, [title]);
}
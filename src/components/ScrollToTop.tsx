import  { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import '../styles/scroll-to-top.css';
import { useUi } from '../i18n/context';

export function ScrollToTop() {
  const ui = useUi();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Afficher la flèche quand on a scrollé au-delà de la section hero (environ 100vh)
      if (window.pageYOffset > window.innerHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label={ui.floating.backToTop}
    >
      <ChevronUp size={50} className='chevronup' />
    </button>
  );
}
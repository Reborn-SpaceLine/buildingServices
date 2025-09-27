import { SocialIcons } from './SocialIcons';
import { ChevronDown } from 'lucide-react';
import '../styles/welcome.css';
import carousel from '../assets/carousel.jpg';

export function Welcome() {
  return (
    <section 
      id="welcome" 
      className="welcome"
      style={{
        backgroundImage: `url(${carousel})`,
      }}
    >
      <div className="welcome-overlay"></div>
      
      <div className="welcome-container">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1 className="welcome-title">
              <span className="title-building">Building</span>
              <br />
              <span className="title-service">SERVICE</span>
            </h1>
            {/*             
            <p className="welcome-tagline">
              Excellence, Innovation et Savoir-faire
            </p> */}
            
            <p className="welcome-description">
              Votre partenaire de confiance pour tous vos projets de construction, 
              rénovation et décoration intérieure.
            </p>
            
            <div className="welcome-buttons">
              <a
                href="#contact"
                className="btn btn-primary"
              >
                Demande un devis
              </a>
              <a
                href="#services-categories"
                className="btn btn-outline-white"
              >
                Voir nos catégories
              </a>
            </div>
            
            {/* Social Icons */}
            <SocialIcons variant="light" size="lg" />
          </div>
        </div>

        {/* Animated Scroll Down Arrow */}
        <div className="scroll-arrow">
          <a
            href="#about"
            className="scroll-link"
          >
            <span className="scroll-text">
              Découvrir
            </span>
            <ChevronDown />
          </a>
        </div>
      </div>
    </section>
  );
}
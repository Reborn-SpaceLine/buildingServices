import { Eye, Calendar, MapPin } from 'lucide-react';
import '../styles/realizations.css';
import salon from '../assets/salon.jpg';
import cuisine from '../assets/cuisine.jpg';
import chambre from '../assets/chambre.jpg';
import carousel from '../assets/carousel.jpg';
import renovation from '../assets/renovation.jpg';
import ploberie from '../assets/ploberie.jpg';

export function Realizations() {
  const projects = [
    {
      title: "Villa Moderne - Salon Principal",
      category: "Architecture Intérieur",
      location: "Yaoundé, Cameroun",
      date: "2024",
      image: carousel,
      description: "Transformation complète d'un salon avec un design contemporain, mobilier sur mesure et éclairage moderne."
    },
    {
      title: "Cuisine Haut de Gamme",
      category: "Menuiserie Décoration",
      location: "Douala, Cameroun",
      date: "2024",
      image: cuisine,
      description: "Cuisine moderne avec îlot central, finitions premium et menuiserie entièrement personnalisée."
    },
    {
      title: "Suite Parentale Élégante",
      category: "Architecture Intérieur",
      location: "Yaoundé, Cameroun",
      date: "2023",
      image: chambre,
      description: "Chambre parentale avec dressing intégré, salle de bain ouverte et décoration raffinée."
    },
    {
      title: "Salle de Bain Moderne",
      category: "Staff Peinture",
      location: "Douala, Cameroun",
      date: "2024",
      image: renovation,
      description: "Rénovation complète avec travaux de staff décoratif, peinture spécialisée et finitions haut de gamme."
    },
    {
      title: "Installation Sanitaire Moderne",
      category: "Plomberie & Aménagement",
      location: "Yaoundé, Cameroun",
      date: "2023",
      image: ploberie,
      description: "Mise en place d'un réseau de plomberie encastré avec bâti-support WC, garantissant fonctionnalité, durabilité et esthétisme pour les espaces sanitaires."
    },
    {
      title: "Salle à Manger Élégante",
      category: "Menuiserie Décoration",
      location: "Douala, Cameroun",
      date: "2023",
      image: salon,
      description: "Design d'intérieur complet pour une salle à manger avec ambiance chaleureuse et mobilier sur mesure."
    }
  ];

  return (
    <section id="realizations" className="realizations-section">
      <div className="realizations-container">
        {/* Header */}
        <div className="section-header">
          <h2 className="section-title">
            Nos <span className="highlight">Réalisations</span>
          </h2>
          <p className="section-subtitle">
            Découvrez quelques-unes de nos réalisations qui témoignent de notre savoir-faire et de notre créativité
          </p>
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              {/* Image */}
              <div className="project-image-container">
                <img
                  src={project.image}
                  alt={project.title}
                  className="project-image"
                />
                <div className="project-image-overlay"></div>
                
                {/* Overlay on hover */}
                <div className="project-hover-overlay">
                  <div className="project-eye-icon">
                    <div className="eye-icon-wrapper">
                      <Eye />
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="category-badge">
                  <span className="badge-content">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="project-content">
                <h3 className="project-title">
                  {project.title}
                </h3>
                
                <p className="project-description">
                  {project.description}
                </p>

                {/* Project Info */}
                <div className="project-info">
                  <div className="project-location">
                    <MapPin className="info-icon" />
                    <span>{project.location}</span>
                  </div>
                  <div className="project-date">
                    <Calendar className="info-icon" />
                    <span>{project.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <div className="cta-card">
            <h3 className="cta-title">
              Votre Projet, Notre Expertise
            </h3>
            <p className="cta-text">
              Chaque projet est unique et mérite une attention particulière. 
              Contactez-nous pour discuter de vos idées et obtenir un devis personnalisé.
            </p>
            <div className="cta-buttons">
              <a href="#contact" className="btn btn-primary">
                Demande un devis 
              </a>
              <a href="#contact" className="btn btn-outline">
                Contacter nous
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

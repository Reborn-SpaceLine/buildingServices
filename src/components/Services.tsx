import { Paintbrush2, Hammer, Zap, Droplets, Home, Palette, Brush, Square } from 'lucide-react';
import '../styles/services.css';
import serives1 from '../assets/services1.jpg';
import serives2 from '../assets/services2.jpg';
import serives3 from '../assets/services3.jpg';
import installation from '../assets/installation.jpg';
import careaux from '../assets/careaux.jpg';

export function Services() {
  const services = [
    {
      title: "ARCHITECTURE",
      subtitle: "INTÉRIEUR",
      image: serives2,
      description: "Conception et aménagement d'espaces intérieurs modernes et fonctionnels"
    },
    {
      title: "MENUISERIE",
      subtitle: "DÉCORATION",
      image: serives1,
      description: "Menuiserie sur mesure et décoration personnalisée pour votre intérieur"
    },
    {
      title: "STAFF",
      subtitle: "PEINTURE",
      image: serives3,
      description: "Travaux de staff et peinture décorative pour des finitions exceptionnelles"
    },
    {
      title: "INSTALLATION",
      subtitle: "PLOMBERIE",
      image: installation,
      description: "Mise en place et raccordement des réseaux de plomberie et évacuation pour garantir confort et sécurité"
    },
    {
      title: "REVÊTEMENT",
      subtitle: "CARRELAGE",
      image: careaux, 
      description: "Pose de carrelage mural et au sol pour des finitions élégantes, durables et faciles d’entretien"
    },
  ];

  const categories = [
    { name: "Architecture intérieur", icon: Home },
    { name: "Staff", icon: Brush },
    { name: "Peinture", icon: Paintbrush2 },
    { name: "Menuiserie", icon: Hammer },
    { name: "Carrelages", icon: Square },
    { name: "Électricité", icon: Zap },
    { name: "Plomberie", icon: Droplets },
    { name: "Décoration", icon: Palette },
  ];

  return (
    <section id="services" className="services-section">
      <div className="services-container">
        {/* Services principaux */}
        <div className="section-header">
          <h2 className="section-title">
            Nos <span className="highlight">Services</span>
          </h2>
          <p className="section-subtitle">
            Découvrez notre gamme complète de services pour transformer vos espaces
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-image-container">
                <img
                  src={service.image}
                  alt={`${service.title} ${service.subtitle}`}
                  className="service-image"
                />
                <div className="service-image-overlay"></div>
              </div>
              
              <div className="service-content">
                <div className="service-text">
                  <h3 className="service-title">
                    {service.title}
                  </h3>
                  <h4 className="service-subtitle">
                    {service.subtitle}
                  </h4>
                  <p className="service-description">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Catégories - Sous-section */}
        <div id="categories-section" className="categories-section">
          <div className="categories-header">
            <h3 className="categories-title">
              Nos <span className="highlight">Catégories</span>
            </h3>
            <p className="categories-subtitle">
              Découvrez l'ensemble de nos spécialités pour répondre à tous vos besoins
            </p>
          </div>

          {/* Categories Grid - 3 per row */}
          <div className="categories-grid">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="category-card">
                  <div className="category-content">
                    <div className="category-icon-wrapper">
                      <Icon className="category-icon" size={28} />
                    </div>
                    <h4 className="category-name">
                      {category.name}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="cta-section">
            <div className="cta-card">
              <p className="cta-text">
                Une équipe d'experts qualifiés à votre service pour tous vos projets de construction et de rénovation
              </p>
              <div className="cta-buttons">
                <a href="#contact" className="btn btn-primary">
                  Demande un devis
                </a>
                <a href="#realizations" className="btn btn-outline">
                  Voir nos réalisations
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
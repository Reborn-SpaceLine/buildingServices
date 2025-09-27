import { Wrench, Settings, Shield, Clock, CheckCircle, Phone, Building2, Hammer, Paintbrush, Zap, Users } from 'lucide-react';
import '../styles/catalogue.css';

const partners = [
  {
    icon: Building2,
    name: "Constructions Modernes",
    description: "Spécialiste en construction neuve et rénovation"
  },
  {
    icon: Hammer,
    name: "Artisans Experts",
    description: "Menuiserie, charpente et ébénisterie"
  },
  {
    icon: Paintbrush,
    name: "Déco Pro",
    description: "Peinture, décoration et finitions"
  },
  {
    icon: Zap,
    name: "Électro Services",
    description: "Installations électriques et domotique"
  },
  {
    icon: Users,
    name: "Équipe Qualifiée",
    description: "Professionnels certifiés et expérimentés"
  }
];

const maintenanceServices = [
  {
    icon: Wrench,
    title: "Maintenance Préventive",
    description: "Inspections régulières et entretien préventif pour éviter les pannes coûteuses",
    features: ["Inspection mensuelle", "Nettoyage professionnel", "Remplacement préventif", "Rapport détaillé"],
    price: "À partir de 150€/mois"
  },
  {
    icon: Settings,
    title: "Maintenance Corrective",
    description: "Réparations rapides et efficaces pour remettre vos installations en état",
    features: ["Intervention rapide", "Diagnostic professionnel", "Réparation sur site", "Garantie pièces"],
    price: "À partir de 80€/intervention"
  },
  {
    icon: Shield,
    title: "Contrat de Maintenance",
    description: "Sérénité totale avec nos contrats de maintenance personnalisés",
    features: ["Maintenance complète", "Assistance téléphonique", "Priorité d'intervention", "Tarifs préférentiels"],
    price: "À partir de 200€/mois"
  },
  {
    icon: Clock,
    title: "Dépannage d'Urgence",
    description: "Service d'urgence 24h/24 pour vos pannes critiques",
    features: ["Disponible 24h/24", "Intervention sous 2h", "Équipe qualifiée", "Devis immédiat"],
    price: "À partir de 120€ + déplacement"
  }
];

export function Catalogue() {
  return (
    <section id="catalogue" className="catalogue-section">
      <div className="container">
        {/* Section Partenaires */}
        <div className="partners-section">
          <h2 className="partners-title">
            Nos <span className="title-accent">Partenaires</span>
          </h2>
          <p className="partners-subtitle">
            Un réseau de confiance pour tous vos projets Building Services
          </p>
          <div className="partners-grid">
            {partners.map((partner, index) => (
              <div key={index} className="partner-item" title={partner.description}>
                <partner.icon className="partner-icon" />
                <span className="partner-tooltip">{partner.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="catalogue-header">
          <h2 className="catalogue-title">
            Catalogue de <span className="title-accent">Maintenance</span>
          </h2>
          <p className="catalogue-subtitle">
            Des services de maintenance professionnels pour préserver vos installations
          </p>
        </div>

        <div className="catalogue-grid">
          {maintenanceServices.map((service, index) => (
            <div key={index} className="catalogue-card group">
              <div className="card-header">
                <div className="icon-container group-hover-bg-red-600">
                  <service.icon className="service-icon group-hover-text-white" />
                </div>
                <div className="price-tag">
                  {service.price}
                </div>
              </div>

              <div className="card-content">
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>

                <ul className="features-list">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="feature-item">
                      <CheckCircle className="check-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-footer">
                <a
                  href="#contact"
                  className="catalogue-btn btn btn-outline hover-bg-red-600 hover-text-white"
                >
                  <Phone className="btn-icon" />
                  Demander un devis
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="catalogue-cta">
          <div className="cta-content">
            <h3 className="cta-title">Besoin d'un devis personnalisé ?</h3>
            <p className="cta-description">
              Contactez-nous pour une évaluation de vos besoins en maintenance
            </p>
            <a
              href="#contact"
              className="btn catalogue-cta-btn"
            >
              Contacter nos experts
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
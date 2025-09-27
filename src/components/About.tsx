import { CheckCircle, Award, Users, Calendar } from 'lucide-react';
import '../styles/about.css';
import work from '../assets/work.jpg';

export function About() {
  const stats = [
    {
      icon: Users,
      number: "500+",
      label: "Clients satisfaits"
    },
    {
      icon: Calendar,
      number: "10+",
      label: "Années d'expérience"
    },
    {
      icon: CheckCircle,
      number: "1000+",
      label: "Projets réalisés"
    },
    {
      icon: Award,
      number: "100%",
      label: "Satisfaction client"
    }
  ];

  const values = [
    {
      title: "Excellence",
      description: "Nous nous engageons à fournir des services de la plus haute qualité avec une attention particulière aux détails."
    },
    {
      title: "Innovation",
      description: "Nous utilisons les dernières technologies et techniques pour créer des espaces modernes et fonctionnels."
    },
    {
      title: "Fiabilité",
      description: "Respect des délais, transparence des prix et communication constante avec nos clients."
    },
    {
      title: "Durabilité",
      description: "Nous privilégions des matériaux et des pratiques respectueuses de l'environnement."
    }
  ];

  return (
    <section id="about" className="about-section">
      <div className="about-container">
        {/* Header */}
        <div className="section-header">
          <h2 className="section-title">
            À Propos de <span className="highlight">Nous</span>
          </h2>
          <p className="section-subtitle">
            Découvrez l'histoire et les valeurs qui font de Building Service votre partenaire de confiance
          </p>
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* Text Content */}
          <div className="about-text">
            <h3 className="about-subtitle">
              Notre <span className="highlight">Histoire</span>
            </h3>
            <p className="about-paragraph">
              Fondée avec la passion de transformer les espaces de vie et de travail, Building Service 
              est devenue une référence dans le domaine de la construction et de la rénovation. 
              Notre équipe d'experts qualifiés met son savoir-faire au service de vos projets les plus ambitieux.
            </p>
            <p className="about-paragraph">
              De l'architecture d'intérieur à la menuiserie sur mesure, en passant par les travaux de staff 
              et de peinture décorative, nous couvrons tous les aspects de l'aménagement pour vous offrir 
              un service complet et personnalisé.
            </p>
            
            {/* Mission */}
            <div className="mission-card">
              <h4 className="mission-title">Notre Mission</h4>
              <p className="mission-text">
                Transformer vos idées en réalité en créant des espaces uniques qui reflètent votre personnalité 
                et répondent à vos besoins, tout en respectant vos contraintes budgétaires et temporelles.
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="about-image-container">
            <div className="about-image-wrapper">
              <img
                src={work}
                alt="Équipe Building Service"
                className="about-image"
              />
              <div className="image-overlay"></div>
            </div>
            
            {/* Floating Stats Card */}
            <div className="floating-card">
              <div className="floating-card-content">
                <div className="floating-card-icon">
                  <Award />
                </div>
                <div>
                  <p className="floating-card-number">10+</p>
                  <p className="floating-card-label">Années d'expertise</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-item">
                <div className="stat-icon-container">
                  <div className="stat-icon-wrapper">
                    <Icon className="stat-icon" />
                  </div>
                </div>
                <p className="stat-number">{stat.number}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Values Section */}
        <div>
          <h3 className="values-title">
            Nos <span className="highlight">Valeurs</span>
          </h3>
          <div className="values-grid">
            {values.map((value, index) => (
              <div key={index} className="value-card">
                <h4 className="value-title">{value.title}</h4>
                <p className="value-description">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
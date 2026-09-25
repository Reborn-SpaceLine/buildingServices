import { Link } from 'react-router-dom';
import { Wrench, Settings, Shield, Clock, CheckCircle, Phone, Building2, Hammer, Paintbrush, Zap, Users } from 'lucide-react';
import { PageHero, Reveal, SectionIntro, CtaBanner } from '../components/ui';
import { usePageTitle } from '../lib/usePageTitle';
import { images } from '../data/site';
import '../styles/pages.css';

const partners = [
  { icon: Building2, name: 'Constructions Modernes', description: 'Spécialiste en construction neuve et rénovation' },
  { icon: Hammer, name: 'Artisans Experts', description: 'Menuiserie, charpente et ébénisterie' },
  { icon: Paintbrush, name: 'Déco Pro', description: 'Peinture, décoration et finitions' },
  { icon: Zap, name: 'Électro Services', description: 'Installations électriques et domotique' },
  { icon: Users, name: 'Équipe Qualifiée', description: 'Professionnels certifiés et expérimentés' },
];

const maintenanceServices = [
  {
    icon: Wrench,
    title: 'Maintenance Préventive',
    description: 'Inspections régulières et entretien préventif pour éviter les pannes coûteuses',
    features: ['Inspection mensuelle', 'Nettoyage professionnel', 'Remplacement préventif', 'Rapport détaillé'],
    price: 'À partir de 150€/mois',
  },
  {
    icon: Settings,
    title: 'Maintenance Corrective',
    description: 'Réparations rapides et efficaces pour remettre vos installations en état',
    features: ['Intervention rapide', 'Diagnostic professionnel', 'Réparation sur site', 'Garantie pièces'],
    price: 'À partir de 80€/intervention',
  },
  {
    icon: Shield,
    title: 'Contrat de Maintenance',
    description: 'Sérénité totale avec nos contrats de maintenance personnalisés',
    features: ['Maintenance complète', 'Assistance téléphonique', "Priorité d'intervention", 'Tarifs préférentiels'],
    price: 'À partir de 200€/mois',
    featured: true,
  },
  {
    icon: Clock,
    title: "Dépannage d'Urgence",
    description: "Service d'urgence 24h/24 pour vos pannes critiques",
    features: ['Disponible 24h/24', 'Intervention sous 2h', 'Équipe qualifiée', 'Devis immédiat'],
    price: 'À partir de 120€ + déplacement',
  },
];

export function MaintenancePage() {
  usePageTitle('Maintenance');

  return (
    <>
      <PageHero
        eyebrow="Maintenance"
        title="Préservez vos installations dans la durée."
        text="Des formules de maintenance professionnelles, de l’entretien préventif au dépannage d’urgence."
        image={images.installation}
      />

      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Nos formules"
            title="Catalogue de maintenance"
            text="Choisissez la formule adaptée à votre bâtiment. Chaque contrat peut être ajusté à vos besoins."
          />
          <div className="pricing-grid">
            {maintenanceServices.map((service, i) => (
              <Reveal key={service.title} delay={i * 80} className={`pricing-card ${service.featured ? 'featured' : ''}`}>
                {service.featured && <span className="pricing-flag">Le plus choisi</span>}
                <span className="pricing-icon"><service.icon /></span>
                <h3>{service.title}</h3>
                <p className="pricing-desc">{service.description}</p>
                <p className="pricing-price">{service.price}</p>
                <ul>
                  {service.features.map(feature => (
                    <li key={feature}><CheckCircle size={18} /> {feature}</li>
                  ))}
                </ul>
                <Link to="/contact?service=maintenance" className={`btn ${service.featured ? 'btn-primary' : 'btn-dark'}`}>
                  <Phone /> Demander un devis
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft-band">
        <div className="container">
          <SectionIntro
            eyebrow="Nos partenaires"
            title="Un réseau de confiance."
            text="Nous travaillons avec des professionnels sélectionnés pour chaque corps de métier."
          />
          <div className="partners-row">
            {partners.map(partner => (
              <Reveal key={partner.name} className="partner-tile">
                <partner.icon />
                <strong>{partner.name}</strong>
                <span>{partner.description}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        image={images.ploberie}
        title="Besoin d’un devis personnalisé ?"
        text="Contactez-nous pour une évaluation gratuite de vos besoins en maintenance."
        button="Contacter nos experts"
        to="/contact?service=maintenance"
      />
    </>
  );
}

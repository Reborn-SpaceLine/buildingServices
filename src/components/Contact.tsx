import React, { useState } from 'react';
import { Phone, Mail, Globe, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { SocialIcons } from './SocialIcons';
import '../styles/contact.css';
import Logo from '../assets/logo.svg';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'nouveau' | 'lu' | 'traité';
}

interface SubmissionStatus {
  type: 'success' | 'error' | 'loading' | null;
  message: string;
}

export function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  
  const [status, setStatus] = useState<SubmissionStatus>({ type: null, message: '' });

  const contactInfo = [
    {
      icon: Phone,
      title: "Téléphone",
      value: "+237 656524739",
      subtitle: "Contactez nous pour plus d'informations",
      href: "tel:+237656524739"
    },
    {
      icon: Globe,
      title: "Site Web",
      value: "www.buldingservices.com",
      subtitle: "building services"
    },
    {
      icon: Mail,
      title: "Email",
      value: "buldingservices97@gmail.com",
      subtitle: "building services",
      href: "mailto:buldingservices97@gmail.com"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveMessageToStorage = (data: FormData): ContactMessage => {
    const timestamp = new Date().toISOString();
    const message: ContactMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      timestamp,
      status: 'nouveau'
    };
    
    try {
      // Récupérer les messages existants
      const existingMessages = JSON.parse(localStorage.getItem('building_service_messages') || '[]');
      
      // Ajouter le nouveau message
      existingMessages.unshift(message); // unshift pour mettre en premier
      
      // Limiter à 500 messages maximum pour éviter de surcharger le localStorage
      if (existingMessages.length > 500) {
        existingMessages.splice(500);
      }
      
      // Sauvegarder
      localStorage.setItem('building_service_messages', JSON.stringify(existingMessages));
      
      // Également sauvegarder dans un fichier JSON téléchargeable
      const jsonData = JSON.stringify(existingMessages, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Créer un lien de téléchargement automatique (optionnel)
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `messages_${new Date().toISOString().split('T')[0]}.json`;
      
      // Stocker le lien pour téléchargement manuel si nécessaire
      localStorage.setItem('building_service_download_url', url);
      
      return message;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw new Error('Impossible de sauvegarder le message');
    }
  };

  // const sendWhatsAppNotification = (messageData: ContactMessage) => {
  //   const whatsappMessage = 
  //   `NOUVEAU MESSAGE - Building Service%0A%0A Nom: ${encodeURIComponent(messageData.name)}%0A 
  //                                             Email: ${encodeURIComponent(messageData.email)}%0A 
  //                                             Sujet: ${encodeURIComponent(messageData.subject)}%0A%0A 
  //                                             Message:%0A${encodeURIComponent(messageData.message)}%0A%0A 
  //   Reçu le: ${encodeURIComponent(new Date(messageData.timestamp).toLocaleString('fr-FR'))}%0A%0A#ID: ${messageData.id}`;
    
  //   const whatsappUrl = `https://wa.me/237656524739?text=${whatsappMessage}`;
    
  //   // Ouvrir WhatsApp dans un nouvel onglet
  //   window.open(whatsappUrl, '_blank');
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Traitement en cours...' });

    try {
      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sauvegarder le message
       saveMessageToStorage(formData);

      setStatus({
        type: 'success',
        message: 'Message envoyé avec succès !' // Vous allez être redirigé vers WhatsApp pour nous notifier.
      });

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });

      // // Attendre un peu puis ouvrir WhatsApp
      // setTimeout(() => {
      //   sendWhatsAppNotification(savedMessage);
      //   setStatus({ type: null, message: '' });
      // }, 2000);

    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.' 
      });
      
      setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 5000);
    }
  };

  const navigationLinks = [
    { name: 'Accueil', href: '#home' },
    { name: 'À Propos', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Réalisations', href: '#realizations' },
    { name: 'Contact', href: '#contact' }
  ];

  const partnersLinks = [
    { name: 'Partenaire A', href: '#partner-a' },
    { name: 'Partenaire B', href: '#partner-b' },
    { name: 'Partenaire C', href: '#partner-c' }
  ];

  return (
    <section id="contact" className="contact-section">
      <div className="contact-container">
        <div className="section-header">
          <h2 className="section-title">
            Contactez <span className="highlight">Nous</span>
          </h2>
          <p className="section-subtitle">
            Prêt à transformer vos espaces ? Contactez-nous dès aujourd'hui pour un devis gratuit
          </p>
        </div>

        <div className="contact-content-grid">
          {/* Cartes de contact */}
          <div className="contact-info-section">
            <div className="contact-info-grid">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div key={index} className="contact-card">
                    <div className="contact-icon-container">
                      <div className="contact-icon-wrapper">
                        <Icon size={28} className="contact-icon" />
                      </div>
                    </div>
                    <h3 className="contact-title">{info.title}</h3>
                    <a
                      href={info.href}
                      className="contact-value"
                    >
                      {info.value}
                    </a>
                    <p className="contact-subtitle">{info.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="contact-form-section">
            <div style={{ 
              backgroundColor: '#1f2937', 
              borderRadius: '1.5rem', 
              padding: '2.5rem', 
              border: '1px solid #374151' 
            }}>
              <h3 style={{ 
                fontSize: '1.875rem', 
                fontWeight: '700', 
                marginBottom: '0.75rem', 
                color: '#ffffff' 
              }}>
                Envoyez-nous un <span style={{ color: '#dc2626' }}>Message</span>
              </h3>
              <p style={{ 
                color: '#d1d5db', 
                marginBottom: '2rem', 
                fontSize: '1rem', 
                lineHeight: '1.5' 
              }}>
                Décrivez-nous votre projet et nous vous recontacterons rapidement
              </p>

              {/* Message de statut */}
              {status.type && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: status.type === 'success' ? '#065f46' : status.type === 'error' ? '#7f1d1d' : '#1f2937',
                  border: `1px solid ${status.type === 'success' ? '#10b981' : status.type === 'error' ? '#ef4444' : '#6b7280'}`,
                  color: status.type === 'success' ? '#d1fae5' : status.type === 'error' ? '#fecaca' : '#d1d5db'
                }}>
                  {status.type === 'success' && <CheckCircle size={16} />}
                  {status.type === 'error' && <AlertCircle size={16} />}
                  {status.type === 'loading' && (
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      border: '2px solid currentColor', 
                      borderTop: '2px solid transparent', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }} />
                  )}
                  <span style={{ fontSize: '0.875rem' }}>{status.message}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="contact-form" role="form" aria-label="Formulaire de contact">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Nom complet</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    aria-required="true"
                    aria-label="Nom complet"
                    aria-invalid={formData.name === '' ? "true" : "false"}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Votre nom complet"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    aria-required="true"
                    aria-label="Email"
                    aria-invalid={formData.email === '' ? "true" : "false"}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre.email@exemple.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Numero de Telephone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    required
                    aria-required="true"
                    aria-label="Numéro de téléphone"
                    aria-invalid={formData.phone === '' ? "true" : "false"}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="entre votre numero de telephone"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    aria-required="true"
                    aria-label="Message"
                    aria-invalid={formData.message === '' ? "true" : "false"}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Décrivez votre projet en détail..."
                    className="form-textarea"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={status.type === 'loading'}
                  style={{
                    backgroundColor: status.type === 'loading' ? '#6b7280' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '1rem 1.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    opacity: status.type === 'loading' ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Send size={20} />
                  {status.type === 'loading' ? 'Envoi...' : 'Envoyer le message'}
                </button>
              </form>

              {/* <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#374151',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                color: '#d1d5db',
                textAlign: 'center'
              }}>
                 Après envoi, vous serez redirigé vers WhatsApp pour nous notifier de votre message
              </div> */}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="footer-section">
          <div className="footer-main">
            <div className="footer-logo-section">
              <div className="footer-logo">
                <div className="footer-logo-image">
                  <img 
                    src={Logo} 
                    alt="Building Service Logo" 
                    className="logo-image"
                  />
                </div>
                <div className="footer-logo-text">
                  <h1 className="footer-logo-title">BUILDING</h1>
                  <p className="footer-logo-subtitle">SERVICE</p>
                </div>
              </div>
              <p className="footer-tagline">
                Votre partenaire de confiance pour tous vos projets de construction et de rénovation.
              </p>

              <div className="footer-social-section">
                <SocialIcons variant="dark" size="sm" />
              </div>
            </div>
            
            <div className="footer-utility-section">
              <h3 className="utility-title">Liens utiles</h3>
              <div className="utility-links-grid">
                {navigationLinks.map((link, index) => (
                  <a key={index} href={link.href} className="utility-link">
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="footer-utility-section">
              <h3 className="utility-title">Partenaires</h3>
              <div className="utility-links-grid">
                {partnersLinks.map((link, index) => (
                  <a key={index} href={link.href} className="utility-link">
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="footer-contact-section">
              <h3 className="contact-summary-title">Contact</h3>
              <div className="contact-summary">
                <p className="contact-summary-item">
                  <Phone size={16} /> +237 656524739
                </p>
                <p className="contact-summary-item">
                  <Mail size={16} /> buldingservices97@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-section">
        <p className="copyright">
          © 2024 Building Service. Tous droits réservés.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import styles from "../styles/AdminPanel.module.css";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'nouveau' | 'lu' | 'traité';
}

interface AdminPanelProps {
  showFab: boolean;
  onPanelToggle?: (visible: boolean) => void;
}

export function AdminPanel({ showFab, onPanelToggle }: AdminPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'nouveau' | 'lu' | 'traité'>('all');

  const ADMIN_PASSWORD = '2024';

  const handleFabClick = () => {
    if (isAuthenticated) setIsVisible(true);
    else setShowAuth(true);
  };

  const handleAuthentication = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowAuth(false);
      setIsVisible(true);
      setAdminPassword('');
    } else alert('Mot de passe incorrect');
  };

  const loadMessages = () => {
    const stored = localStorage.getItem('building_service_messages');
    if (stored) setMessages(JSON.parse(stored));
  };

  const filterMessages = () => {
    let filtered = messages;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.phone.includes(term) || msg.message.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(msg => msg.status === statusFilter);
    setFilteredMessages(filtered);
  };

  const updateMessageStatus = (id: string, newStatus: ContactMessage['status']) => {
    const updated = messages.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMessages(updated);
    localStorage.setItem('building_service_messages', JSON.stringify(updated));
  };

  const deleteMessage = (id: string) => {
    if (confirm('Supprimer ce message ?')) {
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      localStorage.setItem('building_service_messages', JSON.stringify(updated));
    }
  };

  const clearAllMessages = () => {
    if (confirm('Supprimer TOUS les messages ?')) {
      setMessages([]);
      localStorage.removeItem('building_service_messages');
    }
  };

  const replyOnWhatsApp = (phone: string) => {
    const formatted = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formatted}`, "_blank");
  };

  useEffect(() => filterMessages(), [messages, searchTerm, statusFilter]);
  useEffect(() => onPanelToggle?.(isVisible), [isVisible]);

  return (
    <>
      {/* FAB */}
      <div
        className={styles.fabWrapper}
        style={{
          opacity: showFab ? 1 : 0,
          transform: showFab ? 'scale(1)' : 'scale(0.5)',
          pointerEvents: showFab ? 'auto' : 'none',
        }}
      >
        <button className={styles.fab} onClick={handleFabClick}>
          <MessageSquare size={24} />
        </button>
      </div>

      {/* Auth */}
      {showAuth && (
        <div className={styles.authOverlay}>
          <div className={styles.authBox}>
            <h3>Accès Administration</h3>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Mot de passe"
              onKeyPress={(e) => e.key === 'Enter' && handleAuthentication()}
            />
            <div className={styles.authButtons}>
              <button onClick={handleAuthentication} className={styles.btnDanger}>
                Connexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      {isVisible && (
        <div className={styles.panelOverlay}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.headerTitle}>
                <MessageSquare size={24} />
                <h2>Messages ({messages.length})</h2>
              </div>
              <div className={styles.headerActions}>
                <button onClick={loadMessages} className={styles.btnGreen}>Actualiser</button>
                <button disabled={!messages.length} className={styles.btnBlue}>Exporter</button>
                <button onClick={() => setIsVisible(false)} className={styles.btnGray}>Fermer</button>
              </div>
            </div>

            <div className={styles.filters}>
              <input
                type="text"
                placeholder="Rechercher par numéro ou message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={styles.statusSelect}>
                <option value="all">Tous</option>
                <option value="nouveau">Nouveau</option>
                <option value="lu">Lu</option>
                <option value="traité">Traité</option>
              </select>
              <button onClick={clearAllMessages} disabled={!messages.length} className={styles.btnDanger}>Tout supprimer</button>
            </div>

            <div className={styles.messageList}>
              {filteredMessages.length === 0 ? (
                <div className={styles.noMessage}>Aucun message</div>
              ) : (
                filteredMessages.map(msg => (
                  <div key={msg.id} className={styles.messageCard}>
                    <div className={styles.messageBody}>
                      <p><strong>Numéro :</strong> {msg.phone}</p>
                      <p>{msg.message}</p>
                    </div>
                    <div className={styles.messageActions}>
                      <button onClick={() => updateMessageStatus(msg.id, 'lu')} className={styles.btnOrange}>Marquer lu</button>
                      <button onClick={() => updateMessageStatus(msg.id, 'traité')} className={styles.btnGreen}>Marquer traité</button>
                      <button onClick={() => deleteMessage(msg.id)} className={styles.btnDanger}>Supprimer</button>
                      <button onClick={() => replyOnWhatsApp(msg.phone)} className={styles.btnBlue}>Répondre WhatsApp</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

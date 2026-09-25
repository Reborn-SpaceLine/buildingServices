export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  timestamp: string;
  status: 'nouveau' | 'lu' | 'traité';
}

export const STORAGE_KEY = 'building_service_messages';
const MAX_MESSAGES = 500;

export function loadMessages(): ContactMessage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveMessages(messages: ContactMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(0, MAX_MESSAGES)));
}

export function addMessage(data: Omit<ContactMessage, 'id' | 'timestamp' | 'status'>): ContactMessage {
  const message: ContactMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    ...data,
    timestamp: new Date().toISOString(),
    status: 'nouveau',
  };
  saveMessages([message, ...loadMessages()]);
  return message;
}

export function exportMessages(messages: ContactMessage[]) {
  const blob = new Blob([JSON.stringify(messages, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `messages_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

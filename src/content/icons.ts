import {
  House, Hammer, Paintbrush2, Droplets, Square, Zap, PencilRuler, DraftingCompass,
  ChefHat, Sofa, Trees, Tv, AppWindow, Sparkles, Layers, Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Icônes disponibles pour les services (choix proposé dans /admin) */
export const serviceIcons: Record<string, { icon: LucideIcon; label: string }> = {
  plans: { icon: PencilRuler, label: 'Plans' },
  compas: { icon: DraftingCompass, label: 'Conception' },
  maison: { icon: House, label: 'Maison' },
  arbres: { icon: Trees, label: 'Extérieur' },
  marteau: { icon: Hammer, label: 'Menuiserie' },
  pinceau: { icon: Paintbrush2, label: 'Peinture' },
  eau: { icon: Droplets, label: 'Plomberie' },
  carreau: { icon: Square, label: 'Carrelage' },
  eclair: { icon: Zap, label: 'Électricité' },
  cuisine: { icon: ChefHat, label: 'Cuisine' },
  canape: { icon: Sofa, label: 'Mobilier' },
  tv: { icon: Tv, label: 'TV' },
  fenetre: { icon: AppWindow, label: 'Baie vitrée' },
  finition: { icon: Sparkles, label: 'Finitions' },
  couches: { icon: Layers, label: 'Revêtements' },
  cle: { icon: Wrench, label: 'Maintenance' },
};

export function serviceIcon(key: string): LucideIcon {
  return serviceIcons[key]?.icon ?? House;
}

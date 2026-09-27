/** Montant en francs CFA : « 125 000 FCFA » */
export function formatFcfa(amount: number, locale: string) {
  return `${Math.round(amount).toLocaleString(locale)} FCFA`;
}

/** Arrondi lisible pour une estimation : au millier, ou aux 5 000 au-delà de 100 000 */
export function roundEstimate(amount: number) {
  const step = amount >= 100000 ? 5000 : 1000;
  return Math.round(amount / step) * step;
}

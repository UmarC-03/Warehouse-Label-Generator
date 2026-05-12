import { LACKHENBUG_MAP, VAT_RATE } from '../constants';

export function encodeLackhenbug(price: number, vatPercentage: number = 15): string {
  if (!price || price <= 0) return '';
  const vatFactor = 1 + (vatPercentage / 100);
  const finalPrice = Math.round(price * vatFactor);
  const digits = finalPrice.toString().split('');
  
  return digits
    .map(digit => LACKHENBUG_MAP[digit] || digit)
    .join('');
}

export function formatMonthIndex(deliveryDate?: string): string {
  if (deliveryDate) {
    // Try parsing as ISO date (YYYY-MM-DD)
    if (deliveryDate.includes('-')) {
      const parts = deliveryDate.split('-');
      if (parts.length === 3) {
        return parseInt(parts[1], 10).toString();
      }
      if (parts.length === 2) {
        return parseInt(parts[1], 10).toString();
      }
    }
    // Try parsing as DD/MM
    if (deliveryDate.includes('/')) {
      const parts = deliveryDate.split('/');
      if (parts.length >= 2) {
        return parseInt(parts[1], 10).toString();
      }
      return parseInt(parts[0], 10).toString();
    }
    // Try parsing as just MM
    const month = parseInt(deliveryDate, 10);
    if (!isNaN(month) && month >= 1 && month <= 12) {
      return month.toString();
    }
  }

  const now = new Date();
  return (now.getMonth() + 1).toString();
}

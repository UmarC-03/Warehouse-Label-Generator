import { LACKHENBUG_MAP, VAT_RATE } from '../constants';

export function encodeLackhenbug(price: number, vatPercentage: number = 15): string {
  const vatFactor = 1 + (vatPercentage / 100);
  const finalPrice = Math.round(price * vatFactor);
  const digits = finalPrice.toString().split('');
  
  return digits
    .map(digit => LACKHENBUG_MAP[digit] || digit)
    .join('');
}

export function formatMonthIndex(): string {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return month;
}

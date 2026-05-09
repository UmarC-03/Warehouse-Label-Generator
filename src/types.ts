import { LucideIcon } from 'lucide-react';

export interface CategoryPreset {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

export interface Order {
  id: string;
  heading: string;
  categoryId: string;
  quantity: number;
  costPrice: number;
  vatRate: number;
  startFrom?: number;
  deliveryDate?: string;
}

export interface Sticker {
  type: 'header' | 'item';
  orderId: string;
  heading: string;
  color: string;
  itemNumber?: number;
  monthIndex?: string;
  lackhenbugCode?: string;
  deliveryDate?: string;
  isWide?: boolean;
}

export interface PageLayout {
  stickers: Sticker[];
}

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
  brand?: string;
  description?: string;
  categoryId: string;
  quantity: number;
  costPrice: number;
  vatRate: number;
  startFrom?: number;
  deliveryDate?: string;
  highlights?: Highlight[];
}

export interface Highlight {
  start: number;
  end: number;
  color: 'blue' | 'red' | 'yellow';
}

export interface Sticker {
  type: 'header' | 'item' | 'reserved';
  orderId: string;
  heading: string;
  brand?: string;
  description?: string;
  color: string;
  itemNumber?: number;
  monthIndex?: string;
  lackhenbugCode?: string;
  deliveryDate?: string;
  isWide?: boolean;
  highlights?: Highlight[];
}

export interface PageLayout {
  stickers: Sticker[];
}

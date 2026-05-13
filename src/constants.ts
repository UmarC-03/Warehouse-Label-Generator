import { 
  Microwave, 
  Flame, 
  Refrigerator, 
  Snowflake, 
  CircleDot, 
  Wind, 
  WashingMachine, 
  UtensilsCrossed, 
  Sun,
  CookingPot,
  Type,
  Tv,
  Waves
} from 'lucide-react';
import { CategoryPreset } from './types';

export const LACKHENBUG_MAP: Record<string, string> = {
  '1': 'L',
  '2': 'A',
  '3': 'C',
  '4': 'K',
  '5': 'H',
  '6': 'E',
  '7': 'N',
  '8': 'B',
  '9': 'U',
  '0': 'G'
};

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { id: 'standard', label: 'Standard', color: '#000000', icon: Type },
  { id: 'microwaves', label: 'Microwaves', color: '#B8860B', icon: Microwave },
  { id: 'stoves', label: 'Stoves', color: '#C0C0C0', icon: CookingPot },
  { id: 'fridges', label: 'Fridges', color: '#007BFF', icon: Refrigerator },
  { id: 'ovens', label: 'Ovens', color: '#FFD700', icon: Flame },
  { id: 'freezers', label: 'Chest Freezers', color: '#008080', icon: Snowflake },
  { id: 'hobs', label: 'Hobs', color: '#FF0000', icon: CircleDot },
  { id: 'extractors', label: 'Extractors', color: '#8000FF', icon: Wind },
  { id: 'washing_machines', label: 'Washers', color: '#FF7A00', icon: WashingMachine },
  { id: 'dish_washers', label: 'Dish Washers', color: '#00A651', icon: UtensilsCrossed },
  { id: 'tvs', label: 'TVs', color: '#4B0082', icon: Tv },
  { id: 'dryers', label: 'Tumble Dryers', color: '#E30B5C', icon: Waves }
];

export const VAT_RATE = 1.15;
export const STICKERS_PER_PAGE = 22; 
export const ROWS_PER_PAGE = 11;
export const COLS_PER_PAGE = 2;
export const LABEL_WIDTH = 105; // mm
export const LABEL_HEIGHT = 26; // mm

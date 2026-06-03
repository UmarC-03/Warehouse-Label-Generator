import { Order, Sticker } from '../types';
import { ROWS_PER_PAGE, COLS_PER_PAGE } from '../constants';
import { encodeLackhenbug, formatMonthIndex } from './pricing';

/**
 * Precision Template & Grid Logic Enforcement
 * 22-Up (11 rows x 2 columns) Coordinate Mapping.
 * Fill Even slots (Left Col) then Odd slots (Right Col).
 */
export function calculateLayout(orders: Order[]): (Sticker & { slotIndex: number })[] {
  const SLOTS_PER_PAGE = ROWS_PER_PAGE * COLS_PER_PAGE;
  const allSlots: (Sticker | null)[] = [];

  // Infinite dynamic sequence calculation (no limits/array bound errors)
  const getSlotFromSequence = (index: number): number => {
    const page = Math.floor(index / SLOTS_PER_PAGE);
    const slotOnPage = index % SLOTS_PER_PAGE;
    const pageStart = page * SLOTS_PER_PAGE;
    
    if (slotOnPage < ROWS_PER_PAGE) {
      return pageStart + (slotOnPage * 2);
    } else {
      const r = slotOnPage - ROWS_PER_PAGE;
      return pageStart + (r * 2 + 1);
    }
  };

  let sequencePointer = 0;

  orders.forEach((order) => {
    const monthIndex = formatMonthIndex(order.deliveryDate);
    // 1. Find next truly free slot in sequence
    while (allSlots[getSlotFromSequence(sequencePointer)] !== undefined) {
      sequencePointer++;
    }

    const currentSlot = getSlotFromSequence(sequencePointer);
    const isAtTopOfPage = currentSlot % SLOTS_PER_PAGE === 0;
    
    // Top-of-Page Heading: Wide header only if more than 10 labels for this order
    const useWideHeader = isAtTopOfPage && order.quantity > 10;

    const headerBase = {
      orderId: order.id,
      heading: order.heading,
      brand: order.brand,
      description: order.description,
      color: order.categoryId,
      highlights: order.highlights,
    };

    if (useWideHeader) {
      const leftSlot = currentSlot; 
      const rightSlot = currentSlot + 1; // Slot 1 is always currentSlot+1 if currentSlot % SLOTS_PER_PAGE === 0

      allSlots[leftSlot] = {
        ...headerBase,
        type: 'header',
        isWide: true
      };
      allSlots[rightSlot] = null; // Reserved
      sequencePointer++; // Skip left slot (right is auto-skipped by busy check)
    } else {
      allSlots[currentSlot] = {
        ...headerBase,
        type: 'header',
        isWide: false
      };
      sequencePointer++;
    }

    // 2. Fill Labels following sequence
    const startFrom = order.startFrom || 1;
    const lackhenbug = encodeLackhenbug(order.costPrice, order.vatRate);

    for (let i = 0; i < order.quantity; i++) {
      // Find next truly free slot in sequence
      while (allSlots[getSlotFromSequence(sequencePointer)] !== undefined) {
        sequencePointer++;
      }

      // Check for Page Break: If we are at the start of a new page sequence
      if (sequencePointer > 0 && sequencePointer % SLOTS_PER_PAGE === 0) {
        const breakSlot = getSlotFromSequence(sequencePointer);
        if (breakSlot % SLOTS_PER_PAGE === 0) {
          const remaining = order.quantity - i;
          const isWide = remaining > 10;

          if (isWide) {
            allSlots[breakSlot] = {
              ...headerBase,
              type: 'header',
              isWide: true
            };
            allSlots[breakSlot + 1] = null; // Reserved
            sequencePointer++; // Move past left
          } else {
            allSlots[breakSlot] = {
              ...headerBase,
              type: 'header',
              isWide: false
            };
            sequencePointer++;
          }
          
          // Re-verify sequence pointer is on a truly free slot
          while (allSlots[getSlotFromSequence(sequencePointer)] !== undefined) {
            sequencePointer++;
          }
        }
      }

      const slotIdx = getSlotFromSequence(sequencePointer);
      allSlots[slotIdx] = {
        type: 'item',
        orderId: order.id,
        heading: order.heading,
        color: order.categoryId,
        itemNumber: startFrom + i,
        monthIndex,
        lackhenbugCode: lackhenbug,
        deliveryDate: order.deliveryDate,
        highlights: order.highlights
      };
      sequencePointer++;
    }
  });

  return allSlots
    .map((s, idx) => {
      if (s === null) {
        return {
          type: 'reserved' as const,
          slotIndex: idx,
          orderId: '',
          heading: '',
          color: ''
        };
      }
      return { ...s, slotIndex: idx } as Sticker & { slotIndex: number };
    });
}

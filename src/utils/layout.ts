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

  // Pre-calculate the fill sequence for multiple pages
  // Sequence for 10 pages initially, can expand if needed
  const getSequence = (maxPages = 20) => {
    const seq: number[] = [];
    for (let p = 0; p < maxPages; p++) {
      const pageStart = p * SLOTS_PER_PAGE;
      // First Left Col (Even)
      for (let r = 0; r < ROWS_PER_PAGE; r++) {
        seq.push(pageStart + (r * 2));
      }
      // Then Right Col (Odd)
      for (let r = 0; r < ROWS_PER_PAGE; r++) {
        seq.push(pageStart + (r * 2 + 1));
      }
    }
    return seq;
  };

  const fillSequence = getSequence();
  let sequencePointer = 0;

  orders.forEach((order) => {
    const monthIndex = formatMonthIndex(order.deliveryDate);
    // 1. Find next truly free slot in sequence
    while (allSlots[fillSequence[sequencePointer]] !== undefined) {
      sequencePointer++;
    }

    const currentSlot = fillSequence[sequencePointer];
    const isAtTopOfPage = currentSlot % SLOTS_PER_PAGE === 0;
    
    // Top-of-Page Heading: If Order starts at Slot 0 of Page, use Slot 0 and Slot 1 (horizontal merger)
    const useWideHeader = isAtTopOfPage;

    const headerBase = {
      orderId: order.id,
      heading: order.heading,
      color: order.categoryId,
    };

    if (useWideHeader) {
      const leftSlot = 0 + Math.floor(currentSlot / SLOTS_PER_PAGE) * SLOTS_PER_PAGE;
      const rightSlot = 1 + Math.floor(currentSlot / SLOTS_PER_PAGE) * SLOTS_PER_PAGE;

      allSlots[leftSlot] = {
        ...headerBase,
        type: 'header',
        isWide: true
      };
      allSlots[rightSlot] = null; // Reserved
      sequencePointer++; // Move pointer past Slot 0 (Slot 1 is also taken but we skip it later too)
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
      // Skip already reserved slots
      while (allSlots[fillSequence[sequencePointer]] !== undefined) {
        sequencePointer++;
      }

      const slotIdx = fillSequence[sequencePointer];
      allSlots[slotIdx] = {
        type: 'item',
        orderId: order.id,
        heading: order.heading,
        color: order.categoryId,
        itemNumber: startFrom + i,
        monthIndex,
        lackhenbugCode: lackhenbug,
        deliveryDate: order.deliveryDate
      };
      sequencePointer++;
    }
  });

  return allSlots
    .map((s, idx) => (s ? { ...s, slotIndex: idx } : null))
    .filter((s): s is (Sticker & { slotIndex: number }) => s !== null);
}

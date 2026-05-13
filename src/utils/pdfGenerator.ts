import { jsPDF } from 'jspdf';
import { Sticker, Highlight } from '../types';
import { ROWS_PER_PAGE, COLS_PER_PAGE, CATEGORY_PRESETS, LABEL_WIDTH, LABEL_HEIGHT } from '../constants';

// Physical dimensions for A4 template (mm)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 0; // 105 * 2 = 210
const MARGIN_Y = (PAGE_HEIGHT - (ROWS_PER_PAGE * LABEL_HEIGHT)) / 2; // (297 - 286) / 2 = 5.5mm

function renderHighlightedText(doc: jsPDF, text: string, highlights: Highlight[] | undefined, x: number, y: number, fontSize: number, align: 'center' | 'left' | 'right' = 'center') {
  if (!highlights || highlights.length === 0) {
    doc.text(text.toUpperCase(), x, y, { align });
    return;
  }

  const fullWidth = doc.getTextWidth(text.toUpperCase());
  let startX = x;
  if (align === 'center') startX = x - (fullWidth / 2);
  else if (align === 'right') startX = x - fullWidth;

  const currentTextColor = doc.getTextColor();

  // Draw backgrounds
  highlights.forEach(h => {
    const beforeText = text.substring(0, h.start).toUpperCase();
    const highlightText = text.substring(h.start, h.end).toUpperCase();
    const offset = doc.getTextWidth(beforeText);
    const hWidth = doc.getTextWidth(highlightText);
    
    // Use lighter colors for better legibility if text is dark, 
    // or just use the requested colors. 
    // I'll use standard bright colors but with some opacity if possible, 
    // however jsPDF doesn't handle alpha easily in standard fill.
    // I'll use soft versions.
    if (h.color === 'blue') doc.setFillColor(191, 219, 254); // blue-200
    else if (h.color === 'red') doc.setFillColor(254, 202, 202); // red-200
    else if (h.color === 'yellow') doc.setFillColor(254, 240, 138); // yellow-200
    
    const hHeight = fontSize * 0.35; // approx glyph height in mm
    doc.rect(startX + offset, y - (hHeight * 0.85), hWidth, hHeight, 'F');
  });

  // Re-apply text color and draw text
  doc.setTextColor(currentTextColor);
  doc.text(text.toUpperCase(), x, y, { align });
}

export function generatePDF(stickers: (Sticker & { slotIndex: number })[]) {
  const filename = `labels_${new Date().getTime()}.pdf`;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const SLOTS_PER_PAGE = ROWS_PER_PAGE * COLS_PER_PAGE;

  stickers.forEach((sticker) => {
    if (!sticker) return;

    const pageIndex = Math.floor(sticker.slotIndex / SLOTS_PER_PAGE);
    const slotOnPage = sticker.slotIndex % SLOTS_PER_PAGE;
    
    // Grid Mapping:
    // Slot 0,2,4... = Col 0
    // Slot 1,3,5... = Col 1
    const colIndex = slotOnPage % 2;
    const rowIndex = Math.floor(slotOnPage / 2);

    // Add new page if we've moved to the next page index
    while (doc.getNumberOfPages() <= pageIndex) {
      doc.addPage();
    }
    doc.setPage(pageIndex + 1);

    const x = MARGIN_X + (colIndex * LABEL_WIDTH);
    const y = MARGIN_Y + (rowIndex * LABEL_HEIGHT);

    if (sticker.type === 'header') {
      const width = sticker.isWide ? LABEL_WIDTH * 2 : LABEL_WIDTH;
      const category = CATEGORY_PRESETS.find(p => p.id === sticker.color);
      const colorHex = category?.color || '#0f172a';
      
      const r = parseInt(colorHex.slice(1, 3), 16);
      const g = parseInt(colorHex.slice(3, 5), 16);
      const b = parseInt(colorHex.slice(5, 7), 16);

      // 1. Render Brand (Top)
      if (sticker.brand) {
        doc.setTextColor(0, 0, 0); // black
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(sticker.isWide ? 14 : 10);
        doc.text(sticker.brand.toUpperCase(), x + width / 2, y + 8, { align: 'center' });
      }

      // 2. Render Main Heading (Center)
      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(sticker.isWide ? 32 : 22);
      
      // Vertical adjustment based on presence of brand/description
      const yOffset = (sticker.brand && sticker.description) ? 17 : 
                      (sticker.brand) ? 18 : 
                      (sticker.description) ? 14 : 
                      LABEL_HEIGHT / 2 + 3;
                      
      renderHighlightedText(doc, sticker.heading, sticker.highlights, x + width / 2, y + yOffset, sticker.isWide ? 32 : 22, 'center');

      // 3. Render Description (Bottom)
      if (sticker.description) {
        doc.setTextColor(0, 0, 0); // black
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(sticker.isWide ? 14 : 10);
        doc.text(sticker.description.toUpperCase(), x + width / 2, y + LABEL_HEIGHT - 4, { align: 'center' });
      }
    } else {
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.1);
      doc.rect(x, y, LABEL_WIDTH, LABEL_HEIGHT, 'D');

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      const code = `${sticker.monthIndex} / ${sticker.itemNumber} ${sticker.lackhenbugCode}`;
      doc.text(code, x + LABEL_WIDTH / 2, y + LABEL_HEIGHT / 2 + 2, { align: 'center' });

      if (sticker.deliveryDate) {
        let formattedDate = sticker.deliveryDate;
        if (sticker.deliveryDate.includes('-')) {
          const parts = sticker.deliveryDate.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts;
            formattedDate = `${day}/${month}/${year}`;
          }
        }
        
        doc.setTextColor(220, 38, 38); // red-600
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`DELIVERY: ${formattedDate}`, x + 4, y + LABEL_HEIGHT - 4);
      }

      const category = CATEGORY_PRESETS.find(p => p.id === sticker.color);
      const colorHex = category?.color || '#0f172a';
      const r = parseInt(colorHex.slice(1, 3), 16);
      const g = parseInt(colorHex.slice(3, 5), 16);
      const b = parseInt(colorHex.slice(5, 7), 16);

      doc.setTextColor(r, g, b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      renderHighlightedText(doc, sticker.heading, sticker.highlights, x + LABEL_WIDTH - 4, y + LABEL_HEIGHT - 4, 8, 'right');
    }
  });

  // Attempt to share on mobile if supported
  if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Labels PDF',
        text: 'Generated Labels'
      }).catch((err) => {
        console.error('Sharing failed', err);
        doc.save(filename);
      });
      return;
    }
  }

  doc.save(filename);
}

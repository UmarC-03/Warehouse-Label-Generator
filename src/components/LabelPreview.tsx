import React from 'react';
import { Sticker } from '../types';
import { ROWS_PER_PAGE, COLS_PER_PAGE, CATEGORY_PRESETS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LabelPreviewProps {
  stickers: (Sticker & { slotIndex: number })[];
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({ stickers }) => {
  const totalSlots = stickers.length > 0 ? Math.max(...stickers.map(s => s.slotIndex)) + 1 : 0;
  const SLOTS_PER_PAGE = ROWS_PER_PAGE * COLS_PER_PAGE;
  const numPages = Math.ceil(totalSlots / SLOTS_PER_PAGE) || 1;

  const pages = Array.from({ length: numPages }, (_, i) => {
    return Array.from({ length: SLOTS_PER_PAGE }, (_, slotIdx) => {
      const overallIdx = i * SLOTS_PER_PAGE + slotIdx;
      return stickers.find(s => s?.slotIndex === overallIdx);
    });
  });

  return (
    <div className="space-y-12 pb-20">
      {pages.map((page, pageIdx) => (
        <div key={pageIdx} className="bg-white p-12 industrial-shadow border border-slate-300 w-[210mm] min-h-[297mm] mx-auto flex flex-col box-border">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            <span>Page {String(pageIdx + 1).padStart(2, '0')} / Preview</span>
            <span>A4 Template • 210mm x 297mm</span>
          </div>
          
          <div className="flex-1 grid grid-cols-2 grid-rows-11 gap-1.5 p-2 bg-slate-50/50 border border-slate-100">
            {page.map((sticker, idx) => {
                if (sticker === null || sticker?.type === 'reserved') return null; // Skip reserved slots so span-2 doesn't push grid
                return <StickerCell key={idx} sticker={sticker} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const StickerCell: React.FC<{ sticker?: Sticker | null }> = ({ sticker }) => {
  // If sticker is null or reserved, it means it's a slot reserved by a wide header (Vertical grid would put it in Col 2 Row 0)
  if (sticker === null || sticker?.type === 'reserved') return null;
  
  // If undefined, it's just an empty slot
  if (sticker === undefined) return <div className="bg-slate-100/50 border border-dashed border-slate-200" />;

  const category = CATEGORY_PRESETS.find(p => p.id === sticker.color);
  const color = category?.color || '#0f172a';

  if (sticker.type === 'header') {
      return (
          <div 
            className={cn(
              "flex items-center justify-center font-black text-center p-4 border-2 uppercase tracking-tighter overflow-hidden transition-all shadow-sm",
              sticker.isWide ? "z-10" : ""
            )}
            style={{ 
                gridColumn: sticker.isWide ? 'span 2' : 'span 1',
                borderColor: color,
                color: color,
                gridRow: sticker.isWide ? '1 / 2' : undefined,
                fontSize: sticker.isWide ? '22px' : '14px',
                backgroundColor: `${color}10`
            }}
          >
            <div className="truncate">{sticker.heading}</div>
          </div>
      );
  }

  return (
    <div className="bg-white border-[0.5px] border-dashed border-slate-400 p-3 flex flex-col justify-center items-center relative min-h-[85px] hover:bg-blue-50/30 transition-all group">
      <div className="font-mono font-bold text-slate-900 text-lg tracking-tight mb-4 group-hover:scale-110 transition-transform">
        {sticker.monthIndex} / {String(sticker.itemNumber).padStart(2, '0')} <span style={{ color: color }}>{sticker.lackhenbugCode}</span>
      </div>
      
      <div className="absolute bottom-2 left-2 text-[8px] font-bold text-red-600 uppercase tracking-tighter">
        DELIVERY: {sticker.deliveryDate}
      </div>
      
      <div 
        className="absolute bottom-2 right-2 text-[8px] font-black uppercase tracking-widest truncate max-w-[80px]"
        style={{ color: color }}
      >
        {sticker.heading}
      </div>
    </div>
  );
};

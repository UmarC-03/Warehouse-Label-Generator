import React from 'react';
import { Trash2, Calendar, Hash, DollarSign, Percent, AlertCircle, ChevronRight, Tag, FileText } from 'lucide-react';
import { Order } from '../types';
import { CATEGORY_PRESETS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderCardProps {
  order: Order;
  index: number;
  onUpdate: (id: string, updates: Partial<Order>) => void;
  onRemove: (id: string) => void;
  error?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, index, onUpdate, onRemove, error }) => {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showBrand, setShowBrand] = React.useState(!!order.brand);
  const [showDescription, setShowDescription] = React.useState(!!order.description);
  const [dateMode, setDateMode] = React.useState<'date' | 'month'>('month');
  const [selection, setSelection] = React.useState<{ start: number, end: number, x: number, y: number } | null>(null);
  const isWarning = error?.startsWith('Warning:');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const container = e.currentTarget.closest('.flex-col');
      if (container) {
        const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
        const index = inputs.indexOf(e.currentTarget);
        if (index > -1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      }
    }
  };

  const handleTextSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (start !== null && end !== null && start !== end) {
      const rect = input.getBoundingClientRect();
      setSelection({
        start,
        end,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY - 40
      });
    } else {
      setSelection(null);
    }
  };

  const addHighlight = (color: 'blue' | 'red' | 'yellow') => {
    if (!selection) return;
    
    const newHighlight = { start: selection.start, end: selection.end, color };
    const currentHighlights = order.highlights || [];
    
    // Simple implementation: just keep adding. In a more complex one, we'd merge/filter overlaps.
    onUpdate(order.id, { 
      highlights: [...currentHighlights, newHighlight] 
    });
    setSelection(null);
  };

  const clearHighlights = () => {
    onUpdate(order.id, { highlights: [] });
    setSelection(null);
  };

  return (
    <div className={cn(
      "w-full bg-white rounded-[20px] md:rounded-[24px] p-4 md:p-5 transition-all border border-gray-100 shadow-xl shadow-gray-200/50",
      error ? (isWarning ? "border-amber-200 bg-amber-50/30" : "border-red-200 bg-red-50/30") : ""
    )}>
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Leading Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-gray-900/10">
              {String(index + 1).padStart(2, '0')}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-gray-100 bg-gray-50/50 text-[9px] md:text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-all group"
              >
                {(() => {
                  const preset = CATEGORY_PRESETS.find(p => p.id === order.categoryId) || CATEGORY_PRESETS[0];
                  return (
                    <div 
                      className="w-4 h-4 rounded-md border border-black/5 shadow-sm flex items-center justify-center text-white" 
                      style={{ backgroundColor: preset.color }}
                    >
                      <preset.icon size={10} strokeWidth={3} />
                    </div>
                  );
                })()}
                <span className="text-gray-600">{CATEGORY_PRESETS.find(p => p.id === order.categoryId)?.label || 'Category'}</span>
                <ChevronRight size={12} className={cn("text-gray-400 transition-transform duration-300", showColorPicker ? "rotate-90" : "group-hover:translate-x-0.5")} />
              </button>

              <AnimatePresence>
                {showColorPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 z-50 bg-white rounded-2xl border border-gray-100 shadow-2xl p-3 grid grid-cols-3 gap-3 origin-top-left w-max"
                  >
                    {CATEGORY_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onUpdate(order.id, { categoryId: p.id });
                          setShowColorPicker(false);
                        }}
                        title={p.label}
                        className={cn(
                          "w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center text-white",
                          order.categoryId === p.id ? "border-gray-900 scale-110 shadow-md shadow-gray-200" : "border-transparent opacity-90 hover:opacity-100"
                        )}
                        style={{ backgroundColor: p.color }}
                      >
                        <p.icon size={16} strokeWidth={2.5} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBrand(!showBrand)}
              className={cn(
                "p-2.5 rounded-xl transition-all border",
                showBrand ? "bg-black text-white border-black" : "text-gray-300 border-gray-100 hover:border-gray-300 hover:text-black"
              )}
              title="Toggle Brand"
            >
              <Tag size={18} />
            </button>
            <button
              onClick={() => setShowDescription(!showDescription)}
              className={cn(
                "p-2.5 rounded-xl transition-all border",
                showDescription ? "bg-black text-white border-black" : "text-gray-300 border-gray-100 hover:border-gray-300 hover:text-black"
              )}
              title="Toggle Description"
            >
              <FileText size={18} />
            </button>
            <button
              onClick={() => onRemove(order.id)}
              className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Input Fields Container - Vertical Stack */}
        <div className="flex flex-col gap-3 md:gap-3.5">
          <AnimatePresence>
            {showBrand && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 md:space-y-1.5 overflow-hidden"
              >
                <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1">Brand Name</label>
                <input
                  type="text"
                  value={order.brand || ''}
                  onChange={(e) => onUpdate(order.id, { brand: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="E.G. DEFY"
                  className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all uppercase placeholder:text-gray-200"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1 md:space-y-1.5 relative">
            <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1">Label Heading</label>
            <div className={cn(
              "relative w-full rounded-[14px] md:rounded-[16px] border transition-all overflow-hidden",
              "bg-gray-50/50 border-gray-100 focus-within:bg-white focus-within:border-gray-900 focus-within:shadow-lg focus-within:shadow-gray-100/50",
              order.highlights && order.highlights.length > 0 && "pr-10"
            )}>
              {/* Highlight Backdrop */}
              <div 
                className="absolute inset-0 px-4 md:px-5 py-2 md:py-2.5 text-xs md:text-sm font-bold uppercase pointer-events-none flex items-center"
                aria-hidden="true"
              >
                <div className="backdrop-content w-full h-full flex items-center whitespace-pre overflow-hidden">
                {(() => {
                  const text = (order.heading || '').toUpperCase();
                  if (!order.highlights || order.highlights.length === 0) return null;
                  
                  const segments: React.ReactNode[] = [];
                  let lastIndex = 0;
                  const sorted = [...order.highlights].sort((a,b) => a.start - b.start);
                  
                  sorted.forEach((h, idx) => {
                    if (h.start > lastIndex) {
                      segments.push(<span key={`text-${idx}`} className="text-transparent">{text.substring(lastIndex, h.start)}</span>);
                    }
                    segments.push(
                      <span 
                        key={`highlight-${idx}`} 
                        className={cn(
                          "rounded-[2px] transition-colors py-0.5 -my-0.5 px-0.5 -mx-0.5",
                          h.color === 'blue' ? "bg-blue-500/20" : h.color === 'red' ? "bg-red-500/20" : "bg-yellow-500/30"
                        )}
                      >
                        <span className="text-transparent">{text.substring(h.start, h.end)}</span>
                      </span>
                    );
                    lastIndex = h.end;
                  });
                  return segments;
                })()}
                </div>
              </div>

              <input
                type="text"
                value={order.heading}
                onChange={(e) => {
                  const val = e.target.value;
                  const validHighlights = (order.highlights || []).filter(h => h.end <= val.length);
                  onUpdate(order.id, { heading: val, highlights: validHighlights });
                }}
                onKeyDown={handleKeyDown}
                onSelect={handleTextSelect}
                onKeyUp={handleTextSelect}
                onScroll={(e) => {
                  const backdrop = e.currentTarget.parentElement?.querySelector('.backdrop-content');
                  if (backdrop) {
                    backdrop.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
                placeholder="E.G. MAIN STOVES"
                className="w-full text-xs md:text-sm font-bold bg-transparent px-4 md:px-5 py-2 md:py-2.5 outline-none uppercase placeholder:text-gray-200 relative z-10"
              />

              {order.highlights && order.highlights.length > 0 && (
                <button 
                  onClick={clearHighlights}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1 rounded-md bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                  title="Clear All Highlights"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {selection && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute z-[100] bg-white border border-gray-100 shadow-2xl rounded-xl p-1.5 flex gap-1.5"
                  style={{ 
                    left: 20, 
                    top: -45, 
                  }}
                >
                  <button onClick={() => addHighlight('blue')} className="w-6 h-6 rounded-lg bg-blue-500 hover:scale-110 transition-transform shadow-sm" title="Highlight Blue" />
                  <button onClick={() => addHighlight('red')} className="w-6 h-6 rounded-lg bg-red-500 hover:scale-110 transition-transform shadow-sm" title="Highlight Red" />
                  <button onClick={() => addHighlight('yellow')} className="w-6 h-6 rounded-lg bg-yellow-400 hover:scale-110 transition-transform shadow-sm" title="Highlight Yellow" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showDescription && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 md:space-y-1.5 overflow-hidden"
              >
                <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1">Description</label>
                <input
                  type="text"
                  value={order.description || ''}
                  onChange={(e) => onUpdate(order.id, { description: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="E.G. 4 PLATE COMPACT"
                  className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all uppercase placeholder:text-gray-200"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1 md:space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Calendar size={10} className="text-gray-300" /> {dateMode === 'month' ? 'Delivery Month' : 'Delivery Date (DD/MM/YYYY)'}
              </label>
              
              {/* Delivery Mode Switch */}
              <div className="flex bg-gray-50/50 p-0.5 rounded-md border border-gray-100">
                <button 
                  onClick={() => setDateMode('date')}
                  className={cn(
                    "px-1.5 py-0.5 text-[7px] md:text-[8px] font-black uppercase tracking-wider rounded transition-all",
                    dateMode === 'date' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Day
                </button>
                <button 
                  onClick={() => setDateMode('month')}
                  className={cn(
                    "px-1.5 py-0.5 text-[7px] md:text-[8px] font-black uppercase tracking-wider rounded transition-all",
                    dateMode === 'month' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Month
                </button>
              </div>
            </div>
            <input
              type={dateMode === 'date' ? 'date' : 'month'}
              value={order.deliveryDate || ''}
              onChange={(e) => onUpdate(order.id, { deliveryDate: e.target.value })}
              onKeyDown={handleKeyDown}
              className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Hash size={10} className="text-gray-300" /> Qty
              </label>
              <input
                type="number"
                value={order.quantity === 0 ? '' : order.quantity}
                onChange={(e) => onUpdate(order.id, { quantity: parseInt(e.target.value) || 0 })}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all placeholder:text-gray-200"
              />
            </div>

            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <DollarSign size={10} className="text-gray-300" /> Unit Cost
              </label>
              <input
                type="number"
                value={order.costPrice === 0 ? '' : order.costPrice}
                onChange={(e) => onUpdate(order.id, { costPrice: parseFloat(e.target.value) || 0 })}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all placeholder:text-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Percent size={10} className="text-gray-300" /> VAT Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={order.vatRate === 0 ? '' : order.vatRate}
                  onChange={(e) => onUpdate(order.id, { vatRate: parseFloat(e.target.value) || 0 })}
                  onKeyDown={handleKeyDown}
                  className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all pr-8 md:pr-10"
                />
                <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-gray-300">%</span>
              </div>
            </div>

            <div className="space-y-1 md:space-y-1.5">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Hash size={10} className="text-gray-300" /> Start Index
              </label>
              <input
                type="number"
                value={order.startFrom}
                onChange={(e) => onUpdate(order.id, { startFrom: parseInt(e.target.value) || 1 })}
                onKeyDown={handleKeyDown}
                className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2 md:py-2.5 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* In-Line Warning/Error */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "flex items-center gap-2.5 p-4 rounded-xl border overflow-hidden",
                isWarning ? "text-amber-600 bg-amber-50/50 border-amber-100" : "text-red-600 bg-red-50/50 border-red-100"
              )}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

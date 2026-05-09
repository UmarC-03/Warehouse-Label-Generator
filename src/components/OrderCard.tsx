import React from 'react';
import { Trash2, Calendar, Hash, DollarSign, Percent, AlertCircle, ChevronRight } from 'lucide-react';
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
  const isWarning = error?.startsWith('Warning:');

  return (
    <div className={cn(
      "w-full bg-white rounded-[20px] md:rounded-[24px] p-5 md:p-7 transition-all border border-gray-100 shadow-xl shadow-gray-200/50",
      error ? (isWarning ? "border-amber-200 bg-amber-50/30" : "border-red-200 bg-red-50/30") : ""
    )}>
      <div className="flex flex-col gap-4 md:gap-6">
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
          
          <button
            onClick={() => onRemove(order.id)}
            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Input Fields Container - Vertical Stack */}
        <div className="flex flex-col gap-4 md:gap-5">
          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1">Label Heading</label>
            <input
              type="text"
              value={order.heading}
              onChange={(e) => onUpdate(order.id, { heading: e.target.value })}
              placeholder="E.G. MAIN STOVES"
              className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2.5 md:py-3 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all uppercase placeholder:text-gray-200"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
              <Calendar size={10} className="text-gray-300" /> Date (DD/MM/YYYY)
            </label>
            <input
              type="date"
              value={order.deliveryDate || ''}
              onChange={(e) => onUpdate(order.id, { deliveryDate: e.target.value })}
              className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2.5 md:py-3 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Hash size={10} className="text-gray-300" /> Qty
              </label>
              <input
                type="number"
                value={order.quantity === 0 ? '' : order.quantity}
                onChange={(e) => onUpdate(order.id, { quantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2.5 md:py-3 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all placeholder:text-gray-200"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <DollarSign size={10} className="text-gray-300" /> Unit Cost
              </label>
              <input
                type="number"
                value={order.costPrice === 0 ? '' : order.costPrice}
                onChange={(e) => onUpdate(order.id, { costPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2.5 md:py-3 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all placeholder:text-gray-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Percent size={10} className="text-gray-300" /> VAT Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={order.vatRate}
                  onChange={(e) => onUpdate(order.id, { vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2.5 md:py-3 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all pr-8 md:pr-10"
                />
                <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-gray-300">%</span>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 block tracking-[0.2em] ml-1 flex items-center gap-1.5">
                <Hash size={10} className="text-gray-300" /> Start Index
              </label>
              <input
                type="number"
                value={order.startFrom}
                onChange={(e) => onUpdate(order.id, { startFrom: parseInt(e.target.value) || 1 })}
                className="w-full text-xs md:text-sm font-bold bg-gray-50/50 border border-gray-100 rounded-[14px] md:rounded-[16px] px-4 md:px-5 py-2.5 md:py-3 outline-none focus:bg-white focus:border-gray-900 focus:shadow-lg focus:shadow-gray-100/50 transition-all"
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

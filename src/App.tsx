import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Download, AlertCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Order, Sticker } from './types';
import { OrderCard } from './components/OrderCard';
import { calculateLayout } from './utils/layout';
import { generatePDF } from './utils/pdfGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_ORDER: Omit<Order, 'id'> = {
  heading: '',
  categoryId: 'standard',
  quantity: 0,
  costPrice: 0,
  vatRate: 15,
  startFrom: 1,
  deliveryDate: ''
};

export default function App() {
  const [orders, setOrders] = useState<Order[]>([{ ...INITIAL_ORDER, id: crypto.randomUUID() }]);
  const [activeIndex, setActiveIndex] = useState(0);

  const stickers = useMemo(() => calculateLayout(orders), [orders]);

  const validationResults = useMemo(() => {
    const results: Record<string, string> = {};
    orders.forEach((o) => {
      if (!o.heading.trim()) results[o.id] = "Heading Empty";
      else if (o.quantity <= 0) results[o.id] = "Qty must be > 0";
      else if (o.categoryId === 'standard') results[o.id] = "Warning: Black Text Selected";
      else if (o.costPrice > 0 && o.costPrice <= 350) results[o.id] = "Warning: Low Price (1-350)";
    });
    return results;
  }, [orders]);

  const totalLabels = useMemo(() => orders.reduce((sum, o) => sum + o.quantity, 0), [orders]);

  const addOrder = () => {
    const newId = crypto.randomUUID();
    setOrders([...orders, { ...INITIAL_ORDER, id: newId }]);
    setActiveIndex(orders.length);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOrder = (id: string) => {
    if (orders.length === 1) {
      setOrders([{ ...INITIAL_ORDER, id: crypto.randomUUID() }]);
      setActiveIndex(0);
      return;
    }
    const indexToRemove = orders.findIndex(o => o.id === id);
    const newOrders = orders.filter(o => o.id !== id);
    setOrders(newOrders);
    
    if (activeIndex >= newOrders.length) {
      setActiveIndex(Math.max(0, newOrders.length - 1));
    }
  };

  const clearAll = () => {
    if (confirm('Clear all entries?')) {
      setOrders([{ ...INITIAL_ORDER, id: crypto.randomUUID() }]);
      setActiveIndex(0);
    }
  };

  const handleDownload = () => {
    generatePDF(stickers);
  };

  const nextCard = () => {
    if (activeIndex < orders.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const prevCard = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white font-sans overflow-hidden">
      {/* Main Interface - Constrained to Viewport */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-12 min-h-0 bg-gray-50/50 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 md:gap-8 my-auto">
          
          {/* Header Action */}
          <div className="w-full flex justify-end">
             <button
                onClick={addOrder}
                className="bg-black hover:bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-black/10 flex items-center gap-2 active:scale-95"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Add Line</span>
              </button>
          </div>

          {/* Card Area */}
          <div className="w-full flex items-center justify-center">
            <div className="w-full relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={orders[activeIndex].id}
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.04, y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <OrderCard
                    order={orders[activeIndex]}
                    index={activeIndex}
                    onUpdate={updateOrder}
                    onRemove={removeOrder}
                    error={validationResults[orders[activeIndex].id]}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Centered Navigation Arrows */}
          <div className="flex items-center gap-10 py-1">
            <button
              onClick={prevCard}
              disabled={activeIndex === 0}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-black hover:border-black hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all group"
            >
              <ChevronLeft size={20} className="group-active:-translate-x-1 transition-transform" />
            </button>
            
            <div className="flex flex-col items-center">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 mb-1">Queue Index</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-black text-black leading-none">{activeIndex + 1}</span>
                 <span className="text-[10px] font-black text-gray-300">/ {orders.length}</span>
               </div>
            </div>

            <button
              onClick={nextCard}
              disabled={activeIndex === orders.length - 1}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-black hover:border-black hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all group"
            >
              <ChevronRight size={20} className="group-active:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Controls Hub */}
          <div className="w-full flex flex-col items-center gap-6">
            {/* Liquid Single-Row Horizontal Navigation */}
            <div className="w-full relative group">
              <div className="flex overflow-x-auto gap-2 px-1 py-4 snap-x scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                {orders.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "min-w-[40px] h-10 rounded-xl text-[10px] font-black flex items-center justify-center transition-all border snap-center shrink-0",
                      i === activeIndex 
                        ? "bg-black text-white border-black shadow-lg shadow-black/10 scale-110" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-black"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                
                {/* Empty buffer for scroll padding */}
                <div className="min-w-[12px] h-1 shrink-0"></div>
              </div>
            </div>

            {/* Actions Row */}
            <div className="w-full flex flex-col gap-2.5 pt-4 border-t border-gray-200/60">
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 md:py-4 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-600/20"
              >
                <Download size={14} strokeWidth={3} />
                <span>Export Layout</span>
              </button>

              <div className="flex items-center justify-between mt-3 px-1">
                <button
                  onClick={clearAll}
                  className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  RESET QUEUE
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse"></div>
                  <span className="text-[9px] font-black text-black uppercase tracking-widest">
                    {totalLabels} LABELS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



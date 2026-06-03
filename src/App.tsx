import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Download, AlertCircle, Trash2, ChevronLeft, ChevronRight, Sparkles, Loader2, Lock } from 'lucide-react';
import { Order, Sticker } from './types';
import { OrderCard } from './components/OrderCard';
import { calculateLayout } from './utils/layout';
import { generatePDF } from './utils/pdfGenerator';
import { parseDocumentFile } from './utils/documentParser';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_ORDER: Omit<Order, 'id'> = {
  heading: '',
  brand: '',
  description: '',
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
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stickers = useMemo(() => calculateLayout(orders), [orders]);

  const validationResults = useMemo(() => {
    const results: Record<string, string> = {};
    orders.forEach((o) => {
      if (!o.heading.trim()) results[o.id] = "Heading Empty";
      else if (o.quantity <= 0) results[o.id] = "Qty must be > 0";
      else if (o.quantity > 1000) results[o.id] = "Qty cannot exceed 1000";
      else if (o.categoryId === 'standard') results[o.id] = "Warning: Black Text Selected";
      else if (o.costPrice > 0 && o.costPrice <= 500) results[o.id] = "Warning: Low Price (1-350)";
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
    if (updates.quantity !== undefined) {
      updates.quantity = Math.min(1000, updates.quantity);
    }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportedCount(null);

    try {
      const parsed = await parseDocumentFile(file);
      if (parsed.length === 0) {
        throw new Error("No order items could be extracted from this document.");
      }

      const isBlank = orders.length === 1 && 
                      orders[0].heading === '' && 
                      orders[0].brand === '' && 
                      orders[0].description === '' && 
                      orders[0].quantity === 0;

      let updatedOrders: Order[];
      let targetIndex = 0;

      if (isBlank) {
        updatedOrders = parsed;
        targetIndex = 0;
      } else {
        updatedOrders = [...orders, ...parsed];
        targetIndex = orders.length;
      }

      setOrders(updatedOrders);
      setActiveIndex(targetIndex);
      setImportedCount(parsed.length);
    } catch (err: any) {
      console.error("Import failed:", err);
      setImportError(err.message || "Failed to parse document. Ensure the file contains structured text or tabular data.");
    } finally {
      setIsImporting(false);
      if (e.target) {
        e.target.value = '';
      }
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
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-4 md:py-8 min-h-0 bg-gray-50/50 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center gap-4 md:gap-6 my-auto">
          
          {/* Header Action */}
          <div className="w-full flex items-center justify-between gap-2.5">
             <input 
               type="file"
               ref={fileInputRef}
               onChange={handleFileChange}
               accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
               className="hidden"
             />

             <button
                disabled={true}
                className="flex-1 bg-gray-100 border border-gray-200 text-gray-400 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                title="AI Import Beta is temporarily locked to prevent overuse during evaluation"
              >
                <Lock size={12} className="text-gray-400" />
                <span>Import (AI) [LOCKED]</span>
             </button>

             <button
                onClick={addOrder}
                className="bg-black hover:bg-gray-900 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.12em] transition-all shadow-md shadow-black/10 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus size={13} strokeWidth={3} />
                <span>Add Order</span>
              </button>
          </div>

          {/* AI Import Status and Error Banners */}
          <AnimatePresence>
            {isImporting && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
              >
                <Loader2 size={16} className="animate-spin text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider">AI Parsing Active</p>
                  <p className="text-[9px] font-bold text-blue-600 leading-tight">Extracting contents and reconstructing order cards with OpenRouter...</p>
                </div>
              </motion.div>
            )}

            {importError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="w-full bg-red-50 border border-red-100 rounded-2xl p-3 flex items-start gap-3 shadow-sm relative animate-pulse-once"
              >
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 pr-6">
                  <p className="text-[10px] font-black text-red-900 uppercase tracking-wider">Import Failed</p>
                  <p className="text-[9px] font-bold text-red-600 leading-tight">{importError}</p>
                </div>
                <button 
                  onClick={() => setImportError(null)}
                  className="absolute top-2.5 right-2.5 text-red-400 hover:text-red-700 text-xs font-black"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {importedCount !== null && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
              >
                <Sparkles size={16} className="text-emerald-600 shrink-0 animate-bounce" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">Import Succeeded</p>
                  <p className="text-[9px] font-bold text-emerald-600 leading-tight">Successfully generated <strong>{importedCount}</strong> order cards with AI!</p>
                </div>
                <button 
                  onClick={() => setImportedCount(null)}
                  className="text-emerald-400 hover:text-emerald-700 text-xs font-black shrink-0 px-1"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
          <div className="w-full flex flex-col items-center gap-4">
            {/* Liquid Single-Row Horizontal Navigation */}
            <div className="w-full relative group">
              <div className="flex overflow-x-auto gap-2 px-1 py-2 snap-x scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
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



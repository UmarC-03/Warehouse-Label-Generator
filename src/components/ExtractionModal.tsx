import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { CATEGORY_PRESETS } from '../constants';

interface ExtractionModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  orders: Order[];
  onExtract: (selectedOrders: Order[], forceNewPage: boolean) => void;
}

export function ExtractionModal({ isOpen, onDismiss, orders, onExtract }: ExtractionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [forceNewPage, setForceNewPage] = useState<boolean>(false);

  // Auto-initialize with all active orders selected
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(orders.map(o => o.id)));
    }
  }, [isOpen, orders]);

  if (!isOpen) return null;

  const toggleOrder = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const getCategoryColor = (categoryId: string) => {
    const preset = CATEGORY_PRESETS.find(p => p.id === categoryId);
    return preset?.color || '#000000';
  };

  const handleExtract = () => {
    const selectedOrders = orders.filter(o => selectedIds.has(o.id));
    if (selectedOrders.length === 0) {
      return;
    }
    onExtract(selectedOrders, forceNewPage);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans" id="extraction-modal">
      {/* Top Header Configuration Controls */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white shrink-0">
        {/* Top Left: Custom Force New Page Toggle */}
        <div className="flex items-center" id="left-controls">
          <label className="flex items-center gap-3 cursor-pointer select-none group" id="force-new-page-container">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                id="force-new-page-checkbox"
                checked={forceNewPage}
                onChange={(e) => setForceNewPage(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 border-black rounded transition-all flex items-center justify-center ${forceNewPage ? 'bg-black border-black' : 'bg-white border-black/30 group-hover:border-black'}`}>
                {forceNewPage && (
                  <span className="text-white text-[10px] font-black">✓</span>
                )}
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-black transition-colors">
              Force New Page
            </span>
          </label>
        </div>

        {/* Top Right: DISMISS & EXTRACT Primary Buttons */}
        <div className="flex items-center gap-3" id="right-controls">
          <button
            onClick={onDismiss}
            id="dismiss-btn"
            className="border-2 border-black bg-white hover:bg-gray-50 text-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all cursor-pointer active:scale-95"
          >
            Dismiss
          </button>
          <button
            onClick={handleExtract}
            disabled={selectedIds.size === 0}
            id="extract-btn"
            className="bg-black hover:bg-gray-900 border-2 border-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-md shadow-black/10"
          >
            Extract ({selectedIds.size})
          </button>
        </div>
      </header>

      {/* Main List Rows Container */}
      <main className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50/30" id="extraction-list-container">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                Select Orders to Extract
              </h2>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mt-0.5">
                {selectedIds.size} / {orders.length} Selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set(orders.map(o => o.id)))}
                className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-black transition-colors cursor-pointer"
                id="select-all-btn"
              >
                Select All
              </button>
              <span className="text-gray-300 text-[9px] select-none">|</span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-black transition-colors cursor-pointer"
                id="deselect-all-btn"
              >
                Deselect All
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5" id="extraction-rows-stack">
            {orders.map((order, index) => {
              const isSelected = selectedIds.has(order.id);
              const headingColor = getCategoryColor(order.categoryId);

              return (
                <div
                  key={order.id}
                  onClick={() => toggleOrder(order.id)}
                  id={`order-row-${index}`}
                  className="bg-white border border-gray-100 hover:border-black/20 p-4 rounded-2xl flex items-center gap-4 transition-all duration-150 cursor-pointer shadow-sm select-none hover:shadow-md"
                >
                  {/* 
                    Square Index Box (Matrix State):
                    - Unselected (Default): clear wireframe of white bg with crisp black text
                    - Selected (Active): instantly invert to solid ink-black with bold white text
                  */}
                  <div
                    id={`index-box-${index}`}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] transition-all duration-150 border-2 shrink-0 ${
                      isSelected 
                        ? 'bg-black text-white border-black shadow-md shadow-black/10' 
                        : 'bg-white text-black border-black/15'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Heading details to the right of the selection index box */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span 
                        style={{ color: headingColor }} 
                        className="font-black text-xs uppercase tracking-wider truncate"
                        id={`order-heading-${index}`}
                      >
                        {order.heading.trim() || "(Empty Heading)"}
                      </span>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                        {order.quantity} x {order.categoryId}
                      </span>
                    </div>
                    {(order.brand || order.description) && (
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mt-1 truncate">
                        {[order.brand, order.description].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

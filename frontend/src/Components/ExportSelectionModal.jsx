import React, { useState, useEffect } from "react";
import { X, Search, Check, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ExportSelectionModal = ({ 
  isOpen, 
  onClose, 
  items = [], 
  onExport, 
  title = "Select Items to Export",
  itemNameKey = "name",
  itemDateKey = "date"
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize all as selected when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(items.map(item => item._id)));
    }
  }, [isOpen, items]);

  const filteredItems = items.filter(item => {
    const nameStr = (item.employee?.name || item.employeeName || "Unknown").toLowerCase();
    const tsNameStr = (item.name || "").toLowerCase();
    return nameStr.includes(searchTerm.toLowerCase()) || tsNameStr.includes(searchTerm.toLowerCase());
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item._id)));
    }
  };

  const toggleItem = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = () => {
    const selectedItems = items.filter(item => selectedIds.has(item._id));
    onExport(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
              {selectedIds.size} of {items.length} items selected
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 bg-white border-b border-slate-50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by employee or timesheet name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center justify-between px-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                  selectedIds.size === filteredItems.length && filteredItems.length > 0
                    ? "bg-blue-600 border-blue-600" 
                    : "border-slate-200 group-hover:border-slate-400"
                }`}
              >
                {selectedIds.size === filteredItems.length && filteredItems.length > 0 && <Check size={12} className="text-white" />}
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Select All Visible</span>
            </label>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => toggleItem(item._id)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedIds.has(item._id) ? "bg-blue-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                    selectedIds.has(item._id) ? "bg-blue-600 border-blue-600" : "border-slate-200"
                  }`}>
                    {selectedIds.has(item._id) && <Check size={12} className="text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-700">
                        {item.employee?.name || item.employeeName || "Unknown"}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase">
                        {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-slate-500 font-medium">{item.name || "Unnamed Timesheet"}</p>
                      <p className="text-xs font-black text-blue-600">{(item.submittedHours || 0).toFixed(1)} hrs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-400">No items match your search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="flex-2 px-8 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-700 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            <Download size={14} /> Export {selectedIds.size} Selected
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportSelectionModal;

import React, { useState, useEffect } from "react";
import { Search, Check, Download } from "lucide-react";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";

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

 // Initialize none as selected when modal opens
 useEffect(() => {
 if (isOpen) {
 setSelectedIds(new Set());
 setSearchTerm("");
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

 return (
 <GlassModal
 isOpen={isOpen}
 onClose={onClose}
 title={
 <div className="flex flex-col">
 <span>{title}</span>
 <span className="text-[10px] font-bold text-muted dark:text-muted mt-0.5 uppercase tracking-wide">
 {selectedIds.size} of {items.length} items selected
 </span>
 </div>
 }
 maxWidth="max-w-2xl"
 footer={
 <>
 <GlassButton variant="ghost" onClick={onClose}>
 Cancel
 </GlassButton>
 <GlassButton 
 variant="primary" 
 onClick={handleExport} 
 disabled={selectedIds.size === 0}
 className="flex items-center gap-2"
 >
 <Download size={14} /> Export {selectedIds.size} Selected
 </GlassButton>
 </>
 }
 >
 <div className="flex flex-col h-full space-y-4">
 {/* Search & Actions */}
 <div className="space-y-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted" size={16} />
 <input 
 type="text" 
 placeholder="Search by employee or timesheet name..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="glass-input w-full pl-10 pr-4 py-2.5"
 />
 </div>
 
 <div className="flex items-center justify-between px-2">
 <label className="flex items-center gap-2 cursor-pointer group">
 <div 
 onClick={toggleSelectAll}
 className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
 selectedIds.size === filteredItems.length && filteredItems.length > 0
 ? "bg-brand-primary border-brand-primary" 
 : "border-border-subtle group-hover:border-slate-400 dark:border-slate-600"
 }`}
 >
 {selectedIds.size === filteredItems.length && filteredItems.length > 0 && <Check size={12} className="text-white" />}
 </div>
 <span className="text-xs font-bold text-muted dark:text-muted uppercase tracking-wide">Select All Visible</span>
 </label>
 </div>
 </div>

 {/* List */}
 <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar-visible">
 {filteredItems.length > 0 ? (
 <div className="space-y-1">
 {filteredItems.map((item) => (
 <div 
 key={item._id}
 onClick={() => toggleItem(item._id)}
 className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
 selectedIds.has(item._id) 
 ? "bg-brand-primary/10 border-brand-primary/30" 
 : "bg-surface/50 border-transparent hover:bg-surface dark:bg-slate-800/50 dark:hover:bg-slate-800"
 }`}
 >
 <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
 selectedIds.has(item._id) ? "bg-brand-primary border-brand-primary" : "border-border-subtle dark:border-slate-600"
 }`}>
 {selectedIds.has(item._id) && <Check size={12} className="text-white" />}
 </div>
 
 <div className="flex-1">
 <div className="flex justify-between items-start">
 <p className="text-sm font-bold text-heading dark:text-white">
 {item.employee?.name || item.employeeName || "Unknown"}
 </p>
 <p className="text-[11px] font-bold text-muted dark:text-muted uppercase">
 {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A"}
 </p>
 </div>
 <div className="flex justify-between items-center mt-0.5">
 <p className="text-xs text-muted dark:text-muted font-medium">{item.name || "Unnamed Timesheet"}</p>
 <p className="text-xs font-black text-brand-primary">{(item.submittedHours || 0).toFixed(1)} hrs</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-12 text-center">
 <p className="text-sm font-medium text-muted dark:text-muted">No items match your search</p>
 </div>
 )}
 </div>
 </div>
 </GlassModal>
 );
};

export default ExportSelectionModal;

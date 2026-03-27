import React, { useState } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { toast } from "react-toastify";
import api from "../axios";
import ModernSelect from "./ui/ModernSelect";

const ExpenseForm = ({ onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "travel"
  });
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }
    
    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }
    
    if (!receipt) {
      newErrors.receipt = "Receipt is required";
    } else if (receipt.size > 5 * 1024 * 1024) {
      newErrors.receipt = "File size must be less than 5MB";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setReceipt(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }

    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("amount", formData.amount);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("receipt", receipt);

    try {
      await api.post("/expenses", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Expense submitted successfully!");
      onSubmitSuccess();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Expense Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full bg-white border ${errors.title ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-300`}
          placeholder="e.g., Client Meeting Lunch"
        />
        {errors.title && (
          <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-300 resize-none"
          placeholder="Provide additional details about this expense..."
        />
      </div>

      {/* Amount and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Amount ($) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className={`w-full bg-white border ${errors.amount ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-300`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.amount && (
            <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Category <span className="text-rose-500">*</span>
          </label>
          <ModernSelect
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={[
              { value: "travel", label: "TRAVEL" },
              { value: "food", label: "FOOD" },
              { value: "supplies", label: "SUPPLIES" },
              { value: "equipment", label: "EQUIPMENT" },
              { value: "other", label: "OTHER" }
            ]}
            className="w-full text-[10px] font-bold uppercase"
          />
        </div>
      </div>

      {/* Receipt Upload */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Receipt / Invoice <span className="text-rose-500">*</span>
        </label>
        
        <div
          className={`border-2 border-dashed ${errors.receipt ? 'border-rose-300' : 'border-slate-200'} bg-slate-50/50 rounded-xl p-8 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group`}
          onClick={() => document.getElementById('receipt-upload').click()}
        >
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-32 rounded-xl mx-auto shadow-md border border-white"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReceipt(null);
                  setPreview(null);
                }}
                className="absolute -top-3 -right-3 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : receipt ? (
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                <FileText size={24} className="text-slate-400" />
              </div>
              <span className="text-xs font-bold">{receipt.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReceipt(null);
                }}
                className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline"
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Click or drag receipt</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Supported: PNG, JPG, PDF (Max 5MB)
                </p>
              </div>
            </div>
          )}
          
          <input
            id="receipt-upload"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {errors.receipt && (
          <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.receipt}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-white text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={14} /> 
              <span>Submit Expense</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
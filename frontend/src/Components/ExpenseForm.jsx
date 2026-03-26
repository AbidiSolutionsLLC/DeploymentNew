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
        <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
          Title <span className="text-error">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full border ${errors.title ? 'border-error' : 'border-default'} rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color`}
          placeholder="e.g., Client Meeting Lunch"
        />
        {errors.title && (
          <p className="mt-1 text-[10px] font-bold text-error">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full border border-default rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color resize-none"
          placeholder="Additional details about the expense..."
        />
      </div>

      {/* Amount and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
            Amount ($) <span className="text-error">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className={`w-full border ${errors.amount ? 'border-error' : 'border-default'} rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.amount && (
            <p className="mt-1 text-[10px] font-bold text-error">{errors.amount}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
            Category <span className="text-error">*</span>
          </label>
          <ModernSelect
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={[
              { value: "travel", label: "Travel" },
              { value: "food", label: "Food" },
              { value: "supplies", label: "Supplies" },
              { value: "equipment", label: "Equipment" },
              { value: "other", label: "Other" }
            ]}
            className="w-full"
          />
        </div>
      </div>

      {/* Receipt Upload */}
      <div>
        <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
          Receipt <span className="text-error">*</span>
        </label>
        
        <div
          className={`border-2 border-dashed ${errors.receipt ? 'border-error' : 'border-default'} rounded-xl p-6 text-center hover:border-primary-brand transition-colors cursor-pointer`}
          onClick={() => document.getElementById('receipt-upload').click()}
        >
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-32 rounded-lg mx-auto"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReceipt(null);
                  setPreview(null);
                }}
                className="absolute -top-2 -right-2 p-1 bg-error text-white rounded-full hover:bg-error/80"
              >
                <X size={12} />
              </button>
            </div>
          ) : receipt ? (
            <div className="flex items-center justify-center gap-2 text-primary-brand">
              <FileText size={24} />
              <span className="text-sm font-bold">{receipt.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReceipt(null);
                }}
                className="p-1 text-error hover:text-error/80"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={32} className="mx-auto text-primary-color/30" />
              <p className="text-sm font-bold text-primary-color/60">
                Click to upload receipt
              </p>
              <p className="text-[10px] font-bold text-primary-color/40 uppercase">
                PNG, JPG, PDF (Max 5MB)
              </p>
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
          <p className="mt-1 text-[10px] font-bold text-error">{errors.receipt}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
  
  {/* CANCEL BUTTON */}
  <button
    type="button"
    onClick={onCancel}
    className="flex-1 py-3 
    text-xs font-bold 
    text-slate-600 bg-slate-100 
    hover:bg-slate-200 hover:text-slate-800
    rounded-xl uppercase tracking-wider 
    transition-colors"
  >
    Cancel
  </button>

  {/* SUBMIT BUTTON */}
  <button
    type="submit"
    disabled={loading}
    className="flex-1 py-3 
    bg-[#64748b] text-white 
    rounded-xl text-xs font-bold uppercase tracking-wider 
    hover:bg-[#475569] 
    shadow-md shadow-slate-400/20 
    disabled:opacity-50 disabled:cursor-not-allowed 
    transition-all"
  >
    {loading ? "Submitting..." : "Submit Expense"}
  </button>

</div>
    </form>
  );
};

export default ExpenseForm;
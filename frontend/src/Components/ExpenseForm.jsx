import React, { useState } from "react";
import { Upload, X, FileText, Image, Wand2, CheckCircle, Loader } from "lucide-react";
import { toast } from "react-toastify";
import api from "../axios";
import ModernSelect from "./ui/ModernSelect";

const ExpenseForm = ({ onSubmitSuccess, onCancel }) => {
  // Step state: 'upload' or 'form'
  const [step, setStep] = useState("upload");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "travel"
  });
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [errors, setErrors] = useState({});
  const [documentType, setDocumentType] = useState("receipt"); // "receipt" or "invoice"

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
    return newErrors;
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

  const handleProcessReceipt = async () => {
    if (!receipt) {
      toast.error("Please upload a receipt first");
      return;
    }

    setProcessingReceipt(true);

    const formDataToSend = new FormData();
    formDataToSend.append("receipt", receipt);
    formDataToSend.append("documentType", documentType);

    try {
      const response = await api.post("/expenses/process-receipt", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const extractedData = response.data.data;

      // Auto-fill the form with extracted data
      setFormData({
        title: extractedData.title || "",
        description: extractedData.description || "",
        amount: extractedData.amount || "",
        category: extractedData.category || "other"
      });

      toast.success("Receipt processed! Form auto-filled with extracted data.");
      
      // Move to form step
      setStep("form");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process receipt. Please fill manually.");
    } finally {
      setProcessingReceipt(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError);
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
      
      // Reset and go back to upload step
      setFormData({
        title: "",
        description: "",
        amount: "",
        category: "travel"
      });
      setReceipt(null);
      setPreview(null);
      setStep("upload");
      
      onSubmitSuccess();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to submit expense");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setStep("upload");
    setFormData({
      title: "",
      description: "",
      amount: "",
      category: "travel"
    });
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
    <>
      {/* Step 1: Upload Receipt */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Wand2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900">AI-Powered Receipt Processing</p>
              <p className="text-[10px] text-blue-700 mt-1">
                Upload your receipt or invoice and our AI will automatically extract the details for you.
              </p>
            </div>
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Document Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDocumentType("receipt")}
                className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${
                  documentType === "receipt"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <FileText size={16} /> Receipt
              </button>
              <button
                type="button"
                onClick={() => setDocumentType("invoice")}
                className={`flex-1 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2 ${
                  documentType === "invoice"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <FileText size={16} /> Invoice
              </button>
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Upload {documentType === "receipt" ? "Receipt" : "Invoice"} <span className="text-rose-500">*</span>
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
                    className="max-h-48 rounded-xl mx-auto shadow-md border border-white"
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
                  <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                    <Upload size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Click or drag {documentType}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Supported: DOC, XLS, CSV, TXT, PNG, JPG, PDF (Max 5MB)
                    </p>
                  </div>
                </div>
              )}

              <input
                id="receipt-upload"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {errors.receipt && (
              <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.receipt}</p>
            )}
          </div>

          {/* Process Button */}
          {receipt && (
            <button
              type="button"
              onClick={handleProcessReceipt}
              disabled={processingReceipt}
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
            >
              {processingReceipt ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Processing {documentType === "receipt" ? "Receipt" : "Invoice"}...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Process & Auto-Fill Form</span>
                </>
              )}
            </button>
          )}

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-6 py-3 bg-white text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Step 2: Expense Form */}
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-green-900">Receipt Processed Successfully!</p>
              <p className="text-[10px] text-green-700 mt-1">
                Review and edit the auto-filled details below before submitting.
              </p>
            </div>
          </div>

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
              rows="4"
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

          {/* Receipt Preview */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Uploaded {documentType === "receipt" ? "Receipt" : "Invoice"}
            </label>
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex items-center gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="w-16 h-16 object-cover rounded-lg border border-white shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                  <FileText size={24} className="text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{receipt?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  {(receipt?.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackToUpload}
                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
              >
                Change
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBackToUpload}
              className="flex-1 px-6 py-3 bg-white text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
            >
              Back
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
      )}
    </>
  );
};

export default ExpenseForm;
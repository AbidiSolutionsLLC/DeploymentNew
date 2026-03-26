import { XMarkIcon } from "@heroicons/react/24/solid";

const NotificationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      
      {/* OVERLAY */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* PANEL */}
      <div className="relative w-1/2 h-full bg-white shadow-2xl p-6 flex flex-col">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            Notifications
          </h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6 text-slate-500 hover:text-red-500" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="p-4 bg-slate-100 rounded-xl text-sm">
            No new notifications
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
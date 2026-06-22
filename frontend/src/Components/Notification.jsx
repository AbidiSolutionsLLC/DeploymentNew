import { XMarkIcon } from "@heroicons/react/24/solid";

const NotificationModal = ({ isOpen, onClose }) => {
 if (!isOpen) return null;

 // ✅ Dummy notifications JSON
 const notifications = [
 {
 id: 1,
 title: "New Order",
 message: "You received a new order from Ahmed.",
 time: "2 min ago",
 },
 {
 id: 2,
 title: "Payment Received",
 message: "Your payment of $120 has been received.",
 time: "10 min ago",
 },
 {
 id: 3,
 title: "System Update",
 message: "System maintenance scheduled at midnight.",
 time: "1 hour ago",
 },
 ];

 return (
 <div className="fixed inset-0 z-[9999] flex justify-end">
 
 {/* OVERLAY */}
 <div
 className="absolute inset-0 bg-app"
 onClick={onClose}
 />

 {/* PANEL */}
 <div className="relative w-1/2 h-full bg-surface shadow-2xl p-6 flex flex-col">
 
 {/* HEADER */}
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-main">
 Notifications
 </h2>
 <button onClick={onClose}>
 <XMarkIcon className="w-6 h-6 text-muted hover:text-red-500" />
 </button>
 </div>

 {/* CONTENT */}
 <div className="flex-1 overflow-y-auto space-y-3">
 {notifications.length > 0 ? (
 notifications.map((item) => (
 <div
 key={item.id}
 className="p-4 bg-app rounded-xl text-sm"
 >
 <p className="font-semibold text-main">
 {item.title}
 </p>
 <p className="text-muted">{item.message}</p>
 <span className="text-xs text-muted">
 {item.time}
 </span>
 </div>
 ))
 ) : (
 <div className="p-4 bg-app rounded-xl text-sm">
 No new notifications
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default NotificationModal;
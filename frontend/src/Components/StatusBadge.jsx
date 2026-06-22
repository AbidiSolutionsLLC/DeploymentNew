import React from 'react';

const StatusBadge = ({ status }) => {
 if (!status) return null;
 const statusStr = status.toString().toLowerCase();

 let colors = 'bg-app text-main border-subtle';
 let dotColor = 'bg-slate-500';

 // Active / Approved / Completed → green bg + green text
 if (['active', 'approved', 'completed', 'resolved', 'paid'].includes(statusStr)) {
 colors = 'bg-green-50 text-green-700 border-green-200';
 dotColor = 'bg-green-500';
 }
 // Pending / In Progress → amber bg + amber text
 else if (['pending', 'in progress', 'open', 'planning'].includes(statusStr)) {
 colors = 'bg-amber-50 text-amber-700 border-amber-200';
 dotColor = 'bg-amber-500';
 }
 // In Review → purple bg + purple text
 else if (['in review'].includes(statusStr)) {
 colors = 'bg-purple-50 text-purple-700 border-purple-200';
 dotColor = 'bg-purple-500';
 }
 // Inactive / Rejected / Blocked → red bg + red text
 else if (['inactive', 'rejected', 'blocked', 'cancelled', 'suspended', 'closed', 'unpaid'].includes(statusStr)) {
 colors = 'bg-red-50 text-red-700 border-red-200';
 dotColor = 'bg-red-500';
 }
 // Draft / Todo → gray bg + gray text
 else if (['draft', 'todo', 'invited', 'on hold'].includes(statusStr)) {
 colors = 'bg-app text-main border-subtle';
 dotColor = 'bg-slate-500';
 }

 return (
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colors}`}>
 <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
 <span className="capitalize">{status}</span>
 </span>
 );
};

export default StatusBadge;

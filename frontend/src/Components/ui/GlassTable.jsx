import React from "react";

/**
 * Standardized table wrapper for the Golden White Glassmorphism Design System.
 */
export default function GlassTable({ headers, children }) {
 return (
 <table className="min-w-full text-sm border-separate border-spacing-0">
 <thead>
 <tr className="bg-surface/50 ">
 {headers.map((header, idx) => (
 <th 
 key={idx} 
 className="p-3 font-semibold text-xs uppercase tracking-wide border-b border-border-subtle text-left text-heading"
 >
 {header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border-subtle">
 {children}
 </tbody>
 </table>
 );
}

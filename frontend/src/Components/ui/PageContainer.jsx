import React from "react";

/**
 * Standardized Page Container for the Golden White Glassmorphism Design System.
 * Ensures consistent padding, margins, card layouts, and typography across all pages.
 */
export default function PageContainer({ 
 title, 
 subtitle, 
 headerActions, 
 filters, 
 topWidgets,
 bottomWidgets,
 isCard = true, 
 loading = false,
 children 
}) {
 return (
 <div className="flex flex-col gap-4 w-full h-full">
 
 {/* Header & Filters Glass Card */}
 {(title || subtitle || headerActions || filters) && (
 <div className="glass-card flex flex-col gap-4 relative z-50">
 
 {/* Header Title & Actions */}
 {(title || subtitle || headerActions) && (
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 {title && <h2 className="text-base font-bold text-heading uppercase tracking-tight">{title}</h2>}
 {subtitle && <p className="text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1">{subtitle}</p>}
 </div>
 
 {headerActions && (
 <div className="flex items-center gap-2">
 {headerActions}
 </div>
 )}
 </div>
 )}

 {/* Filters Area */}
 {filters && (
 <>
 {(title || subtitle || headerActions) && <hr className="border-border-subtle" />}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
 {filters}
 </div>
 </>
 )}
 </div>
 )}

 {/* Top Widgets (Analytics / Stats) */}
 {topWidgets && (
 <div className="w-full">
 {topWidgets}
 </div>
 )}

 {/* Main Content Area */}
 {isCard ? (
 <div className="glass-card flex-1 relative z-0 overflow-hidden flex flex-col">
 {loading ? (
 <div className="text-center p-8 flex flex-col items-center justify-center flex-1">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
 <p className="mt-3 text-muted text-xs font-medium uppercase tracking-wide">Loading data...</p>
 </div>
 ) : (
 <div className="flex-1 w-full overflow-x-auto">
 {children}
 </div>
 )}
 </div>
 ) : (
 <div className="flex-1 relative z-0 w-full">
 {loading ? (
 <div className="text-center p-8 flex flex-col items-center justify-center">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
 </div>
 ) : (
 children
 )}
 </div>
 )}

 {/* Bottom Widgets (Pagination / Footer Stats) */}
 {bottomWidgets && (
 <div className="glass-card">
 {bottomWidgets}
 </div>
 )}

 </div>
 );
}

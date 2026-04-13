import React from "react";
import { Monitor } from "lucide-react";

/**
 * MobileBlock Component
 * 
 * Displayed when the application is accessed from a touch-centric device (Mobile/Tablet).
 * Blocks interaction and prompts the user to switch to a desktop device.
 */
const MobileBlock = () => {
    return (
        <div className="mobile-block-overlay">
            <div className="mobile-block-content">
                <div className="mobile-block-icon">
                    <Monitor size={40} strokeWidth={2.5} />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">
                    DESKTOP ONLY
                </h1>
                
                <p className="text-slate-500 leading-relaxed font-medium">
                    This portal is designed for desktop systems. Please access from your computer for the best experience.
                </p>
                
                <div className="mt-8 pt-8 border-t border-slate-100">
                    <p className="text-2xs uppercase tracking-widest font-black text-slate-400">
                        Workplace Management System
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileBlock;

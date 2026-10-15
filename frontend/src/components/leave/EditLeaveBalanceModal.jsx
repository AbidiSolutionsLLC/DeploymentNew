import React, { useEffect, useState } from "react";
import api from "../../axios";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";
import { getApiError } from "../../utils/validationUtils";
import {
  computeLeaveStats,
  getInitials,
  EMP_TYPE_BADGE,
  EMP_TYPE_VARIANTS,
} from "./leaveStats";

/**
 * Modal used from the Manage Leaves tab to update an employee's
 * remaining PTO / Sick leave balance (PUT /users/:id/leaves).
 */
export default function EditLeaveBalanceModal({ user, isOpen, onClose, onSaved }) {
  const [pto, setPto] = useState(0);
  const [sick, setSick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPto(Number(user?.leaves?.pto) || 0);
      setSick(Number(user?.leaves?.sick) || 0);
    }
  }, [user]);

  if (!user) return null;

  const stats = computeLeaveStats(user);

  const handleSave = async () => {
    if (pto < 0 || sick < 0 || Number.isNaN(pto) || Number.isNaN(sick)) return;
    setSaving(true);
    try {
      await api.put(`/users/${user._id}/leaves`, { pto, sick });
      if (onSaved) onSaved();
    } catch (error) {
      console.error("Failed to update leave balances:", error);
      if (onSaved) onSaved(getApiError(error, "Failed to update leave balance"));
    } finally {
      setSaving(false);
    }
  };

  const numberInput =
    "w-full px-4 py-3 bg-white dark:bg-slate-800 border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-border-accent focus:border-border-accent transition-all text-sm font-bold text-heading disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Leave Balance"
      description="Set the employee's remaining PTO and Sick leave days"
      maxWidth="max-w-lg"
      footer={
        <>
          <GlassButton variant="ghost" onClick={onClose} disabled={saving}>
            CANCEL
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={Number.isNaN(pto) || Number.isNaN(sick) || pto < 0 || sick < 0}
          >
            {saving ? "SAVING..." : "SAVE BALANCE"}
          </GlassButton>
        </>
      }
    >
      {/* Employee summary */}
      <div className="flex items-center gap-3 p-3 mb-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border-subtle">
        <div className="w-11 h-11 rounded-full bg-amber-100 text-brand-text border border-amber-200 flex items-center justify-center font-black text-sm flex-shrink-0">
          {getInitials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-heading truncate">{user.name}</p>
          <p className="text-[11px] text-muted truncate">
            {user.designation || "No designation"} · {user.empID || "No ID"}
          </p>
        </div>
        <span
          className={`${EMP_TYPE_BADGE} ${
            EMP_TYPE_VARIANTS[user.empType] || EMP_TYPE_VARIANTS.Permanent
          } ml-auto`}
        >
          {user.empType || "Permanent"}
        </span>
      </div>

      {/* Current position */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Allowance", value: stats.allowanceTotal, cls: "text-main" },
          { label: "Used", value: stats.usedTotal, cls: "text-amber-600 dark:text-amber-400" },
          {
            label: "Remaining",
            value: stats.remainingTotal,
            cls:
              stats.balanceStatus === "healthy"
                ? "lm-success-value"
                : stats.balanceStatus === "low"
                ? "text-amber-600 dark:text-amber-400"
                : "text-rose-600 dark:text-rose-400",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border-subtle bg-white dark:bg-slate-800 p-3 text-center transition-colors hover:border-border-accent"
          >
            <p className={`text-lg font-black tabular-nums ${item.cls}`}>{item.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted mt-0.5">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
            PTO Balance (Days)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={pto}
            onChange={(e) => setPto(Math.max(0, Number(e.target.value)))}
            className={numberInput}
          />
          <p className="text-[10px] text-muted mt-1.5 font-medium">
            Used to date: {stats.usedPto} · Allowance: {stats.allowancePto}
          </p>
        </div>
        <div>
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
            Sick Balance (Days)
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={sick}
            onChange={(e) => setSick(Math.max(0, Number(e.target.value)))}
            className={numberInput}
          />
          <p className="text-[10px] text-muted mt-1.5 font-medium">
            Used to date: {stats.usedSick} · Allowance: {stats.allowanceSick}
          </p>
        </div>
      </div>

      <div className="mt-5 p-3 rounded-xl bg-info-bg border border-info-border text-[11px] font-medium text-info leading-relaxed">
        These values replace the employee's <strong>remaining</strong> balance. Pending and
        approved requests are already deducted from it.
      </div>
    </GlassModal>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import PageContainer from "../../components/ui/PageContainer";
import GlassButton from "../../components/ui/GlassButton";
import {
  SquaresPlusIcon,
  ArrowLeftIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Project Portal"
      subtitle="Under Active Development"
      icon={SquaresPlusIcon}
      isCard={false}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-surface dark:bg-slate-900/60 border border-border-primary dark:border-[#FFD700]/20 p-6 sm:p-10 lg:p-14 shadow-[0_8px_32px_rgba(0,0,0,0.06)] text-center">
        {/* Ambient background glow accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30 dark:opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-brand-primary), transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-25 dark:opacity-15"
          style={{ background: "radial-gradient(circle, var(--color-brand-primary), transparent 70%)" }}
        />

        {/* Content container */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Animated Central Icon Badge */}
          <Motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative inline-flex items-center justify-center mb-5"
          >
            <div className="absolute inset-0 rounded-3xl bg-amber-400/20 dark:bg-amber-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200/90 dark:from-amber-950/70 dark:via-slate-900/90 dark:to-amber-900/50 border border-amber-300/60 dark:border-amber-500/30 shadow-[0_8px_24px_rgba(217,162,31,0.25)] flex items-center justify-center text-amber-600 dark:text-amber-400">
              <SquaresPlusIcon className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_4px_10px_rgba(217,162,31,0.35)]" />
            </div>
          </Motion.div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Under Active Development</span>
            <span className="text-amber-400/60">•</span>
            <span className="text-[11px] font-semibold text-muted">Coming Soon</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-heading tracking-tight mb-3">
            Project Portal is{" "}
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-200 bg-clip-text text-transparent">
              Under Development
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed mb-8">
            We are crafting a comprehensive workspace for tracking projects, milestones, sprints, and team deliverables. This module will bring unified project planning and real-time execution directly to your Karbexa workspace.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <GlassButton
              variant="primary"
              size="md"
              icon={HomeIcon}
              onClick={() => navigate('/people/home')}
            >
              Return to People Portal
            </GlassButton>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl border border-border-primary dark:border-[#FFD700]/20 text-secondary hover:bg-hover hover:border-border-accent transition-all duration-200"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ComingSoon;

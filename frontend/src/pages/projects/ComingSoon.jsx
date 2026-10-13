import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import PageContainer from "../../components/ui/PageContainer";
import GlassButton from "../../components/ui/GlassButton";
import {
  SquaresPlusIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  HomeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const upcomingFeatures = [
  {
    icon: ClipboardDocumentListIcon,
    title: "Tasks & Sprint Boards",
    description: "Interactive Kanban views, sprint planning, task assignments, and custom workflow tracking.",
    status: "In Progress",
  },
  {
    icon: PresentationChartLineIcon,
    title: "Milestones & Roadmaps",
    description: "Visual project timelines, delivery deadlines, and milestone dependencies in real time.",
    status: "Designing",
  },
  {
    icon: UserGroupIcon,
    title: "Team Collaboration",
    description: "Workload balancing, instant activity logs, task discussions, and project progress metrics.",
    status: "Planned",
  },
];

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Project Portal"
      subtitle="Under Active Development"
      icon={SquaresPlusIcon}
      isCard={false}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-surface dark:bg-slate-900/60 border border-border-primary dark:border-white/10 p-6 sm:p-10 lg:p-14 shadow-[0_8px_32px_rgba(0,0,0,0.06)] text-center">
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

          {/* Preview Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8 text-left">
            {upcomingFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 + idx * 0.08 }}
                  className="p-5 rounded-2xl bg-surface/80 dark:bg-slate-800/40 border border-border-subtle dark:border-white/10 hover:border-amber-400/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-heading mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-border-subtle/50 text-[11px]">
                    <span className="font-semibold text-muted">Status</span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {feature.status}
                    </span>
                  </div>
                </Motion.div>
              );
            })}
          </div>

          {/* Progress / Status Bar */}
          <div className="w-full max-w-md mx-auto mb-8 p-4 rounded-2xl bg-surface/60 dark:bg-slate-800/30 border border-border-subtle dark:border-white/10">
            <div className="flex justify-between items-center text-xs font-semibold mb-2">
              <span className="text-heading flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                Feature Rollout
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">Phase 1 in progress</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(217,162,31,0.5)]"
                style={{ width: "68%" }}
              />
            </div>
          </div>

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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl border border-border-primary dark:border-white/10 text-secondary hover:bg-hover hover:border-border-accent transition-all duration-200"
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

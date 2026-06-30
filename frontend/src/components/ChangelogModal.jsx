import React, { useState, useEffect } from 'react';
import GlassModal from './ui/GlassModal';

export default function ChangelogModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already seen this specific changelog version
    const hasSeen = localStorage.getItem('karbexa_changelog_v1_seen');
    if (!hasSeen) {
      // Small delay for better UX after loading
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('karbexa_changelog_v1_seen', 'true');
    setIsOpen(false);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Karbexa: What's New"
      description="A quick, easy summary for the whole team — June 30, 2026"
      maxWidth="max-w-3xl"
      footer={
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      }
    >
      <div className="space-y-8 text-sm text-slate-700 dark:text-slate-300">
        <p className="leading-relaxed text-base text-slate-900 dark:text-slate-100 font-medium">
          We've spent the last few weeks giving Karbexa a major upgrade. Here's the short version of what changed and why it matters to you.
        </p>

        <div className="space-y-6">
          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">1. One Consistent Look & Feel</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-slate-800 dark:text-slate-200">Before:</strong> every page looked and worked a bit differently.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">Now:</strong> buttons, forms, tables, and pop-ups look and behave the same everywhere.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">Why it matters:</strong> less re-learning, more intuitive to use.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">2. Faster & More Reliable</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Background tasks (like reports) no longer slow down or break the app.</li>
              <li>Holidays, Timesheets, and Leave data now match up correctly everywhere.</li>
              <li>Profile details and dashboard greetings are always accurate.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">3. Major Bugs Fixed</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>No more sidebar disappearing or app crashing.</li>
              <li>Fixed mismatched totals, blank screens, and conflicting data in tables.</li>
              <li>Login and session issues resolved — more secure, more seamless.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">4. New Theme Options</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>You can now switch between Light, Dark, or System theme — whatever's easiest on your eyes.</li>
            </ul>
          </section>
        </div>

        <section className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">What This Means for the Team</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Less time fighting bugs — more time getting work done.</li>
            <li>A stronger foundation for new features to be built faster and safer going forward.</li>
            <li>A more professional, trustworthy product for everyone who uses it.</li>
          </ul>
        </section>

        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800/30">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p>
            <strong className="font-semibold">Heads up:</strong> Karbexa will soon be becoming Sowaye — same great platform, new name. More details to come!
          </p>
        </div>
      </div>
    </GlassModal>
  );
}

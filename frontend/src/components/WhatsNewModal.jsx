import React, { useState, useEffect } from 'react';
import GlassModal from './ui/GlassModal';
import { X } from 'lucide-react';

const RELEASE_VERSION = '1.2.0';
const RELEASE_DATE = '14 Oct 2026';
const STORAGE_KEY = `release_notes_${RELEASE_VERSION.replace(/\./g, '_')}_seen`;

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="What's New"
      description={`Version ${RELEASE_VERSION} \u2014 Released on ${RELEASE_DATE}`}
      maxWidth="max-w-3xl"
      footer={
        <button
          onClick={handleClose}
          className="btn btn-primary px-6 py-2 rounded-lg font-medium"
        >
          Got it
        </button>
      }
    >
      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <p className="leading-relaxed text-base text-slate-900 dark:text-slate-100 font-medium">
          We've refreshed the portal with a cleaner design, smoother navigation and faster workflows across every section.
        </p>

        <div className="space-y-6">
          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Design & Appearance</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Clearer, easier-to-read text across the app with improved contrast and brighter colors</li>
              <li>Cleaner look with solid white cards replacing heavy transparent effects</li>
              <li>Nicer buttons, inputs and popups with consistent styling and smoother animations</li>
              <li>Sharper status badges, notifications and profile page styling</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Home & Navigation</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Refreshed home screen \u2014 Attendance, Notes, To-Do, Holidays, Leave Log and Birthday cards all redesigned</li>
              <li>Smooth new tab bar with live counts to switch between sections faster</li>
              <li>New animated page headers with quick summary stats on admin screens</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Tables & Lists</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Easier filtering with a unified search and filter panel on list pages</li>
              <li>Tables now keep key columns frozen while you scroll sideways \u2014 no more losing track of names or IDs</li>
              <li>Improved table rows, spacing and pagination for better readability</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Attendance & Leave</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Redesigned Attendance screens with clearer layout and status views</li>
              <li>Leave section reorganized into simple tabs: My Leaves, Requests, Holidays and History</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Tickets & Org Chart</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Revamped Tickets pages \u2014 raising, assigning and viewing tickets feels quicker and simpler</li>
              <li>Upgraded Org Chart with a clearer, easier-to-navigate layout</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Themes & Responsiveness</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Better dark, light and system theme switching that follows your device setting</li>
              <li>Improved mobile responsiveness \u2014 menus and sidebars work better on smaller screens</li>
            </ul>
          </section>
        </div>
      </div>
    </GlassModal>
  );
}
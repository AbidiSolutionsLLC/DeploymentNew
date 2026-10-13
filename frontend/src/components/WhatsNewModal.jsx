import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import GlassModal from './ui/GlassModal';
import api from '../axios';
import { setUser } from '../slices/userSlice';
import { setAuthUser } from '../slices/authSlice';

const RELEASE_VERSION = '1.2.0';
const RELEASE_DATE = '14 Oct 2026';
const STORAGE_KEY = `release_notes_${RELEASE_VERSION.replace(/\./g, '_')}_seen`;

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  const authUser = useSelector((state) => state.auth?.user);
  const userInfo = useSelector((state) => state.user?.userInfo);
  const currentUser =
    authUser?.data?.user || authUser?.user || authUser || userInfo?.data?.user || userInfo?.user || userInfo;
  const storageKey = `release_notes_${RELEASE_VERSION.replace(/\./g, '_')}_seen`;

  const isSeenInDb = currentUser?.lastSeenReleaseNote === RELEASE_VERSION;
  const isSeenInStorage = localStorage.getItem(storageKey) === 'true';
  const alreadySeen = isSeenInDb || isSeenInStorage;

  useEffect(() => {
    if (!currentUser) return;

    if (!alreadySeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentUser, alreadySeen]);

  const handleClose = async () => {
    // 1. Immediately mark seen in localStorage
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);

    // 2. Persist to database so across devices and logins it never reappears
    try {
      const res = await api.put('/users/settings', {
        lastSeenReleaseNote: RELEASE_VERSION,
      });
      const updatedUser = res.data?.data?.user || res.data?.data || res.data;
      if (updatedUser) {
        dispatch(setUser(updatedUser));
        dispatch(setAuthUser(updatedUser));
      }
    } catch (err) {
      console.warn('Could not save release note status to server:', err?.message);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={handleClose}
      title="What's New"
      description={`Version ${RELEASE_VERSION} — Released on ${RELEASE_DATE}`}
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
              <li>Refreshed home screen — Attendance, Notes, To-Do, Holidays, Leave Log and Birthday cards all redesigned</li>
              <li>Smooth new tab bar with live counts to switch between sections faster</li>
              <li>New animated page headers with quick summary stats on admin screens</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Tables & Lists</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Easier filtering with a unified search and filter panel on list pages</li>
              <li>Tables now keep key columns frozen while you scroll sideways — no more losing track of names or IDs</li>
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
              <li>Revamped Tickets pages — raising, assigning and viewing tickets feels quicker and simpler</li>
              <li>Upgraded Org Chart with a clearer, easier-to-navigate layout</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">Themes & Responsiveness</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Better dark, light and system theme switching that follows your device setting</li>
              <li>Improved mobile responsiveness — menus and sidebars work better on smaller screens</li>
            </ul>
          </section>
        </div>
      </div>
    </GlassModal>
  );
}
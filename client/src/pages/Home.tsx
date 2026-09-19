import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Building2 } from 'lucide-react';

const ClayDocumentIcon: React.FC = () => (
  <div className="relative inline-block animate-gentle-float select-none my-3 transition-transform duration-300 hover:scale-105">
    <svg
      width="96"
      height="110"
      viewBox="0 0 96 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-md"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="clayBody" x1="16" y1="8" x2="80" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C98F77" />
          <stop offset="50%" stopColor="#BA7D64" />
          <stop offset="100%" stopColor="#A2664E" />
        </linearGradient>

        <linearGradient id="clayFold" x1="62" y1="8" x2="80" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8B8A2" />
          <stop offset="100%" stopColor="#CB9179" />
        </linearGradient>

        <radialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="70%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>

        <filter id="docShadow" x="0" y="94" width="96" height="16" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Dynamic soft contact shadow */}
      <ellipse cx="48" cy="102" rx="34" ry="4" fill="#242321" fillOpacity="0.16" filter="url(#docShadow)" />

      {/* Main Document Body with smooth rounded corners */}
      <path
        d="M20 10C20 6.68629 22.6863 4 26 4H62L80 22V92C80 95.3137 77.3137 98 74 98H26C22.6863 98 20 95.3137 20 92V10Z"
        fill="url(#clayBody)"
      />

      {/* Tactile bevel / inner highlight */}
      <path
        d="M21 10C21 7.23858 23.2386 5 26 5H61.5L79 22.5V92C79 94.7614 76.7614 97 74 97H26C23.2386 97 21 94.7614 21 92V10Z"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="1"
      />

      {/* Folded Corner Under-Shadow */}
      <path
        d="M62 4V22H80L62 4Z"
        fill="#7A442E"
        fillOpacity="0.45"
      />

      {/* Folded Corner Flap */}
      <path
        d="M62 4L80 22H66C63.7909 22 62 20.2091 62 18V4Z"
        fill="url(#clayFold)"
      />

      {/* Fold Crease Highlight */}
      <path
        d="M62 4L80 22"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* Debossed Text Lines (Engraved 3D look) */}
      <rect x="30" y="32" width="28" height="4" rx="2" fill="#FAF6F0" fillOpacity="0.9" />
      <rect x="30" y="33" width="28" height="1" rx="0.5" fill="#7A442E" fillOpacity="0.2" />

      <rect x="30" y="42" width="36" height="3.5" rx="1.75" fill="#FAF6F0" fillOpacity="0.85" />
      <rect x="30" y="51" width="32" height="3.5" rx="1.75" fill="#FAF6F0" fillOpacity="0.85" />
      <rect x="30" y="60" width="22" height="3.5" rx="1.75" fill="#FAF6F0" fillOpacity="0.85" />

      {/* Verified Audit Ribbon Tails */}
      <path
        d="M56 78L52 92L58 89L64 92L60 78"
        fill="#047857"
        fillOpacity="0.85"
      />

      {/* Official Audit Verification Seal Badge */}
      <circle cx="58" cy="76" r="11" fill="url(#sealGlow)" />
      <circle cx="58" cy="76" r="10" stroke="white" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="58" cy="76" r="8.5" fill="#059669" />

      {/* Seal Checkmark */}
      <path
        d="M54 76L56.8 78.8L62.5 73.2"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center items-center py-6 sm:py-10 max-w-3xl mx-auto w-full select-none space-y-10 sm:space-y-12">
      {/* 1. Centered Editorial Hero */}
      <section className="text-center w-full px-4 flex flex-col items-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/80 border border-stone-200/60 text-[11px] font-medium tracking-[0.2em] text-[#8C827A] uppercase font-sans mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B98268]" />
          AUDITFLOW
        </div>

        {/* Tactile Cool Clay Document Accent */}
        <div>
          <ClayDocumentIcon />
        </div>

        {/* Main Title - ONLY element in PT Serif */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-[66px] lg:text-[72px] text-[#242321] leading-[1.08] tracking-tight font-normal max-w-3xl mx-auto mt-3">
          Audit document review, without the scattered workflow.
        </h1>

        {/* Subtle Firm Context (Normal Font) */}
        {user && (
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-sans">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <span>Workspace: <strong className="text-stone-700 font-medium">{user.firm?.name}</strong></span>
            <span className="text-stone-300">•</span>
            <span className="font-mono text-[10px] text-stone-500">{user.name} ({user.role})</span>
          </div>
        )}
      </section>

      {/* 2. Trust & Auditability Section */}
      <section className="w-full bg-white/85 border border-stone-200/80 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
        {/* Header in Normal Font */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight font-sans">
          Every decision leaves a trail.
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed font-sans">
          Uploads, corrections, reviews, approvals, and requirement changes are recorded with the responsible user and timestamp.
        </p>

        {/* Colorful Timeline Progression */}
        <div className="mt-6 pt-5 border-t border-stone-200/60 max-w-xl mx-auto">
          <div className="flex items-center justify-between font-sans relative">
            {/* Multi-color connecting progression gradient line */}
            <div className="absolute top-1.5 inset-x-4 h-0.5 bg-gradient-to-r from-blue-300 via-amber-300 via-rose-300 via-violet-300 to-emerald-300 -z-0 rounded-full opacity-60" />

            {/* 1. Uploaded (Vibrant Blue) */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-[#FAF9F6] px-1 sm:px-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100 shadow-xs" />
              <span className="text-[10px] sm:text-xs font-semibold text-blue-950">Uploaded</span>
            </div>

            {/* 2. Under Review (Vibrant Amber) */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-[#FAF9F6] px-1 sm:px-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100 shadow-xs" />
              <span className="text-[10px] sm:text-xs font-semibold text-amber-950">Under Review</span>
            </div>

            {/* 3. Correction (Vibrant Rose) */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-[#FAF9F6] px-1 sm:px-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100 shadow-xs" />
              <span className="text-[10px] sm:text-xs font-semibold text-rose-950">Correction</span>
            </div>

            {/* 4. Re-uploaded (Vibrant Violet) */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-[#FAF9F6] px-1 sm:px-2">
              <span className="w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-100 shadow-xs" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-950">Re-uploaded</span>
            </div>

            {/* 5. Approved (Vibrant Emerald) */}
            <div className="flex flex-col items-center gap-1.5 relative z-10 bg-[#FAF9F6] px-1 sm:px-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shadow-xs" />
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-950">Approved</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

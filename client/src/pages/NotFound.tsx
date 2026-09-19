import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
        <Compass className="w-6 h-6 text-slate-500 stroke-[1.5]" />
      </div>
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">404 Error</span>
      <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Page Not Found</h2>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
        The audit page or resource you requested could not be located in this firm tenant.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
      </Link>
    </div>
  );
};

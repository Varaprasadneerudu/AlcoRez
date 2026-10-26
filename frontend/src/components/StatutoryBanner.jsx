import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StatutoryBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-950 text-amber-100 text-xs py-2 px-4 border-b border-amber-900/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black text-[10px] uppercase tracking-wider shrink-0">
            DEMO ONLY
          </span>
          <p className="truncate">
            <span className="font-semibold text-amber-200">Telangana Excise Compliance:</span> Alcohol sales & doorstep delivery are strictly regulated. All checkouts simulate test orders only. Live transactions disabled.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/compliance-info"
            className="text-amber-300 hover:text-white underline underline-offset-2 font-medium"
          >
            Legal Notice
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

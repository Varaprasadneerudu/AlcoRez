import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LegalAgeModal() {
  const { ageVerified, confirmAge } = useAuth();

  if (ageVerified) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
            <ShieldAlert className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Statutory Age Verification</h2>
          <p className="text-xs text-amber-200 mt-1 uppercase tracking-wider font-semibold">
            Government of Telangana — Prohibition & Excise
          </p>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-stone-700 text-sm leading-relaxed">
            Under the <strong className="text-stone-900">Telangana Excise Act, 1968</strong>, you must be at least <span className="text-amber-800 font-bold text-base">21 years of age</span> to access alcoholic beverage information, product listings, and licensed retailer catalogues.
          </p>

          <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-900 border border-amber-200/80 text-left">
            <p className="font-semibold mb-1">⚖️ Demonstration Notice:</p>
            This portal is a technology prototype for product discovery. Online checkout and doorstep alcohol delivery are strictly disabled in compliance with state regulations.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={confirmAge}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-700/20 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              I am 21 or Older
            </button>
            <a
              href="https://google.com"
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center gap-2 transition"
            >
              <XCircle className="w-4 h-4" />
              I am Under 21
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

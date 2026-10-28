import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function StatutoryBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();

  if (dismissed) return null;

  return (
    <div className="bg-amber-950 dark:bg-stone-950 text-amber-100 text-xs py-1.5 sm:py-2 px-3 sm:px-4 border-b border-amber-900/60 dark:border-amber-900/40 transition-colors duration-200 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden min-w-0">
          <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
            {t('banner.demoOnly')}
          </span>
          <p className="truncate text-[11px] sm:text-xs">
            <span className="font-semibold text-amber-200 dark:text-amber-300">{t('banner.exciseCompliance')}</span>{' '}
            <span className="hidden sm:inline">{t('banner.exciseText')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/compliance-info"
            className="text-amber-300 dark:text-amber-400 hover:text-white underline underline-offset-2 font-medium text-[11px] sm:text-xs whitespace-nowrap"
          >
            {t('banner.legalNotice')}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-white p-0.5"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function StatutoryBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();

  if (dismissed) return null;

  return (
    <div className="bg-amber-950 dark:bg-stone-950 text-amber-100 text-xs py-2 px-4 border-b border-amber-900/60 dark:border-amber-900/40 transition-colors duration-200 w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
            {t('banner.demoOnly')}
          </span>
          <p className="truncate">
            <span className="font-semibold text-amber-200 dark:text-amber-300">{t('banner.exciseCompliance')}</span>{' '}
            {t('banner.exciseText')}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/compliance-info"
            className="text-amber-300 dark:text-amber-400 hover:text-white underline underline-offset-2 font-medium"
          >
            {t('banner.legalNotice')}
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

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlcoRezIcon } from './AlcoRezLogo';

export default function LegalAgeModal() {
  const { ageVerified, confirmAge } = useAuth();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!ageVerified) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [ageVerified]);

  if (ageVerified) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-amber-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200 transition-colors my-auto overscroll-contain">
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 dark:from-amber-900 dark:via-stone-900 dark:to-stone-950 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <AlcoRezIcon className="h-14 w-auto rounded-xl shadow-lg" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">{t('age.title')}</h2>
          <p className="text-xs text-amber-200 mt-1 uppercase tracking-wider font-semibold">
            {t('age.department')}
          </p>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
            {t('age.legalNotice')}
          </p>

          <div className="bg-amber-50 dark:bg-amber-950/50 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 text-left">
            <p className="font-semibold mb-1">{t('age.demoNoticeTitle')}</p>
            {t('age.demoNoticeText')}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={confirmAge}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-700/20 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('age.confirmAge')}
            </button>
            <a
              href="https://google.com"
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center gap-2 transition"
            >
              <XCircle className="w-4 h-4" />
              {t('age.underAge')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AlcoRezIcon } from '../layout/AlcoRezLogo';

export default function LegalAgeModal() {
  const { ageVerified, confirmAge } = useAuth();
  const { t, language } = useLanguage();
  const [declined, setDeclined] = React.useState(false);
  const dialogRef = React.useRef(null);

  React.useEffect(() => {
    if (!ageVerified) {
      const prevOverflow = document.body.style.overflow;
      const previousFocus = document.activeElement;
      document.body.style.overflow = 'hidden';
      const firstButton = dialogRef.current?.querySelector('button');
      firstButton?.focus();
      const trapFocus = (event) => {
        if (event.key !== 'Tab') return;
        const controls = [...(dialogRef.current?.querySelectorAll('button, a[href]') || [])];
        if (controls.length === 0) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', trapFocus);
      return () => {
        document.body.style.overflow = prevOverflow;
        document.removeEventListener('keydown', trapFocus);
        previousFocus?.focus?.();
      };
    }
  }, [ageVerified]);

  React.useEffect(() => {
    if (declined) dialogRef.current?.focus();
  }, [declined]);

  if (ageVerified) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="age-gate-title" className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl shadow-2xl overflow-hidden border border-amber-200 dark:border-stone-800 animate-in fade-in zoom-in-95 duration-200 transition-colors my-auto overscroll-contain">
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 dark:from-amber-900 dark:via-stone-900 dark:to-stone-950 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <AlcoRezIcon className="h-14 w-auto rounded-xl shadow-lg" />
          </div>
          <h2 id="age-gate-title" className="text-xl font-bold tracking-tight">{t('age.title')}</h2>
          <p className="text-xs text-amber-200 mt-1 uppercase tracking-wider font-semibold">
            {t('age.department')}
          </p>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
            {declined
              ? (language === 'te' ? 'ఈ మార్కెట్‌ప్లేస్ 21 సంవత్సరాలు లేదా అంతకంటే ఎక్కువ వయస్సు ఉన్నవారికి మాత్రమే అందుబాటులో ఉంటుంది.' : 'This marketplace is available only to adults aged 21 or older. You cannot continue browsing.')
              : t('age.legalNotice')}
          </p>

          {!declined && <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={confirmAge}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-700/20 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('age.confirmAge')}
            </button>
            <button
              type="button"
              onClick={() => setDeclined(true)}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center justify-center gap-2 transition"
            >
              <XCircle className="w-4 h-4" />
              {t('age.underAge')}
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
}

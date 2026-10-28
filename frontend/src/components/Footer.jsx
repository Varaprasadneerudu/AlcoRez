import React from 'react';
import { ShieldCheck, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AlcoRezIcon } from './AlcoRezLogo';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 dark:bg-stone-950 text-stone-300 dark:text-stone-400 pt-10 sm:pt-12 pb-8 border-t border-stone-800 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* Statutory Health & Legal Warning Callout */}
        <div className="bg-stone-950/80 dark:bg-stone-900/60 border border-amber-900/40 rounded-2xl p-5 text-center space-y-2">
          <p className="font-extrabold tracking-wider text-amber-400 uppercase text-sm sm:text-base">
            {t('footer.statutoryWarning')}
          </p>
          <p className="text-stone-400 max-w-4xl mx-auto leading-relaxed text-[11px]">
            {t('footer.statutoryDetails')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
          {/* Col 1: Platform */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <AlcoRezIcon className="h-8 w-auto rounded shadow-sm" />
              <div className="flex flex-col">
                <div className="flex items-center text-lg tracking-tight leading-none">
                  <span className="text-amber-400 font-black">Alco</span>
                  <span className="text-white font-extrabold">Rez</span>
                </div>
                <span className="text-[10px] text-stone-400 font-medium tracking-wide mt-0.5">
                  Reserve. Verify. Collect.
                </span>
              </div>
            </div>
            <p className="text-stone-400 leading-relaxed text-xs">
              {t('footer.platformDesc')}
            </p>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t('footer.failClosed')}
            </div>
          </div>

          {/* Col 2: Permitted Zones */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">{t('footer.zonesTitle')}</h3>
            <ul className="space-y-1.5 text-stone-400">
              <li>• Madhapur & HITEC City (500081)</li>
              <li>• Jubilee Hills & Road 36 (500033)</li>
              <li>• Banjara Hills (500034)</li>
              <li>• Gachibowli Circle (500032)</li>
              <li>• Kondapur & Hafeezpet (500084)</li>
            </ul>
          </div>

          {/* Col 3: Excise & Compliance Links */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">{t('footer.governanceTitle')}</h3>
            <ul className="space-y-1.5 text-stone-400">
              <li><Link to="/compliance-info" className="hover:text-amber-300">Telangana Excise Act, 1968</Link></li>
              <li><Link to="/compliance-info" className="hover:text-amber-300">A4 Retail Shop Licensing Rules</Link></li>
              <li><Link to="/compliance-info" className="hover:text-amber-300">Dry Days & Holiday Schedule</Link></li>
              <li><Link to="/retailer/apply" className="hover:text-amber-300">Retailer License Onboarding</Link></li>
              <li><Link to="/admin" className="hover:text-amber-300">State Excise Oversight Portal</Link></li>
            </ul>
          </div>

          {/* Col 4: State Helpline */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">{t('footer.deptTitle')}</h3>
            <p className="text-stone-400 text-xs whitespace-pre-line">
              {t('footer.govtOfTelangana')}
            </p>
            <div className="flex items-center gap-2 text-stone-300">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('footer.tollFree')}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
          <p>© {new Date().getFullYear()} {t('footer.copyright')}</p>
          <p>{t('footer.techStack')}</p>
        </div>
      </div>
    </footer>
  );
}

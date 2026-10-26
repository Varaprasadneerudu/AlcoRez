import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, MapPin, FileCheck, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RetailerCard({ retailer }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {t('roles.retailer') ? (t('roles.retailer') === 'రిటైలర్' ? 'ధృవీకరించబడిన A4 లైసెన్స్' : 'Verified A4 License') : 'Verified A4 License'}
          </span>
        </div>

        <div className="mt-3">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-snug">
            {retailer.shop_name}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
            {retailer.trade_name || t('retailer.defaultTradeName')}
          </p>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{retailer.address_line}, {retailer.city} - {retailer.postal_code}</span>
          </div>

          {retailer.license && (
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 pt-1">
              <FileCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <span className="font-mono text-[11px] text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                {retailer.license.license_number}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Exp: {retailer.license.expiry_date}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-stone-800">
        <Link
          to={`/products?retailer_id=${retailer.id}`}
          className="w-full py-2.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-stone-800 dark:text-stone-200 hover:text-amber-900 dark:hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 transition"
        >
          <span>{t('retailer.viewStore')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

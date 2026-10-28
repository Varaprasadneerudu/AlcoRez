import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, MapPin, FileCheck, ArrowRight, Heart, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../context/FavoritesContext';

function formatAvailability(isoString) {
  if (!isoString) return 'Stock updated today';
  const d = new Date(isoString);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);
  if (diffHours < 1) {
    const mins = Math.max(1, Math.floor((now - d) / (1000 * 60)));
    return `Updated ${mins}m ago`;
  }
  if (diffHours < 24) {
    return `Updated today at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Updated ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

export default function RetailerCard({ retailer }) {
  const { t } = useLanguage();
  const { isRetailerFavorite, toggleRetailerFavorite } = useFavorites();
  const isFav = isRetailerFavorite(retailer.id);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/60 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 relative group">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
            <Store className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verified A4 License</span>
            </span>

            <button
              onClick={(e) => {
                e.preventDefault();
                toggleRetailerFavorite(retailer);
              }}
              title={isFav ? 'Remove from favorites' : 'Save retailer'}
              aria-label={isFav ? 'Remove from favorites' : 'Save retailer'}
              className={`p-1.5 rounded-full border transition ${
                isFav
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 hover:bg-stone-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <Link to={`/retailers/${retailer.id}`} className="hover:text-amber-800 dark:hover:text-amber-400 transition-colors">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-snug">
              {retailer.shop_name}
            </h3>
          </Link>
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

          {/* Availability last updated info */}
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 pt-0.5">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{formatAvailability(retailer.last_inventory_update)}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-2">
        <Link
          to={`/retailers/${retailer.id}`}
          className="py-2 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1 border border-amber-200 dark:border-amber-800 transition"
        >
          <span>Store Info</span>
        </Link>
        <Link
          to={`/products?retailer_id=${retailer.id}`}
          className="py-2 px-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-1 border border-stone-200 dark:border-stone-700 transition"
        >
          <span>View Stock</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

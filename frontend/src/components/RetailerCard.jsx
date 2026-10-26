import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, MapPin, FileCheck, ArrowRight } from 'lucide-react';

export default function RetailerCard({ retailer }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified A4 License
          </span>
        </div>

        <div className="mt-3">
          <h3 className="font-bold text-stone-900 text-base leading-snug">
            {retailer.shop_name}
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {retailer.trade_name || 'Licensed Retail Wine Merchant'}
          </p>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-stone-600">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{retailer.address_line}, {retailer.city} - {retailer.postal_code}</span>
          </div>

          {retailer.license && (
            <div className="flex items-center gap-2 text-stone-500 pt-1">
              <FileCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="font-mono text-[11px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                {retailer.license.license_number}
              </span>
              <span className="text-[10px] text-stone-400">Exp: {retailer.license.expiry_date}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-stone-100">
        <Link
          to={`/products?retailer_id=${retailer.id}`}
          className="w-full py-2.5 px-3 rounded-xl bg-stone-50 hover:bg-amber-50 text-stone-800 hover:text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 border border-stone-200 transition"
        >
          <span>View Verified Catalogue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

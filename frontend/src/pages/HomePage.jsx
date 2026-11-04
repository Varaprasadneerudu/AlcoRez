import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import RetailerCard from '../components/RetailerCard';
import { useLanguage } from '../context/LanguageContext';
import { useLocation as useGeoLocation } from '../context/LocationContext';
import { optimizeImageUrl } from '../utils/imageUtils';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterByZone, setFilterByZone] = useState(false);
  const { t, tc, language } = useLanguage();
  const { selectedZone, postalCode } = useGeoLocation();
  const isFirstMount = useRef(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (isFirstMount.current) {
          setLoading(true);
        }
        const retailerParams = filterByZone ? { postal_code: postalCode } : {};
        const [cats, prods, rets] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 8, postal_code: filterByZone ? postalCode : undefined }),
          api.getRetailers(retailerParams),
        ]);
        setCategories(cats || []);
        setFeaturedProducts(prods?.items || []);
        const approvedStores = (rets || []).filter((r) => r.status === 'approved');
        const uniqueStores = Array.from(new Map(approvedStores.map((item) => [item.shop_name, item])).values());
        setRetailers(uniqueStores);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        isFirstMount.current = false;
        setLoading(false);
      }
    }
    loadData();
  }, [filterByZone, postalCode]);

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 transition-colors duration-200 w-full overflow-hidden">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#12141c] via-[#1a0f0a] to-[#2b0c03] dark:from-[#0a0c12] dark:via-[#140b07] dark:to-[#1f0902] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 lg:p-14 border border-[#FF4500]/30 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#FF4500]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#FFE500]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl space-y-4 sm:space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE500]/15 border border-[#FFE500]/40 text-[#FFE500] text-xs font-black tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {t('home.heroBadge')}
            </div>

            <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {language === 'en' ? (
                <>
                  Discover Premium Spirits & Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4500] via-[#FFE500] to-[#FF6600]">Wine Retailers</span> in Telangana
                </>
              ) : (
                <>
                  తెలంగాణలో ప్రీమియం లిక్కర్ మరియు అధీకృత <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4500] via-[#FFE500] to-[#FF6600]">వైన్ షాపులను</span> అన్వేషించండి
                </>
              )}
            </h1>

            <p className="text-stone-300 dark:text-stone-300 text-xs sm:text-base leading-relaxed max-w-2xl">
              {t('home.heroDesc')}
            </p>

            {/* Demonstration Notice Box */}
            <div className="bg-white/10 dark:bg-stone-900/60 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-[#FF4500]/30 text-xs text-stone-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FFE500] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">{t('home.disclosureTitle')}</strong>
                {t('home.disclosureText')}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                to="/products"
                className="py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#FF4500] via-[#FF5A1F] to-[#FF7700] hover:from-[#DE3500] hover:to-[#FF4500] text-white shadow-lg shadow-orange-600/30 flex items-center gap-2 transition active:scale-95"
              >
                <span>{t('home.exploreBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/compliance-info"
                className="py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition flex items-center gap-2"
              >
                <span>{t('home.guidelinesBtn')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation Horizontal Scroll / Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('home.browseCategory')}</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('home.categorySubtitle')}</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1">
            {t('home.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-50 dark:bg-stone-800 overflow-hidden mb-2 group-hover:scale-105 transition">
                <img
                  src={optimizeImageUrl(cat.image_url, 120, 75)}
                  alt={tc(cat.name)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition line-clamp-1">
                {tc(cat.name).split(' & ')[0]}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{t('home.exploreChip')}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Licensed Retailers Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('home.retailersTitle')}</h2>
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {t('home.retailersBadge')}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('home.retailersSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterByZone(!filterByZone)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition flex items-center gap-1.5 ${
                filterByZone
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-400'
              }`}
            >
              <span>📍 {selectedZone?.locality || 'My Area'} ({postalCode})</span>
              <span className="text-[10px] opacity-80">{filterByZone ? '✓ Active' : '+ Filter'}</span>
            </button>
            <Link to="/products" className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1">
              {t('home.allRetailers')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {retailers.map((ret) => (
            <RetailerCard key={ret.id} retailer={ret} />
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-end sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('home.featuredTitle')}</h2>
              <span className="hidden sm:inline-flex bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                {t('home.featuredBadge')}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('home.featuredSubtitle')}</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
            {t('home.seeMore')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Compliance Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="text-amber-800 dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest">
              {t('home.frameworkTag')}
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
              {t('home.frameworkTitle')}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {t('home.frameworkDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-800 dark:text-stone-200">
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                21+
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{t('home.pillar1Title')}</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {t('home.pillar1Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                A4
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{t('home.pillar2Title')}</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {t('home.pillar2Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold">
                0₹
              </div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{t('home.pillar3Title')}</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {t('home.pillar3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
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

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, tc, language } = useLanguage();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, prods, rets] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 8 }),
          api.getRetailers(),
        ]);
        setCategories(cats || []);
        setFeaturedProducts(prods?.items || []);
        setRetailers(rets || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-16 transition-colors duration-200">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 p-6 sm:p-10 lg:p-14 border border-amber-900/40 dark:border-stone-800 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {t('home.heroBadge')}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {language === 'en' ? (
              <>
                Discover Premium Spirits & Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Wine Retailers</span> in Telangana
              </>
            ) : (
              <>
                తెలంగాణలో ప్రీమియం లిక్కర్ మరియు అధీకృత <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">వైన్ షాపులను</span> అన్వేషించండి
              </>
            )}
          </h1>

          <p className="text-stone-300 dark:text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {t('home.heroDesc')}
          </p>

          {/* Demonstration Notice Box */}
          <div className="bg-white/10 dark:bg-stone-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/15 dark:border-stone-700/50 text-xs text-amber-100 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">{t('home.disclosureTitle')}</strong>
              {t('home.disclosureText')}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <span>{t('home.exploreBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/compliance-info"
              className="py-3 px-6 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2"
            >
              <span>{t('home.guidelinesBtn')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Navigation Horizontal Scroll / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('home.browseCategory')}</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('home.categorySubtitle')}</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1">
            {t('home.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-stone-800 overflow-hidden mb-2 group-hover:scale-105 transition">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=300&q=80'}
                  alt={tc(cat.name)}
                  className="w-full h-full object-cover"
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('home.retailersTitle')}</h2>
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {t('home.retailersBadge')}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('home.retailersSubtitle')}</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1">
            {t('home.allRetailers')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {retailers.map((ret) => (
            <RetailerCard key={ret.id} retailer={ret} />
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('home.featuredTitle')}</h2>
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                {t('home.featuredBadge')}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('home.featuredSubtitle')}</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1">
            {t('home.seeMore')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Compliance Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
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

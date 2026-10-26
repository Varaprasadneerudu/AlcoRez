import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, tc, tr, ts, language } = useLanguage();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states from URL or defaults
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedRetailer = searchParams.get('retailer_id') || '';
  const selectedBottleSize = searchParams.get('bottle_size') || '';
  const sortBy = searchParams.get('sort_by') || 'name_asc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getRetailers()]).then(([cats, rets]) => {
      setCategories(cats || []);
      const approvedStores = (rets || []).filter((r) => r.status === 'approved');
      const uniqueStores = Array.from(new Map(approvedStores.map((item) => [item.shop_name, item])).values());
      setRetailers(uniqueStores);
    });
  }, []);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        const res = await api.getProducts({
          search,
          category: selectedCategory,
          retailer_id: selectedRetailer,
          bottle_size: selectedBottleSize,
          sort_by: sortBy,
          page,
          limit: 20
        });
        setProducts(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error('Catalog fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [search, selectedCategory, selectedRetailer, selectedBottleSize, sortBy, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page'); // Reset to page 1
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedRetailer || selectedBottleSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors duration-200">
      
      {/* Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'హోమ్‌పేజీకి తిరిగి వెళ్ళండి' : 'Back to Home'}</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {t('catalog.title')}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
            {t('catalog.subtitle')} • {total} {t('catalog.showingResults')}
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('catalog.filters')} {hasActiveFilters && '•'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium hidden sm:inline">{t('catalog.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sort_by', e.target.value)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="name_asc">{t('catalog.nameAsc')}</option>
              <option value="name_desc">{t('catalog.nameDesc')}</option>
              <option value="price_asc">{t('catalog.priceAsc')}</option>
              <option value="price_desc">{t('catalog.priceDesc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6`}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-6 shadow-sm">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                {t('catalog.filters')}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline"
                >
                  {t('catalog.clearAll')}
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{t('catalog.category')}</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    !selectedCategory
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {t('catalog.allCategories')}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateParam('category', c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === c.slug
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span>{tc(c.name)}</span>
                    {selectedCategory === c.slug && <span className="text-amber-700 dark:text-amber-400 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Retailer Filter */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{t('catalog.retailerFilter')}</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('retailer_id', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    !selectedRetailer
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {t('catalog.allRetailers')}
                </button>
                {retailers.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => updateParam('retailer_id', r.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedRetailer === r.id
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{tr(r.shop_name)}</span>
                    {selectedRetailer === r.id && <span className="text-amber-700 dark:text-amber-400 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottle Size Filter */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{t('catalog.bottleSize')}</h4>
              <div className="flex flex-wrap gap-1.5">
                {['750ml', '375ml', '180ml', '650ml', '330ml'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateParam('bottle_size', selectedBottleSize === sz ? '' : sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      selectedBottleSize === sz
                        ? 'bg-amber-700 dark:bg-amber-600 text-white border-amber-700 dark:border-amber-600'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750'
                    }`}
                  >
                    {ts(sz)}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300">
              <p className="font-bold mb-0.5">{t('catalog.disclaimerTitle')}</p>
              {t('catalog.disclaimerDesc')}
            </div>

          </div>
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl h-80 border border-stone-200 dark:border-stone-800 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{t('catalog.noProducts')}</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                We couldn't find any products matching your current search or filter combinations.
              </p>
              <button
                onClick={clearAllFilters}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow"
              >
                {t('catalog.clearAll')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

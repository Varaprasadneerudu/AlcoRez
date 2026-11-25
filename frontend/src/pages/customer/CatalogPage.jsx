import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, ArrowLeft, X } from 'lucide-react';
import { api } from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation as useGeoLocation } from '../../context/LocationContext';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, tc, tr, ts, language } = useLanguage();
  const { allZones } = useGeoLocation();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterError, setFilterError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Filter states from URL or defaults
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const selectedRetailer = searchParams.get('retailer_id') || '';
  const selectedBottleSize = searchParams.get('bottle_size') || '';
  const selectedPostalCode = searchParams.get('postal_code') || '';
  const sortBy = searchParams.get('sort_by') || 'name_asc';
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setFilterError(null);
    Promise.all([api.getCategories(), api.getRetailers(), api.getBrands()]).then(([cats, rets, brs]) => {
      if (!active) return;
      setCategories(cats || []);
      const approvedStores = (rets || []).filter((r) => r.status === 'approved');
      const uniqueStores = Array.from(new Map(approvedStores.map((item) => [item.shop_name, item])).values());
      setRetailers(uniqueStores);
      setBrands(brs || []);
    }).catch((err) => { if (active) setFilterError(err.message || 'Could not load filters.'); });
    return () => { active = false; };
  }, [retryKey]);

  useEffect(() => {
    let active = true;
    async function fetchCatalog() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getProducts({
          search,
          category: selectedCategory,
          brand: selectedBrand,
          retailer_id: selectedRetailer,
          bottle_size: selectedBottleSize,
          postal_code: selectedPostalCode || undefined,
          sort_by: sortBy,
          page,
          limit: 20
        });
        if (!active) return;
        setProducts(res.items || []);
        setTotal(res.total || 0);
      } catch (err) {
        if (active) setError(err.message || 'Could not load products.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchCatalog();
    return () => { active = false; };
  }, [search, selectedCategory, selectedBrand, selectedRetailer, selectedBottleSize, selectedPostalCode, sortBy, page, retryKey]);

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

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedBrand || selectedRetailer || selectedBottleSize || selectedPostalCode);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 transition-colors duration-200">
      
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {t('catalog.title')}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
            {t('catalog.subtitle')} • {total} {t('catalog.showingResults')}
          </p>
        </div>

        {/* Dropdowns: Categories, Brands, and Sort */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t('catalog.filters')} {hasActiveFilters && '•'}
          </button>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCategory}
              aria-label="Filter by category"
              onChange={(e) => updateParam('category', e.target.value)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[130px] sm:max-w-xs truncate"
              title="Filter by Category"
            >
              <option value="">{language === 'te' ? 'అన్ని వర్గాలు (All Categories)' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {tc(c.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedBrand}
              aria-label="Filter by brand"
              onChange={(e) => updateParam('brand', e.target.value)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[120px] sm:max-w-xs truncate"
              title="Filter by Brand"
            >
              <option value="">{language === 'te' ? 'అన్ని బ్రాండ్లు (All Brands)' : 'All Brands'}</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              aria-label="Sort products"
              onChange={(e) => updateParam('sort_by', e.target.value)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[120px] sm:max-w-xs truncate"
              title="Sort products"
            >
              <option value="name_asc">{t('catalog.nameAsc')}</option>
              <option value="name_desc">{t('catalog.nameDesc')}</option>
              <option value="price_asc">{t('catalog.priceAsc')}</option>
              <option value="price_desc">{t('catalog.priceDesc')}</option>
            </select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {[
            ['search', search, `Search: ${search}`],
            ['category', selectedCategory, `Category: ${selectedCategory}`],
            ['brand', selectedBrand, `Brand: ${selectedBrand}`],
            ['retailer_id', selectedRetailer, `Retailer: ${retailers.find((r) => r.id === selectedRetailer)?.shop_name || selectedRetailer}`],
            ['bottle_size', selectedBottleSize, `Size: ${selectedBottleSize}`],
            ['postal_code', selectedPostalCode, `Area: ${selectedPostalCode}`],
          ].filter(([, value]) => value).map(([key, , label]) => (
            <button key={key} type="button" onClick={() => updateParam(key, '')} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              {label} <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {/* Main Layout: Filters Sidebar + Products Grid */}
      {filterError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900 dark:bg-rose-950/30">Filters could not load: {filterError} <button type="button" onClick={() => setRetryKey((key) => key + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6`}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-6 shadow-sm">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                {t('catalog.filters')}
              </span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline"
                  >
                    {t('catalog.clearAll')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="md:hidden p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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

            {/* Brand Filter */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  {language === 'te' ? 'బ్రాండ్లు (Brands)' : 'Brands'}
                </h4>
                {selectedBrand && (
                  <button
                    onClick={() => updateParam('brand', '')}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <select
                  value={selectedBrand}
                  onChange={(e) => updateParam('brand', e.target.value)}
                  className="w-full py-2 px-2.5 rounded-lg text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">{language === 'te' ? 'అన్ని బ్రాండ్లు (All Brands)' : 'All Brands'}</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                  {brands.map((b) => (
                    <button
                      key={b}
                      onClick={() => updateParam('brand', selectedBrand === b ? '' : b)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition ${
                        selectedBrand === b
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-700 font-bold'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Locality / Hyderabad Area Filter */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  {language === 'te' ? 'ప్రాంతం (Locality)' : 'Locality & Area'}
                </h4>
                {selectedPostalCode && (
                  <button
                    onClick={() => updateParam('postal_code', '')}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('postal_code', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    !selectedPostalCode
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {language === 'te' ? 'అన్ని హైదరాబాద్ ప్రాంతాలు' : 'All Hyderabad Areas'}
                </button>
                {allZones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => updateParam('postal_code', z.postal_code)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedPostalCode === z.postal_code
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span className="truncate pr-1">{language === 'te' ? z.te : z.locality}</span>
                    {selectedPostalCode === z.postal_code && <span className="text-amber-700 dark:text-amber-400 font-bold">✓</span>}
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
        <main className="md:col-span-3 space-y-6 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl h-80 border border-stone-200 dark:border-stone-800 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900 dark:bg-stone-900">
              <h3 className="text-lg font-bold">Could not load the catalog</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{error}</p>
              <button onClick={() => setRetryKey((key) => key + 1)} className="mt-4 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white">Retry</button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 text-center space-y-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          {!loading && !error && total > 20 && (
            <nav className="flex items-center justify-center gap-4" aria-label="Catalog pages">
              <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-stone-700">Previous</button>
              <span className="text-sm text-stone-600 dark:text-stone-300">Page {page} of {Math.ceil(total / 20)}</span>
              <button type="button" disabled={page >= Math.ceil(total / 20)} onClick={() => goToPage(page + 1)} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-stone-700">Next</button>
            </nav>
          )}
        </main>

      </div>
    </div>
  );
}

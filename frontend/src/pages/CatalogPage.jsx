import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, X, Search } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

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
    // Load categories & retailers once
    Promise.all([api.getCategories(), api.getRetailers()]).then(([cats, rets]) => {
      setCategories(cats || []);
      setRetailers(rets || []);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Alcoholic Beverage Catalogue
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Showing verified products from approved Telangana retail wine shops • {total} items found
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && '•'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sort_by', e.target.value)}
              className="py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6`}>
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-6 shadow-sm">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-700" />
                Filter Selections
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Category</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    !selectedCategory ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateParam('category', c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === c.slug ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selectedCategory === c.slug && <span className="text-amber-700 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Retailer Filter */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Licensed Retailer</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('retailer_id', '')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    !selectedRetailer ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  All Approved Shops
                </button>
                {retailers.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => updateParam('retailer_id', r.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedRetailer === r.id ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{r.shop_name}</span>
                    {selectedRetailer === r.id && <span className="text-amber-700 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottle Size Filter */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Bottle Size</h4>
              <div className="flex flex-wrap gap-1.5">
                {['750ml', '375ml', '180ml', '650ml', '330ml'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateParam('bottle_size', selectedBottleSize === sz ? '' : sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      selectedBottleSize === sz
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900">
              <p className="font-bold mb-0.5">Excise Disclaimer:</p>
              Only active products belonging to approved wine retailers are displayed.
            </div>

          </div>
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-80 border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">No products found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                We couldn't find any products matching your current search or filter combinations.
              </p>
              <button
                onClick={clearAllFilters}
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow"
              >
                Reset All Filters
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

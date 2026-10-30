import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  MapPin,
  FileCheck,
  Phone,
  Clock,
  ArrowLeft,
  Heart,
  Search,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';

function formatAvailabilityTime(isoString) {
  if (!isoString) return 'Real-time verified';
  const d = new Date(isoString);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor((now - d) / (1000 * 60)));
    return `Updated ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  }
  if (diffHours < 24) {
    return `Updated today at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Updated on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function RetailerDetailPage() {
  const { id } = useParams();
  const { isRetailerFavorite, toggleRetailerFavorite } = useFavorites();

  const [retailer, setRetailer] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prevIdRef = useRef(null);

  useEffect(() => {
    async function fetchRetailerData() {
      try {
        if (prevIdRef.current !== id) {
          setLoading(true);
        }
        setError(null);

        const [catData, categoriesList] = await Promise.all([
          api.getRetailerCatalogue(id, {
            search: searchTerm,
            category: selectedCategory,
            limit: 60
          }),
          api.getCategories()
        ]);

        setRetailer(catData.retailer);
        setCatalogue(catData.items || []);
        setCategories(categoriesList || []);
      } catch (err) {
        console.error('Failed to load store catalogue:', err);
        setError('Licensed retailer store not found or currently suspended under excise regulation.');
      } finally {
        prevIdRef.current = id;
        setLoading(false);
      }
    }
    fetchRetailerData();
  }, [id, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-24" />
        <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !retailer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Store Not Available</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">{error || 'Retailer not found.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  const isFav = isRetailerFavorite(retailer.id);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discovery</span>
        </Link>
      </div>

      {/* Store Header Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0 shadow-xs">
              <Store className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                  {retailer.shop_name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified A4 Retailer</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">
                {retailer.trade_name || 'Telangana Licensed Wine & Spirits Store'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{retailer.address_line}, {retailer.city} - {retailer.postal_code}</span>
                </div>
                {retailer.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{retailer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Favorite button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleRetailerFavorite(retailer)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                isFav
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isFav ? 'Favorite Store' : 'Save Store'}</span>
            </button>
          </div>
        </div>

        {/* Licence & Last Availability Ribbon */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          {retailer.license && (
            <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/60 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                Lic: {retailer.license.license_number}
              </span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-500 dark:text-stone-400">
                Expires: {retailer.license.expiry_date}
              </span>
            </div>
          )}

          {/* Exact when availability was last updated */}
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-[11px]">
              {formatAvailabilityTime(retailer.last_inventory_update)}
            </span>
          </div>
        </div>
      </div>

      {/* Retailer Catalogue Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              Store Spirits Catalogue
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Browse current stock and prices verified at this specific shop location.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search store inventory..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none w-48 focus:w-60 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {catalogue.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-3">
            <Store className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">No spirits match this filter</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {catalogue.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

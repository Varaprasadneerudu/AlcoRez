import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Wine, Store, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import RetailerCard from '../components/RetailerCard';

export default function FavoritesPage() {
  const { isAuthenticated, role } = useAuth();
  const { favoriteProductIds, favoriteRetailerIds } = useFavorites();
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'retailers'
  const [favorites, setFavorites] = useState({ products: [], retailers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getFavorites();
      setFavorites({
        products: res?.products || [],
        retailers: res?.retailers || []
      });
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError('Failed to load saved favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'customer') {
      loadFavorites();
    }
  }, [isAuthenticated, role, favoriteProductIds.size, favoriteRetailerIds.size]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          Save Your Favorite Spirits & Retailers
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
          Please log in to your customer account to save and access your personal favorites anytime.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
        >
          <span>Sign In to Customer Account</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const productsCount = favorites.products.length;
  const retailersCount = favorites.retailers.length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Customer Favorites
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {productsCount + retailersCount} Saved
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
            Quickly re-order your preferred spirits and view stock from your favorite verified wine retailers.
          </p>
        </div>

        <button
          onClick={loadFavorites}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'products'
              ? 'border-amber-600 text-amber-800 dark:text-amber-400'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Wine className="w-4 h-4" />
          <span>Favorite Spirits ({productsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('retailers')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'retailers'
              ? 'border-amber-600 text-amber-800 dark:text-amber-400'
              : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Favorite Stores ({retailersCount})</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 h-72 animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'products' ? (
        /* Products Content */
        productsCount === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-400">
              <Wine className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                No Favorite Spirits Yet
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Click the heart icon on any product in our Telangana catalog to save your go-to spirits, malts, and wines for quick reservation.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
            >
              <span>Explore Spirits Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {favorites.products.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )
      ) : (
        /* Retailers Content */
        retailersCount === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-400">
              <Store className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                No Favorite Stores Saved
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                Save verified A4 retail wine stores in your Hyderabad locality to quickly check their current stocks and latest price lists.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
            >
              <span>Discover Verified Retailers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
            {favorites.retailers.map((item) => (
              <RetailerCard key={item.id} retailer={item.retailer} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

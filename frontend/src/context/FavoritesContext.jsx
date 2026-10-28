import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [favoriteProductIds, setFavoriteProductIds] = useState(new Set());
  const [favoriteRetailerIds, setFavoriteRetailerIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadFavoriteIds = useCallback(async () => {
    if (!isAuthenticated || role !== 'customer') {
      setFavoriteProductIds(new Set());
      setFavoriteRetailerIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const res = await api.getFavoriteIds();
      setFavoriteProductIds(new Set(res?.product_ids || []));
      setFavoriteRetailerIds(new Set(res?.retailer_ids || []));
    } catch (err) {
      console.warn('Failed to fetch favorite IDs:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    loadFavoriteIds();
  }, [loadFavoriteIds]);

  const isProductFavorite = useCallback((productId) => {
    return favoriteProductIds.has(productId);
  }, [favoriteProductIds]);

  const isRetailerFavorite = useCallback((retailerId) => {
    return favoriteRetailerIds.has(retailerId);
  }, [favoriteRetailerIds]);

  const toggleProductFavorite = async (product) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save your favorite spirits.');
      return false;
    }
    if (role !== 'customer') {
      showToast('Favorites are available for customer accounts.');
      return false;
    }

    const isFav = favoriteProductIds.has(product.id);
    const nextSet = new Set(favoriteProductIds);

    if (isFav) {
      nextSet.delete(product.id);
      setFavoriteProductIds(nextSet);
      try {
        await api.removeFavoriteProduct(product.id);
        showToast(`Removed "${product.name}" from favorites`);
      } catch (err) {
        nextSet.add(product.id);
        setFavoriteProductIds(nextSet);
        showToast('Failed to update favorites. Please try again.');
      }
    } else {
      nextSet.add(product.id);
      setFavoriteProductIds(nextSet);
      try {
        await api.addFavoriteProduct(product.id);
        showToast(`Saved "${product.name}" to your favorites`);
      } catch (err) {
        nextSet.delete(product.id);
        setFavoriteProductIds(nextSet);
        showToast('Failed to update favorites. Please try again.');
      }
    }
    return !isFav;
  };

  const toggleRetailerFavorite = async (retailer) => {
    if (!isAuthenticated) {
      showToast('Please sign in to save licensed wine stores.');
      return false;
    }
    if (role !== 'customer') {
      showToast('Favorites are available for customer accounts.');
      return false;
    }

    const isFav = favoriteRetailerIds.has(retailer.id);
    const nextSet = new Set(favoriteRetailerIds);

    if (isFav) {
      nextSet.delete(retailer.id);
      setFavoriteRetailerIds(nextSet);
      try {
        await api.removeFavoriteRetailer(retailer.id);
        showToast(`Removed "${retailer.shop_name}" from favorite stores`);
      } catch (err) {
        nextSet.add(retailer.id);
        setFavoriteRetailerIds(nextSet);
        showToast('Failed to update favorite stores. Please try again.');
      }
    } else {
      nextSet.add(retailer.id);
      setFavoriteRetailerIds(nextSet);
      try {
        await api.addFavoriteRetailer(retailer.id);
        showToast(`Saved "${retailer.shop_name}" to favorite stores`);
      } catch (err) {
        nextSet.delete(retailer.id);
        setFavoriteRetailerIds(nextSet);
        showToast('Failed to update favorite stores. Please try again.');
      }
    }
    return !isFav;
  };

  const totalFavoritesCount = favoriteProductIds.size + favoriteRetailerIds.size;

  return (
    <FavoritesContext.Provider value={{
      favoriteProductIds,
      favoriteRetailerIds,
      totalFavoritesCount,
      isProductFavorite,
      isRetailerFavorite,
      toggleProductFavorite,
      toggleRetailerFavorite,
      reloadFavorites: loadFavoriteIds,
      loading
    }}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900/95 dark:bg-stone-100/95 text-stone-100 dark:text-stone-900 text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-stone-700 dark:border-stone-300 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>❤️</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Plus, Minus, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { api } from '../services/api';
import { optimizeImageUrl, getImageSrcSet } from '../utils/imageUtils';

/**
 * ProductCard Component
 * 
 * Renders a high-conversion product card with:
 * - Dynamic bottle size switcher.
 * - Auto-resolving inventory stock & real-time pricing for the selected size.
 * - Direct Add-to-Cart with instant interactive stepper state upon addition.
 * - Maximum purchase limits based on available stock and statutory limits (max 10).
 * - Telangana licensed retailer stock radar badge.
 * - Customer favorites toggle.
 */
export default function ProductCard({ product }) {
  const { t, tp, tb, tc, ts, language } = useLanguage();
  const { cart, addToCart, updateQuantity, removeItem } = useCart();
  const { isAuthenticated, role } = useAuth();
  const { isProductFavorite, toggleProductFavorite } = useFavorites();
  const navigate = useNavigate();

  const isFav = isProductFavorite(product.id);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (product.available_sizes && product.available_sizes.length > 0) {
      return product.available_sizes[0];
    }
    return null;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // If inventories exist, resolve the inventory matching selectedSize
  const matchedInventory = product.inventories?.find(
    (inv) => (!selectedSize || inv.bottle_size === selectedSize) && inv.is_available && inv.stock_quantity > 0
  ) || product.inventories?.find((inv) => !selectedSize || inv.bottle_size === selectedSize);

  const displayPrice = matchedInventory?.price || product.starting_price;
  const maxStockLimit = Math.min(10, Math.max(1, matchedInventory?.stock_quantity ?? 10));

  // Check if this item is currently in the customer's cart
  const cartItem = cart?.items?.find(
    (it) => it.product_id === product.id && (!selectedSize || it.bottle_size === selectedSize)
  );

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.in_stock) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (role === 'admin' || role === 'retailer') {
      return;
    }

    if (role !== 'customer') {
      setErrorMessage(
        language === 'te'
          ? 'కార్ట్ కస్టమర్ ఖాతాలకు మాత్రమే అందుబాటులో ఉంది.'
          : 'Cart reservation is available for customer accounts only.'
      );
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    try {
      setErrorMessage(null);

      let targetInventoryId = null;

      // 1. Try finding inventory from product.inventories matching selected size
      if (product.inventories && product.inventories.length > 0) {
        if (selectedSize) {
          const matched = product.inventories.find(
            (inv) => inv.bottle_size === selectedSize && inv.is_available && inv.stock_quantity > 0
          ) || product.inventories.find((inv) => inv.bottle_size === selectedSize);
          if (matched) targetInventoryId = matched.id;
        }
        if (!targetInventoryId) {
          const inStock = product.inventories.find((inv) => inv.is_available && inv.stock_quantity > 0);
          targetInventoryId = inStock ? inStock.id : product.inventories[0].id;
        }
      } else if (product.default_inventory_id) {
        targetInventoryId = product.default_inventory_id;
      }

      if (!targetInventoryId) {
        // Fallback: fetch product details if catalog items didn't have inventories attached
        setIsAdding(true);
        const details = await api.getProduct(product.id);
        const inStock = details?.inventories?.find((inv) => inv.is_available && inv.stock_quantity > 0);
        targetInventoryId = inStock ? inStock.id : details?.inventories?.[0]?.id;
      }

      if (!targetInventoryId) {
        throw new Error('No available stock for this item.');
      }

      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 1500);

      await addToCart(targetInventoryId, 1, {
        product,
        matchedInventory,
        selectedSize: selectedSize || matchedInventory?.bottle_size,
        price: displayPrice
      });
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setIsAdded(false);
      setErrorMessage(err.message || 'Could not add to cart');
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStepQuantity = async (e, delta) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) return;

    const newQty = cartItem.quantity + delta;
    if (delta > 0 && newQty > maxStockLimit) {
      setErrorMessage(
        language === 'te'
          ? `గరిష్ట పరిమితి చేరింది (${maxStockLimit})`
          : `Max available limit reached (${maxStockLimit})`
      );
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      setErrorMessage(null);
      if (newQty <= 0) {
        await removeItem(cartItem.id);
      } else {
        await updateQuantity(cartItem.id, newQty);
      }
    } catch (err) {
      console.error('Update quantity failed:', err);
      setErrorMessage(err.message || 'Could not update quantity');
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  return (
    <div className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 hover:border-amber-400/80 dark:hover:border-amber-500/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image & Badges */}
      <Link to={`/products/${product.id}`} className="block relative aspect-square bg-stone-50 dark:bg-stone-800/50 overflow-hidden">
        <img
          src={optimizeImageUrl(product.primary_image_url, 360)}
          srcSet={getImageSrcSet(product.primary_image_url, [280, 360, 540])}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
          alt={tp(product.name)}
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = optimizeImageUrl(null, 360);
          }}
        />

        {/* ABV badge & Favorite Heart button */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {product.alcohol_by_volume && (
            <span className="bg-stone-900/80 dark:bg-stone-950/80 text-amber-300 font-semibold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
              {product.alcohol_by_volume}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleProductFavorite(product);
            }}
            title={isFav ? 'Remove from favorites' : 'Save to favorites'}
            aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
            className={`p-1.5 rounded-full backdrop-blur-md shadow-xs border transition ${
              isFav
                ? 'bg-rose-50/90 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                : 'bg-white/80 dark:bg-stone-900/80 border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Stock Badge */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center">
            <span className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-md">
              {t('product.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3 min-w-0">
        <div>
          <div className="flex items-center justify-between gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1 min-w-0">
            <span className="font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider text-[10px] truncate shrink min-w-0" title={tb(product.brand)}>
              {tb(product.brand)}
            </span>
            <span className="text-[10px] sm:text-[11px] bg-stone-100 dark:bg-stone-800 px-1.5 sm:px-2 py-0.5 rounded-full text-stone-600 dark:text-stone-300 truncate max-w-[58%] text-center shrink-0" title={tc(product.category_name || 'Spirits')}>
              {tc(product.category_name || 'Spirits')}
            </span>
          </div>

          <Link to={`/products/${product.id}`} className="block group-hover:text-amber-800 dark:group-hover:text-amber-400 transition">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]" title={tp(product.name)}>
              {tp(product.name)}
            </h3>
          </Link>

          {/* Direction 3 Retailer Availability Radar */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="truncate">
              {product.in_stock ? 'In Stock at Madhapur Retailers' : 'Currently Unavailable'}
            </span>
          </div>

          {/* Sizes chips */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.available_sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(sz);
                    }}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 border border-transparent'
                    }`}
                  >
                    {ts(sz)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <p className="text-[10px] text-red-600 dark:text-red-400 font-medium line-clamp-1">{errorMessage}</p>
        )}

        {/* Price & Action */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <span className="hidden sm:block text-[9px] sm:text-[10px] text-stone-400 dark:text-stone-500 truncate">
              {t('product.demoPriceLabel')}
            </span>
            <span className="font-extrabold text-stone-900 dark:text-stone-100 text-xs sm:text-base whitespace-nowrap block">
              {displayPrice ? `₹${Number(displayPrice).toLocaleString('en-IN')}` : t('product.priceOnRequest')}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Direct Add to Cart (Only for customers and prospective visitors) */}
            {role === 'admin' || role === 'retailer' ? (
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2 py-1 rounded-lg select-none">
                {role === 'admin' ? 'Inspection' : 'Retailer'}
              </span>
            ) : cartItem ? (
              <div className="flex items-center border border-amber-300 dark:border-amber-700/80 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 shadow-xs overflow-hidden h-8 sm:h-9">
                <button
                  type="button"
                  onClick={(e) => handleStepQuantity(e, -1)}
                  className="px-2 py-1 text-amber-900 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/80 transition cursor-pointer"
                  title="Decrease"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 text-xs font-black text-amber-950 dark:text-amber-100 min-w-[1.25rem] text-center">
                  {cartItem.quantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleStepQuantity(e, 1)}
                  disabled={cartItem.quantity >= maxStockLimit}
                  className="px-2 py-1 text-amber-900 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/80 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={cartItem.quantity >= maxStockLimit ? `Max limit (${maxStockLimit})` : "Increase"}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || !product.in_stock}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-bold transition-all duration-200 flex items-center justify-center shadow-sm active:scale-90 ${
                  isAdded
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-700/20 hover:shadow-amber-700/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={product.in_stock ? t('product.addToCartBtn') : t('product.outOfStock')}
                aria-label={product.in_stock ? t('product.addToCartBtn') : t('product.outOfStock')}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isAdded ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

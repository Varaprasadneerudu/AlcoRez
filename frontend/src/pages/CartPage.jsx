import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Store,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { optimizeImageUrl } from '../utils/imageUtils';

export default function CartPage() {
  const { cart, itemCount, subtotal, updateQuantity, removeItem, clearCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const { t, tp, tb, ts, tr, language } = useLanguage();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('cart.signInPrompt')}</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {t('cart.signInDesc')}
        </p>
        <Link
          to="/login"
          className="inline-block py-2.5 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow"
        >
          {t('cart.signInBtn')}
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('cart.emptyTitle')}</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {t('cart.emptyDesc')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow"
          >
            <span>{t('cart.startBrowsing')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl font-bold text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition"
          >
            <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>{t('nav.orders')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 transition-colors duration-200">
      
      {/* Back Link */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'కేటలాగ్‌కు తిరిగి వెళ్ళండి' : 'Back to Catalog'}</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">{t('cart.title')}</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {itemCount} {t('cart.itemSelected')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/orders"
            className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-amber-900 dark:hover:text-amber-300 bg-stone-100 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
            title="Review past and recent orders"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>{t('nav.orders')}</span>
          </Link>

          <button
            onClick={clearCart}
            disabled={loading}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1.5 transition px-2.5 py-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'కార్ట్ ఖాళీ చేయండి' : 'Clear'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex items-center justify-center p-2 shrink-0">
                  <img
                    src={optimizeImageUrl(item.image_url, 160)}
                    alt={tp(item.product_name)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                      {tb(item.brand)}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                      {ts(item.bottle_size)}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">{tp(item.product_name)}</h3>
                  
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3 text-stone-400" />
                    {tr(item.retailer_name)}
                  </p>
                </div>
              </div>

              {/* Quantity controls & Price */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={loading}
                    className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-stone-900 dark:text-stone-100">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={loading || item.quantity >= 10}
                    className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-400 dark:text-stone-500 block font-normal">{t('productDetail.total')}</span>
                  <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                    ₹{Number(item.total_price).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  disabled={loading}
                  className="p-2 text-stone-400 hover:text-red-600 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Demonstration Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">{t('home.disclosureTitle')}</p>
              <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300">
                {cart.compliance_disclaimer || t('cart.noticeText')}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary & Simulated Checkout */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-6 shadow-sm">
          <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-100 dark:border-stone-800">
            {t('cart.orderSummary')}
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
              <span>{t('cart.subtotal')}</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">₹{Number(subtotal).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
              <span className="flex items-center gap-1">
                {t('cart.deliveryFee')}
                <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1 rounded">{t('cart.disabledBadge')}</span>
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">₹0.00</span>
            </div>

            <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
              <span>{t('cart.exciseCess')}</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">₹0.00 (Demo)</span>
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-sm">
              <span className="font-bold text-stone-900 dark:text-stone-100">{t('cart.totalEstimated')}</span>
              <span className="font-extrabold text-lg text-amber-900 dark:text-amber-400">
                ₹{Number(subtotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <Link
            to="/checkout-demo"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-700/20 flex items-center justify-center gap-2 transition"
          >
            <span>{t('cart.demoCheckoutBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center leading-normal">
            {t('cart.noticeText')}
          </p>
        </div>

      </div>
    </div>
  );
}

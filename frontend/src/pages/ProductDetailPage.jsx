import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Store,
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Globe2
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { t, tp, tb, tc, ts, tr, to, language } = useLanguage();

  const [product, setProduct] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await api.getProduct(id);
        setProduct(data);
        if (data.inventories && data.inventories.length > 0) {
          const inStock = data.inventories.find((i) => i.is_available && i.stock_quantity > 0) || data.inventories[0];
          setSelectedInventory(inStock);
        }
      } catch (err) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert(t('productDetail.loginRequired'));
      return;
    }
    if (!selectedInventory) return;

    try {
      setError(null);
      await addToCart(selectedInventory.id, quantity);
      const prodName = tp(product.name);
      setSuccessMessage(`${prodName} (${ts(selectedInventory.bottle_size)}): ${t('productDetail.addedSuccess')}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-stone-500 font-medium">{language === 'te' ? 'ఉత్పత్తి వివరాలు లోడ్ అవుతున్నాయి...' : 'Loading verified product details...'}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">{t('productDetail.unavailableTitle')}</h2>
        <p className="text-xs text-stone-600 dark:text-stone-400">{error || t('productDetail.unavailableDesc')}</p>
        <Link to="/products" className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 underline">
          <ArrowLeft className="w-4 h-4" /> {t('productDetail.returnCatalog')}
        </Link>
      </div>
    );
  }

  const primaryImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 transition-colors duration-200">
      
      {/* Breadcrumb & Back */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('productDetail.backToCatalog')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Product Image */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <img
            src={primaryImage}
            alt={tp(product.name)}
            className="w-full max-h-[420px] object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </div>

        {/* Right: Specifications & Retailer Selection */}
        <div className="lg:col-span-7 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">
              <span>{tb(product.brand)}</span>
              <span>•</span>
              <span className="text-stone-500 dark:text-stone-400 font-semibold">{tc(product.category_name)}</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
              {tp(product.name)}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stone-600 dark:text-stone-300">
              {product.alcohol_by_volume && (
                <span className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700">
                  {product.alcohol_by_volume}
                </span>
              )}
              <span className="flex items-center gap-1 font-medium">
                <Globe2 className="w-3.5 h-3.5 text-stone-400" />
                {t('productDetail.origin')} {to(product.country_of_origin)}
              </span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {t('productDetail.exciseVerified')}
              </span>
            </div>
          </div>

          <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed">
            {product.description || t('productDetail.defaultDescription')}
          </p>

          {/* Direction 3 Tasting Notes Flavor Radar */}
          <div className="bg-amber-500/5 dark:bg-stone-900/90 rounded-2xl border border-amber-500/20 dark:border-stone-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {language === 'te' ? 'రుచి మరియు సువాసన వివరాలు (Flavor Profile)' : 'Sommelier Flavor Profile & Notes'}
              </span>
              <span className="text-[10px] text-stone-400 font-semibold uppercase">
                {product.category_name || 'Spirits'}
              </span>
            </div>

            {/* Flavor Balance Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { name: 'Oak & Cask', value: '85%' },
                { name: 'Smoky Peat', value: '70%' },
                { name: 'Caramel & Malt', value: '78%' },
                { name: 'Citrus & Spice', value: '60%' },
              ].map((note) => (
                <div key={note.name} className="p-2 rounded-xl bg-white/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60 space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-stone-600 dark:text-stone-300">
                    <span>{note.name}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{note.value}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: note.value }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Aged in Oak Casks', 'Non-Chill Filtered', 'Telangana Barcode Seal', 'Serve Neat or On Rocks'].map((tag) => (
                <span key={tag} className="text-[10px] font-medium bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/60 dark:border-amber-800/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Retailer & Size Options Matrix */}
          <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              {t('productDetail.availableAtRetailers')}
            </h3>

            {product.inventories?.length === 0 ? (
              <p className="text-xs text-stone-500 italic">{t('productDetail.noStock')}</p>
            ) : (
              <div className="space-y-2">
                {product.inventories.map((inv) => {
                  const isSelected = selectedInventory?.id === inv.id;
                  return (
                    <button
                      key={inv.id}
                      onClick={() => {
                        setSelectedInventory(inv);
                        setQuantity(1);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-white dark:bg-stone-800 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                          : 'bg-white/80 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{tr(inv.retailer_shop_name)}</span>
                          <span className="font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            {ts(inv.bottle_size)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{inv.retailer_address}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {inv.is_available ? `${t('productDetail.inStockUnits')} (${inv.stock_quantity})` : t('productDetail.outOfStock')}
                        </span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm sm:text-base whitespace-nowrap">
                          ₹{Number(inv.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {selectedInventory ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">{t('productDetail.quantity')}</span>
                <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-800 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-1 text-xs font-bold text-stone-900 dark:text-stone-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedInventory.stock_quantity || 10, quantity + 1))}
                    className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                    disabled={quantity >= (selectedInventory.stock_quantity || 10)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {t('productDetail.total')} <strong className="text-stone-900 dark:text-stone-100">₹{(Number(selectedInventory.price) * quantity).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={cartLoading || !selectedInventory.is_available || selectedInventory.stock_quantity === 0}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-98 cursor-pointer"
              >
                {cartLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span>{t('product.addToCartBtn')}</span>
              </button>

              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {successMessage}
                  </span>
                  <Link to="/cart" className="font-bold underline text-emerald-900 dark:text-emerald-200">{t('productDetail.viewCart')}</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2">
              <button
                disabled
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-sm bg-stone-300 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t('product.outOfStock')}</span>
              </button>
            </div>
          )}

          {/* Statutory Warning Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              {t('productDetail.statutoryNoticeTitle')}
            </p>
            <p className="leading-relaxed text-[11px] text-amber-800/90 dark:text-amber-200/90">
              {product.compliance_notice || t('banner.exciseText')}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

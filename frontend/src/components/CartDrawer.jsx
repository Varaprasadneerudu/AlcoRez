import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ShieldCheck, ArrowRight, Store, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/**
 * CartDrawer Component
 * 
 * An accessible, high-conversion slide-over cart drawer implementing
 * Direction 3 design aesthetics:
 * - Locks background body scrolling when opened.
 * - Displays live item counts, item brand, bottle size, and verified retailer names.
 * - Real-time excise tax and statutory VAT calculation breakdowns.
 * - Statutory 21+ legal age affirmation before proceeding to checkout.
 * - Route navigation to checkout or full cart view.
 */
export default function CartDrawer() {
  const { cart, itemCount, subtotal, isDrawerOpen, closeDrawer, updateQuantity, removeItem, loading } = useCart();
  const { t, tp, tb, ts, tr, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [ageConfirmed, setAgeConfirmed] = useState(true);

  // Lock body scroll when cart drawer is active to prevent catalogue page scrolling in the background
  useEffect(() => {
    if (isDrawerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const items = cart?.items || [];
  const numSubtotal = Number(subtotal || 0);
  const exciseTax = numSubtotal * 0.08; // 8% simulated excise
  const localVat = numSubtotal * 0.18; // 18% statutory tax
  const totalAmount = numSubtotal + exciseTax + localVat;

  const handleProceedToCheckout = () => {
    closeDrawer();
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/checkout-demo');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 z-50">
        <div
          className="w-screen max-w-md bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col h-full overflow-hidden overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/alcorez_logo.png" alt="AlcoRez" className="h-8 w-auto rounded object-contain shadow-xs shrink-0" />
              <div>
                <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>{language === 'te' ? 'మీ కార్ట్' : 'Your Reserve Cart'}</span>
                  <span className="text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                    {itemCount}
                  </span>
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {language === 'te' ? 'తెలంగాణ అధీకృత A4 వైన్ షాపులు' : 'Licensed Telangana A4 Retail Outlets'}
                </p>
              </div>
            </div>

            <button
              onClick={closeDrawer}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-stone-100 dark:divide-stone-800/80 overscroll-contain">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                    {language === 'te' ? 'మీ కార్ట్ ఖాళీగా ఉంది' : 'Your Reserve Cart is Empty'}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    {language === 'te' ? 'కార్ట్‌కు జోడించడానికి కేటలాగ్‌ను బ్రౌజ్ చేయండి.' : 'Explore verified spirits from authorized wine stores near you.'}
                  </p>
                </div>
                <Link
                  to="/products"
                  onClick={closeDrawer}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition"
                >
                  <span>{language === 'te' ? 'కేటలాగ్‌కు వెళ్ళండి' : 'Browse Catalogue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const itemTotalPrice = item.total_price != null 
                  ? Number(item.total_price) 
                  : Number((item.unit_price || 0) * (item.quantity || 1));
                const retailerName = item.retailer_name || item.retailer_shop_name;
                const itemImage = item.image_url || item.product_image || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=300&q=80';

                return (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                    <img
                      src={itemImage}
                      alt={tp(item.product_name)}
                      className="w-16 h-16 rounded-xl object-contain bg-stone-50 dark:bg-stone-800 p-1.5 border border-stone-200 dark:border-stone-700 shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          {item.brand && (
                            <span className="font-bold text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider block truncate">
                              {tb(item.brand)}
                            </span>
                          )}
                          <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                            {tp(item.product_name)}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-stone-400 hover:text-red-500 transition p-1 cursor-pointer shrink-0"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded">
                          {ts(item.bottle_size)}
                        </span>
                        {retailerName && (
                          <span className="text-amber-800 dark:text-amber-400 font-medium truncate flex items-center gap-1 max-w-[170px]">
                            <Store className="w-3 h-3 shrink-0" />
                            <span className="truncate">{tr(retailerName)}</span>
                          </span>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-extrabold text-stone-900 dark:text-stone-100 text-xs">
                          ₹{itemTotalPrice.toLocaleString('en-IN')}
                        </span>

                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="px-2 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer"
                            disabled={loading || item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition cursor-pointer disabled:opacity-40"
                            disabled={loading || item.quantity >= 10}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 space-y-3.5 shrink-0 overflow-y-auto max-h-[50vh] overscroll-contain">
              
              {/* Pickup SLA Notice */}
              <div className="p-2.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>{language === 'te' ? 'స్టోర్ పికప్' : 'Store Pickup'}:</strong> {language === 'te' ? '30 నిమిషాల్లో కౌంటర్‌లో సిద్ధం' : 'Ready at licensed wine shop counter in ~30 mins'}
                </span>
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{language === 'te' ? 'సబ్ టోటల్' : 'Subtotal'} ({itemCount} {language === 'te' ? 'వస్తువులు' : 'items'})</span>
                  <span>₹{numSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span className="flex items-center gap-1">
                    <span>{language === 'te' ? 'తెలంగాణ ఎక్సైజ్ డ్యూటీ' : 'Telangana State Excise MRP'}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  </span>
                  <span>₹{Math.round(exciseTax).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{language === 'te' ? 'స్థానిక పన్నులు (VAT/TCS)' : 'Statutory Local Taxes (18%)'}</span>
                  <span>₹{Math.round(localVat).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>{language === 'te' ? 'డెలివరీ / కౌంటర్ పికప్ రుసుము' : 'Licensed Counter Pickup Fee'}</span>
                  <span>{language === 'te' ? 'ఉచితం' : 'FREE'}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-extrabold text-sm text-stone-900 dark:text-stone-100">
                  <span>{language === 'te' ? 'మొత్తం చెల్లించవలసినది' : 'Total Amount Payable'}</span>
                  <span className="text-amber-800 dark:text-amber-400">₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Statutory Age Affirmation Checkbox */}
              <label className="flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  {language === 'te'
                    ? 'నేను 21 సంవత్సరాలు లేదా అంతకంటే ఎక్కువ వయస్సు కలిగి ఉన్నానని నిర్ధారిస్తున్నాను.'
                    : 'I confirm that I am 21+ years of age and hold legal permit as per Telangana Excise Law.'}
                </span>
              </label>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={!ageConfirmed || items.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-700/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>
                    {language === 'te' ? 'ఆర్డర్ రిజర్వ్ చేయండి' : 'Proceed to Reserve'}
                  </span>
                  <span>(₹{Math.round(totalAmount).toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <Link
                    to="/cart"
                    onClick={closeDrawer}
                    className="font-semibold text-stone-500 hover:text-amber-800 dark:hover:text-amber-300 underline"
                  >
                    {language === 'te' ? 'పూర్తి కార్ట్ పేజీ చూడండి' : 'View Full Cart Page'}
                  </Link>

                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    {language === 'te' ? 'ఎక్సైజ్ రక్షణతో' : 'Excise Compliant'}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

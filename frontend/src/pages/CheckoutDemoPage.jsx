import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function CheckoutDemoPage() {
  const { cart, subtotal, fetchCart } = useCart();
  const { t, tp, ts, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [simulateSuccess, setSimulateSuccess] = useState(true);
  const [notes, setNotes] = useState(
    language === 'te'
      ? 'ప్రదర్శన సమీక్ష కోసం సిమ్యులేటెడ్ ఆర్డర్'
      : 'Demonstration simulated order placement'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New address modal state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: language === 'te' ? 'ఇల్లు' : 'Home',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postal_code: '500081',
    is_default: false,
  });

  useEffect(() => {
    async function loadAddresses() {
      if (!isAuthenticated) return;
      try {
        const addrs = await api.getAddresses();
        setAddresses(addrs || []);
        if (addrs && addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    }
    loadAddresses();
  }, [isAuthenticated]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createAddress(newAddr);
      setAddresses([created, ...addresses]);
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewAddr({
        label: language === 'te' ? 'ఇల్లు' : 'Home',
        address_line1: '',
        address_line2: '',
        landmark: '',
        city: 'Hyderabad',
        state: 'Telangana',
        postal_code: '500081',
        is_default: false,
      });
    } catch (err) {
      setError(`Address creation failed: ${err.message}`);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const orders = await api.createTestOrder({
        address_id: selectedAddressId || null,
        customer_notes: notes,
        simulate_payment_success: simulateSuccess,
      });

      await fetchCart(); // refresh empty cart

      // Refresh notification center immediately
      window.dispatchEvent(new CustomEvent('alco_notification_refresh'));

      if (orders && orders.length > 0) {
        navigate(`/orders/${orders[0].id}`, { state: { justPlaced: true } });
      } else {
        navigate('/orders');
      }
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {language === 'te' ? 'సైన్ ఇన్ అవసరం' : 'Sign In Required'}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {language === 'te'
            ? 'ఆర్డర్‌ను రిజర్వ్ చేయడానికి దయచేసి మీ ఖాతాలోకి సైన్ ఇన్ చేయండి.'
            : 'Please log in to your account to review and complete your test reservation.'}
        </p>
        <Link
          to="/login"
          className="inline-block py-2.5 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow transition"
        >
          {language === 'te' ? 'లాగిన్ చేయండి' : 'Sign In to Proceed'}
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t('checkout.cartEmpty', 'Your cart is empty')}
        </h2>
        <Link
          to="/products"
          className="inline-block py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow"
        >
          {t('checkout.browseProducts', 'Browse Products')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Back Link */}
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'కార్ట్‌కు తిరిగి వెళ్ళండి' : 'Back to Cart'}</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
          {t('checkout.title', 'Simulated Demonstration Checkout')}
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          {t('checkout.stepDesc', 'Step 2 of 2 • Prototype order creation and test payment verification')}
        </p>
      </div>

      {/* Critical Statutory Alert */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-700/60 p-5 text-xs text-amber-950 dark:text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
          <span>{t('checkout.statutoryAlertTitle', 'Legal Clearances Pending — Alcohol Transaction Flow Disabled by Default')}</span>
        </div>
        <p className="leading-relaxed text-stone-700 dark:text-amber-200/90">
          {t('checkout.statutoryAlertText', 'Under the Telangana Excise Act, 1968, retail alcohol delivery and online payments are strictly prohibited for wine shops. This checkout creates a simulated test order to evaluate platform mechanics. No actual alcohol will be packed or dispatched.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Address & Payment Simulation */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Customer Address */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                {t('checkout.deliveryAddressTitle', 'Hyderabad Delivery Address (Demonstration Location)')}
              </h2>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('checkout.addNewAddress', 'Add New Address')}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddAddress && (
              <form onSubmit={handleCreateAddress} className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <h3 className="font-bold text-xs text-stone-800 dark:text-stone-200">
                  {t('checkout.addNewAddressTitle', 'Add New Hyderabad Address')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                      {t('checkout.label', 'Label')}
                    </label>
                    <input
                      type="text"
                      value={newAddr.label}
                      onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                      placeholder={t('checkout.labelPlaceholder', 'e.g. Home, Office')}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                      {t('checkout.postalCode', 'Postal Code')}
                    </label>
                    <input
                      type="text"
                      value={newAddr.postal_code}
                      onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                      placeholder={t('checkout.postalCodePlaceholder', 'e.g. 500081')}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                      {t('checkout.addressLine1', 'Address Line 1')}
                    </label>
                    <input
                      type="text"
                      value={newAddr.address_line1}
                      onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
                      placeholder={t('checkout.addressLine1Placeholder', 'Flat / House / Building')}
                      className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg transition"
                  >
                    {t('checkout.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow transition"
                  >
                    {t('checkout.saveAddress', 'Save Address')}
                  </button>
                </div>
              </form>
            )}

            {/* Address List */}
            <div className="space-y-2">
              {addresses.length === 0 ? (
                <div className="p-3 text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-950 rounded-xl">
                  {t('checkout.noSavedAddress', 'No saved addresses found. You can add one above or proceed with in-store pickup demonstration.')}
                </div>
              ) : (
                addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`block p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="address_selector"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-bold text-stone-900 dark:text-stone-100">{addr.label}</span>
                            <p className="text-stone-600 dark:text-stone-400 mt-0.5">{addr.address_line1}, {addr.city}, {addr.state} - {addr.postal_code}</p>
                          </div>
                        </div>
                        {addr.is_default && (
                          <span className="text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">
                            {t('checkout.defaultBadge', 'Default')}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Payment Simulator */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <CreditCard className="w-4 h-4 text-amber-700 dark:text-amber-500" />
              {t('checkout.paymentGatewayTitle', 'Simulated Payment Gateway')}
            </h2>

            <div className="space-y-3 text-xs">
              <label
                onClick={() => setSimulateSuccess(true)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  simulateSuccess
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={simulateSuccess}
                    onChange={() => setSimulateSuccess(true)}
                    className="text-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {t('checkout.simulateSuccessTitle', 'Simulate Gateway Approval (Instant Success)')}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      {t('checkout.simulateSuccessDesc', 'Creates test order with SUCCESS status and snapshots pricing')}
                    </span>
                  </div>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  {t('checkout.recommended', 'Recommended')}
                </span>
              </label>

              <label
                onClick={() => setSimulateSuccess(false)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  !simulateSuccess
                    ? 'bg-red-50/60 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={!simulateSuccess}
                    onChange={() => setSimulateSuccess(false)}
                    className="text-red-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {t('checkout.simulateFailureTitle', 'Simulate Gateway Rejection / Failure')}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      {t('checkout.simulateFailureDesc', 'Simulates a declined card transaction response')}
                    </span>
                  </div>
                </div>
                <span className="text-red-700 dark:text-red-400 font-bold text-[11px] bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                  {t('checkout.testFailure', 'Test Failure')}
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-2 shadow-sm text-xs">
            <label className="font-bold text-stone-700 dark:text-stone-300 block">
              {t('checkout.notesLabel', 'Customer / Simulation Notes (Optional)')}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('checkout.notesPlaceholder', 'e.g. Test simulated order for demonstration review')}
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

        </div>

        {/* Right Column: Order Summary & Place Test Order */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-6 shadow-sm">
          <h2 className="font-extrabold text-base text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-100 dark:border-stone-800">
            {t('checkout.orderReview', 'Order Review')}
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-50 dark:border-stone-800 gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block truncate">
                    {tp(item.product_name)}
                  </span>
                  <p className="text-[10px] text-stone-400">
                    {t('checkout.qty', 'Qty:')} {item.quantity} • {ts(item.bottle_size)}
                  </p>
                </div>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs">
            <div className="flex justify-between text-stone-600 dark:text-stone-400">
              <span>{t('checkout.subtotal', 'Subtotal')}</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">₹{Number(subtotal).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between text-sm">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {t('checkout.demonstrationValue', 'Total Amount')}
              </span>
              <span className="font-extrabold text-amber-900 dark:text-amber-400 text-lg">
                ₹{Number(subtotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span>{t('checkout.simulatingOrder', 'Simulating Order...')}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('checkout.placeSimulatedOrder', 'Place Simulated Order')}</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
            {t('checkout.prototypeNotice', 'This prototype does NOT connect to a real banking gateway or merchant acquirer. Order records are created in test status for technical validation.')}
          </div>
        </div>

      </div>
    </div>
  );
}

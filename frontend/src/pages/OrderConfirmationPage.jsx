import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Store,
  MapPin,
  ShieldCheck,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const STATUS_THEMES = {
  created: {
    bg: 'bg-amber-100 dark:bg-amber-950/80',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800'
  },
  confirmed: {
    bg: 'bg-sky-100 dark:bg-sky-950/80',
    text: 'text-sky-900 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-800'
  },
  preparing: {
    bg: 'bg-indigo-100 dark:bg-indigo-950/80',
    text: 'text-indigo-900 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800'
  },
  ready: {
    bg: 'bg-purple-100 dark:bg-purple-950/80',
    text: 'text-purple-900 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800'
  },
  completed: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/80',
    text: 'text-emerald-900 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800'
  },
  cancelled: {
    bg: 'bg-rose-100 dark:bg-rose-950/80',
    text: 'text-rose-900 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800'
  }
};

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;
  const { t, tp, tb, ts, tr, language, tstatus } = useLanguage();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderSteps = [
    { key: 'created', label: language === 'te' ? 'ఆర్డర్ సృష్టించబడింది' : 'Order Created' },
    { key: 'confirmed', label: language === 'te' ? 'రిటైలర్ ధృవీకరించారు' : 'Retailer Confirmed' },
    { key: 'preparing', label: language === 'te' ? 'ప్యాకింగ్ జరుగుతోంది' : 'Packing & Preparing' },
    { key: 'ready', label: language === 'te' ? 'దుకాణంలో సిద్ధంగా ఉంది' : 'Ready at Store' },
    { key: 'completed', label: language === 'te' ? 'పూర్తయింది (సిమ్యులేటెడ్)' : 'Completed (Simulated)' },
  ];

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const data = await api.getOrder(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
          {t('orderConfirmation.retrieving', 'Retrieving simulated order details...')}
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          {t('orderConfirmation.notFound', 'Order not found')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">{error}</p>
        <Link
          to="/orders"
          className="inline-block py-2 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow"
        >
          {t('orderConfirmation.viewAllOrders', 'View All Orders')}
        </Link>
      </div>
    );
  }

  const currentStepIndex = orderSteps.findIndex((s) => s.key === order.status);
  const statusTheme = STATUS_THEMES[order.status] || STATUS_THEMES.created;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Back Link */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'ఆర్డర్‌ల జాబితాకు తిరిగి వెళ్ళండి' : 'Back to Orders'}</span>
        </Link>
      </div>

      {/* Top Success Banner if just placed */}
      {justPlaced && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-3xl p-5 sm:p-6 text-center space-y-2 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-emerald-950 dark:text-emerald-200">
            {t('orderConfirmation.orderSuccessTitle', 'Simulated Test Order Created Successfully!')}
          </h1>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto leading-relaxed">
            {language === 'te' ? (
              <>మీ డెమో ఆర్డర్ <strong className="font-mono">{order.order_number}</strong> నమోదైంది. తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం, ఈ టెస్ట్ ఆర్డర్ కేటలాగ్ రూటింగ్ మరియు ఇన్వెంటరీ నిర్వహణను పరీక్షిస్తుంది.</>
            ) : (
              <>Your demonstration order <strong className="font-mono">{order.order_number}</strong> has been logged. Under Telangana Excise Regulations, this test order evaluates catalogue routing and mock inventory decrements.</>
            )}
          </p>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 space-y-6 sm:space-y-8 shadow-sm">
        
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-start gap-3.5">
            <img src="/alcorez_logo.png" alt="AlcoRez" className="h-12 w-auto rounded-lg shadow-sm shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded">
                {order.is_simulated
                  ? t('orderConfirmation.simulatedBadge', 'SIMULATED DEMONSTRATION ORDER')
                  : t('orderConfirmation.liveBadge', 'LIVE ORDER')}
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {order.order_number}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t('orderConfirmation.placedOn', 'Placed on')}{' '}
                {new Date(order.created_at).toLocaleString(language === 'te' ? 'te-IN' : 'en-IN')}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-stone-400 dark:text-stone-400 block">
              {t('orderConfirmation.currentStatus', 'Current Order Status')}
            </span>
            <span className={`inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}>
              {tstatus(order.status)}
            </span>
          </div>
        </div>

        {/* Order Lifecycle Progression Stepper */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            {t('orderConfirmation.workflowTitle', 'Simulated Workflow State Machine')}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {orderSteps.map((step, idx) => {
              const isPastOrCurrent = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border text-xs text-center transition ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''} ${
                    isCurrent
                      ? isCompleted
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-md'
                        : 'bg-amber-600 text-white font-bold border-amber-600 shadow-md'
                      : isPastOrCurrent
                      ? isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold border-amber-200 dark:border-amber-800'
                      : 'bg-stone-50 dark:bg-stone-950 text-stone-400 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="text-[10px] opacity-80 uppercase">
                    {t('orderConfirmation.stepPrefix', 'Step')} {idx + 1}
                  </div>
                  <div className="mt-0.5 text-xs">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direction 3 Secure OTP Pickup Code & Excise QR Verification Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              {language === 'te' ? 'డెలివరీ & కౌంటర్ పికప్ సెక్యూర్ OTP' : 'Secure Delivery & Counter Pickup OTP'}
            </span>
            <div className="flex items-center gap-3">
              <div className="font-mono text-3xl sm:text-4xl font-black text-amber-900 dark:text-amber-200 tracking-widest bg-white dark:bg-stone-800 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 shadow-sm">
                {order.delivery_otp || String(Math.abs(order.order_number?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 4892) % 9000 + 1000)}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {language === 'te' ? 'డెలివరీ పార్ట్నర్ వద్ద లేదా దుకాణం వద్ద ఆర్డర్ తీసుకునేటప్పుడు ఈ 4-అంకెల OTPని అందించండి.' : 'Share this 4-digit verification OTP with the delivery partner upon arrival or at the store counter.'}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'te' ? 'తెలంగాణ ఎక్సైజ్ ధృవీకరించబడింది' : 'Telangana Excise Verified'}
              </span>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {language === 'te' ? 'డిజిటల్ ఎక్సైజ్ కంప్లయన్స్ సీల్' : 'Digital Excise Counter Clearance'}
              </p>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                TS-EXCISE-A4-REF #{order.id?.slice(0, 8)?.toUpperCase()}
              </p>
            </div>

            {/* Simulated QR Code SVG */}
            <div className="w-16 h-16 bg-white p-1.5 rounded-xl border border-stone-300 shrink-0 flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 24 24" className="w-full h-full text-stone-900" fill="currentColor">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14-2h4v2h-4v-2zm-6 0h2v2h-2v-2zm2 2h2v2h-2v-2zm4 2h2v4h-2v-4zm-4 2h4v2h-4v-2zm-2-2h2v4h-2v-4zm4-4h2v2h-2v-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Retailer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
              <Store className="w-4 h-4 text-amber-700 dark:text-amber-500" />
              <span>{t('orderConfirmation.assignedRetailer', 'Assigned Licensed Retailer')}</span>
            </div>
            <p className="text-stone-800 dark:text-stone-200 font-semibold">{tr(order.retailer_name)}</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {t('orderConfirmation.retailerSub', 'Retail Wine Shop (A4 Excise Holder)')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
              <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-500" />
              <span>{t('orderConfirmation.deliverySnapshot', 'Delivery / Pickup Snapshot')}</span>
            </div>
            <p className="text-stone-800 dark:text-stone-200 font-semibold">{order.address_snapshot}</p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {t('orderConfirmation.simulatedAddressRecord', 'Simulated Address Record')}
            </p>
          </div>
        </div>

        {/* Snapshotted Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            {t('orderConfirmation.purchasedItems', 'Purchased Item Snapshots (Immutable Audit)')}
          </h3>

          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-stone-50 dark:hover:bg-stone-950 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 dark:text-stone-100">{tp(item.product_name)}</span>
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold text-[10px] px-1.5 py-0.2 rounded">
                      {ts(item.bottle_size)}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {t('orderConfirmation.brandLabel', 'Brand:')} {tb(item.brand)} • {t('orderConfirmation.unitDemoPrice', 'Unit Demonstration Price:')} ₹{Number(item.unit_price).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-stone-500 dark:text-stone-400 text-[11px] block">
                    {t('orderConfirmation.qtyLabel', 'Qty:')} {item.quantity}
                  </span>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                    ₹{Number(item.total_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600 dark:text-stone-400">
            <span>{t('checkout.subtotal', 'Subtotal')}</span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between text-sm">
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {t('orderConfirmation.simulatedTotal', 'Total Amount')}
            </span>
            <span className="font-extrabold text-amber-900 dark:text-amber-400 text-base">
              ₹{Number(order.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Regulatory Disclosure */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('orderConfirmation.clearanceTitle', 'Statutory Demonstration Clearance Notice')}
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            {t('orderConfirmation.clearanceText', 'This test order does not constitute a legally binding excise transport pass or commercial invoice. Licensed retailers under Telangana Excise Act are prohibited from doorstep dispatch without explicit government clearance.')}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          <Link
            to="/orders"
            className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" />
            {t('orderConfirmation.viewPastOrders', 'View Past Test Orders')}
          </Link>

          <Link
            to="/products"
            className="py-2.5 px-5 rounded-xl font-bold text-xs bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 shadow transition"
          >
            {t('orderConfirmation.continueBrowsing', 'Continue Browsing')}
          </Link>
        </div>

      </div>
    </div>
  );
}

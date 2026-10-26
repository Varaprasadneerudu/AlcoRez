import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  Package,
  Store,
  MapPin,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RetailerOrdersPage() {
  const { role } = useAuth();
  const { t, tp, tb, ts, language, tstatus } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getRetailerOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load retailer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusTransition = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setActionError(null);
      const updated = await api.updateOrderStatus(orderId, {
        status: newStatus,
        notes: `Status updated by retailer to ${newStatus}`
      });

      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setActionError(`Transition failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <Link to="/retailer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-2 transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            {language === 'te' ? 'రిటైలర్ డాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి' : 'Back to Retailer Dashboard'}
          </Link>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {language === 'te' ? 'స్టోర్ టెస్ట్ ఆర్డర్లు & వర్క్‌ఫ్లో నిర్వహణ' : 'Store Test Orders & Fulfillment Workflow'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {language === 'te'
              ? 'వచ్చిన సిమ్యులేటెడ్ ఆర్డర్ల దశలను నిర్వహించండి: సృష్టించబడింది → ధృవీకరించబడింది → ప్యాకింగ్ → సిద్ధంగా ఉంది → పూర్తయింది.'
              : 'Progress incoming simulated orders through state transitions: Created → Confirmed → Preparing → Ready → Completed.'}
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
        >
          {t('ordersHistory.refresh', 'Refresh Orders')}
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200">
            {language === 'te' ? 'ఇంకా ఎలాంటి సిమ్యులేటెడ్ ఆర్డర్లు లేవు' : 'No simulated orders yet'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            {language === 'te'
              ? 'ఈ దుకాణానికి కస్టమర్లు సిమ్యులేటెడ్ చెక్అవుట్ చేసినప్పుడు, ఆ ఆర్డర్లు ఇక్కడ కనిపిస్తాయి.'
              : 'When customer users execute simulated checkouts for this shop, incoming test orders will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-stone-900 dark:text-stone-100">{ord.order_number}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded">
                      {tstatus(ord.status)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {language === 'te' ? 'ఆర్డర్ తేదీ:' : 'Placed:'} {new Date(ord.created_at).toLocaleString(language === 'te' ? 'te-IN' : 'en-IN')} • {language === 'te' ? 'గమనికలు:' : 'Customer Notes:'} {ord.notes || (language === 'te' ? 'ఏమీ లేవు' : 'None')}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-stone-400 text-[10px] block uppercase">
                    {t('checkout.demonstrationValue', 'Demonstration Value')}
                  </span>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                    ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items in this order */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {t('ordersHistory.orderedItemsReview', 'Ordered Items')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ord.items.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 text-xs flex justify-between">
                      <div>
                        <span className="font-bold text-stone-800 dark:text-stone-200">{tp(item.product_name)}</span>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">{tb(item.brand)} • {ts(item.bottle_size)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          {item.quantity} {language === 'te' ? 'యూనిట్(లు)' : 'unit(s)'}
                        </span>
                        <p className="text-[10px] text-stone-400">₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  <span>{language === 'te' ? 'చిరునామా / మోడ్: ' : 'Address / Mode: '}</span>
                  <strong className="text-stone-700 dark:text-stone-300">{ord.address_snapshot}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ord.status === 'created' && (
                    <>
                      <button
                        onClick={() => handleStatusTransition(ord.id, 'confirmed')}
                        disabled={updatingId === ord.id}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition"
                      >
                        {language === 'te' ? 'ఆర్డర్ ధృవీకరించండి' : 'Confirm Order'}
                      </button>
                      <button
                        onClick={() => handleStatusTransition(ord.id, 'rejected')}
                        disabled={updatingId === ord.id}
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                      >
                        {language === 'te' ? 'తిరస్కరించండి' : 'Reject'}
                      </button>
                    </>
                  )}

                  {ord.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusTransition(ord.id, 'preparing')}
                      disabled={updatingId === ord.id}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition"
                    >
                      {language === 'te' ? 'ప్యాకింగ్ ప్రారంభించండి' : 'Start Preparing'}
                    </button>
                  )}

                  {ord.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusTransition(ord.id, 'ready')}
                      disabled={updatingId === ord.id}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition"
                    >
                      {language === 'te' ? 'షాపు వద్ద సిద్ధంగా ఉంది' : 'Mark Ready at Store'}
                    </button>
                  )}

                  {ord.status === 'ready' && (
                    <button
                      onClick={() => handleStatusTransition(ord.id, 'completed')}
                      disabled={updatingId === ord.id}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow flex items-center gap-1 transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {language === 'te' ? 'పూర్తయినట్లు మార్క్ చేయండి (సిమ్యులేటెడ్)' : 'Mark Completed (Simulated)'}
                    </button>
                  )}

                  {['completed', 'rejected', 'cancelled'].includes(ord.status) && (
                    <span className="text-xs font-semibold text-stone-400 italic">
                      {language === 'te' ? 'ఆర్డర్ పూర్తయింది' : 'Order lifecycle complete'}
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

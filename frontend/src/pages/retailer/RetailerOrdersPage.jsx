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
  const [actionSuccess, setActionSuccess] = useState(null);

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
      setActionSuccess(null);
      const updated = await api.updateOrderStatus(orderId, {
        status: newStatus,
        notes: `Status updated by retailer to ${newStatus}`
      });

      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      window.dispatchEvent(new CustomEvent('alco_notification_refresh'));
      if (newStatus === 'confirmed') {
        setActionSuccess(
          language === 'te'
            ? 'ఆర్డర్ విజయవంతంగా ఆమోదించబడింది! ఇన్వెంటరీలో స్టాక్ పరిమాణం స్వయంచాలకంగా తగ్గించబడింది.'
            : 'Order accepted successfully! Inventory stock count was automatically decreased.'
        );
      } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
        setActionSuccess(
          language === 'te'
            ? 'ఆర్డర్ రద్దు చేయబడింది/తిరస్కరించబడింది. వర్తించే చోట స్టాక్ పునరుద్ధరించబడింది.'
            : 'Order updated. Any previously allocated stock has been restored.'
        );
      }
    } catch (err) {
      setActionError(`Transition failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <Link to="/retailer" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Retailer Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Store Test Orders & Fulfillment Workflow
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Progress incoming simulated orders through state transitions: Created → Confirmed → Preparing → Ready → Completed.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
        >
          Refresh Orders
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 font-bold text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800">No simulated orders yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            When customer users execute simulated checkouts for this shop, incoming test orders will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-stone-900">{ord.order_number}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Placed: {new Date(ord.created_at).toLocaleString('en-IN')} • Customer Notes: {ord.notes || 'None'}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-stone-400 text-[10px] block uppercase">Demonstration Value</span>
                  <span className="font-extrabold text-stone-900 text-base">
                    ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items in this order */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Ordered Items</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ord.items.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs flex justify-between">
                      <div>
                        <span className="font-bold text-stone-800">{item.product_name}</span>
                        <p className="text-[10px] text-stone-500">{item.brand} • {item.bottle_size}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-stone-700">{item.quantity} unit(s)</span>
                        <p className="text-[10px] text-stone-400">₹{Number(item.total_price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-500">
                  <span>Address / Mode: </span>
                  <strong className="text-stone-700">{ord.address_snapshot}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ord.status === 'created' && (
                    <>
                      <button
                        onClick={() => handleStatusTransition(ord.id, 'confirmed')}
                        disabled={updatingId === ord.id}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'te' ? 'ఆర్డర్ ఆమోదించండి' : 'Accept Order'}
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
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow"
                    >
                      Start Preparing
                    </button>
                  )}

                  {ord.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusTransition(ord.id, 'ready')}
                      disabled={updatingId === ord.id}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow"
                    >
                      Mark Ready at Store
                    </button>
                  )}

                  {ord.status === 'ready' && (
                    <button
                      onClick={() => handleStatusTransition(ord.id, 'completed')}
                      disabled={updatingId === ord.id}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed (Simulated)
                    </button>
                  )}

                  {['completed', 'rejected', 'cancelled'].includes(ord.status) && (
                    <span className="text-xs font-semibold text-stone-400 italic">
                      Order lifecycle complete
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

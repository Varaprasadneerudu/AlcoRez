import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function OrdersPlacedPage() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const { language } = useLanguage();
  const [orders, setOrders] = useState(state?.orders || []);
  const [loading, setLoading] = useState(!state?.orders);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (state?.orders?.length) return;
    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all(ids.map((id) => api.getOrder(id)))
      .then((results) => { if (active) setOrders(results); })
      .catch((err) => { if (active) setError(err.message || 'Could not load the order summary.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [state, idsParam]);

  if (loading) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-sm">Loading your test orders…</div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">{language === 'te' ? 'ఆర్డర్ సారాంశం అందుబాటులో లేదు' : 'Order summary unavailable'}</h1>
        <p className="text-stone-600 dark:text-stone-300">{error || (language === 'te' ? 'మీ డెమో ఆర్డర్లు ఆర్డర్ చరిత్రలో అందుబాటులో ఉన్నాయి.' : 'Your simulated orders are still available in your order history.')}</p>
        <Link to="/orders" className="inline-flex rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white">{language === 'te' ? 'ఆర్డర్ చరిత్రను చూడండి' : 'View order history'}</Link>
      </div>
    );
  }

  const total = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/40">
        <CheckCircle2 className="h-9 w-9 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold text-stone-950 dark:text-white">{language === 'te' ? 'డెమో ఆర్డర్లు సృష్టించబడ్డాయి' : 'Simulated orders created'}</h1>
        <p className="mt-2 text-sm text-stone-700 dark:text-stone-200">
          {language === 'te'
            ? `${orders.length} డెమో ఆర్డర్లు సృష్టించబడ్డాయి. చెల్లింపు లేదా నిజమైన డెలివరీ ప్రారంభించబడలేదు.`
            : `${orders.length} ${orders.length === 1 ? 'test order was' : 'test orders were'} created across ${orders.length} ${orders.length === 1 ? 'retailer' : 'retailers'}. No payment or physical delivery was initiated.`}
        </p>
      </div>
      <div className="space-y-3" aria-label="Created orders">
        {orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-500 dark:border-stone-800 dark:bg-stone-900">
            <div>
              <p className="text-base font-semibold text-stone-950 dark:text-white">{order.retailer_name || (language === 'te' ? 'రిటైలర్ ఆర్డర్' : 'Retailer order')}</p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{order.order_number}</p>
              <p className="mt-2 text-sm font-bold text-stone-900 dark:text-stone-100">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-5 dark:border-stone-800">
        <p className="text-base font-bold">{language === 'te' ? 'డెమో మొత్తం' : 'Total demonstration value'}: ₹{total.toLocaleString('en-IN')}</p>
        <Link to="/orders" className="text-sm font-semibold text-amber-800 underline underline-offset-4 dark:text-amber-300">{language === 'te' ? 'అన్ని ఆర్డర్లను చూడండి' : 'View all orders'}</Link>
      </div>
    </div>
  );
}

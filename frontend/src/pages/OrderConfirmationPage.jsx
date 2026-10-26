import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Store,
  MapPin,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

const ORDER_STEPS = [
  { key: 'created', label: 'Order Created' },
  { key: 'confirmed', label: 'Retailer Confirmed' },
  { key: 'preparing', label: 'Packing & Preparing' },
  { key: 'ready', label: 'Ready at Store' },
  { key: 'completed', label: 'Completed (Simulated)' },
];

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <p className="text-xs text-stone-500 font-medium">Retrieving simulated order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Order not found</h2>
        <p className="text-xs text-stone-500">{error}</p>
        <Link to="/orders" className="inline-block py-2 px-5 bg-amber-600 text-white rounded-xl text-xs font-bold">
          View All Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Success Banner if just placed */}
      {justPlaced && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-6 text-center space-y-2 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-emerald-950">
            Simulated Test Order Created Successfully!
          </h1>
          <p className="text-xs text-emerald-800 max-w-lg mx-auto leading-relaxed">
            Your demonstration order <strong className="font-mono">{order.order_number}</strong> has been logged.
            Under Telangana Excise Regulations, this test order evaluates catalogue routing and mock inventory decrements.
          </p>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-8 shadow-sm">
        
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              {order.is_simulated ? 'SIMULATED DEMONSTRATION ORDER' : 'LIVE ORDER'}
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 mt-1.5 font-mono">
              {order.order_number}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-stone-400 block">Current Order Status</span>
            <span className="inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-bold capitalize bg-amber-100 text-amber-900 border border-amber-300">
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Lifecycle Progression Stepper */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Simulated Workflow State Machine
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ORDER_STEPS.map((step, idx) => {
              const isPastOrCurrent = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border text-xs text-center transition ${
                    isCurrent
                      ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-md'
                      : isPastOrCurrent
                      ? 'bg-amber-50 text-amber-900 font-semibold border-amber-200'
                      : 'bg-stone-50 text-stone-400 border-stone-200'
                  }`}
                >
                  <div className="text-[10px] opacity-80 uppercase">Step {idx + 1}</div>
                  <div className="mt-0.5 text-xs">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Retailer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <Store className="w-4 h-4 text-amber-700" />
              <span>Assigned Licensed Retailer</span>
            </div>
            <p className="text-stone-800 font-semibold">{order.retailer_name}</p>
            <p className="text-[11px] text-stone-500">Retail Wine Shop (A4 Excise Holder)</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>Delivery / Pickup Snapshot</span>
            </div>
            <p className="text-stone-800 font-semibold">{order.address_snapshot}</p>
            <p className="text-[11px] text-stone-500">Simulated Address Record</p>
          </div>
        </div>

        {/* Snapshotted Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Purchased Item Snapshots (Immutable Audit)
          </h3>

          <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-stone-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{item.product_name}</span>
                    <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-1.5 py-0.2 rounded">
                      {item.bottle_size}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Brand: {item.brand} • Unit Demonstration Price: ₹{Number(item.unit_price).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-stone-500 text-[11px] block">Qty: {item.quantity}</span>
                  <span className="font-extrabold text-stone-900 text-sm">
                    ₹{Number(item.total_price).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span className="font-semibold text-stone-900">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Doorstep Logistics</span>
            <span className="font-semibold text-emerald-700">₹0.00 (Delivery Disabled by Law)</span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex justify-between text-sm">
            <span className="font-bold text-stone-900">Simulated Total</span>
            <span className="font-extrabold text-amber-900 text-base">
              ₹{Number(order.total_amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Regulatory Disclosure */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Statutory Demonstration Clearance Notice
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            This test order does not constitute a legally binding excise transport pass or commercial invoice.
            Licensed retailers under Telangana Excise Act are prohibited from doorstep dispatch without explicit government clearance.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
          <Link
            to="/orders"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            View Past Test Orders
          </Link>

          <Link
            to="/products"
            className="py-2.5 px-5 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white shadow"
          >
            Continue Browsing
          </Link>
        </div>

      </div>
    </div>
  );
}

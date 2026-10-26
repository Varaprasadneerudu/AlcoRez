import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Package,
  AlertTriangle,
  FileCheck,
  Clock,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RetailerDashboard() {
  const { user, role, switchDemoAccount } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await api.getRetailerDashboard();
        setDashboard(data);
        setError(null);
      } catch (err) {
        if (err.status === 404) {
          setError('NO_PROFILE');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [role]);

  // If user is not logged in as a retailer or has no retailer profile
  if (error === 'NO_PROFILE' || role !== 'retailer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Retailer Onboarding & Dashboard</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
          You are currently signed in as <strong>{user?.full_name || 'Guest'}</strong> ({role}).
          To access the licensed retailer portal, please submit an excise onboarding application or switch to a demo retailer profile.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => switchDemoAccount('retailer')}
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow"
          >
            Switch to Demo Retailer (Madhapur Wines)
          </button>
          <Link
            to="/retailer/apply"
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white shadow"
          >
            Submit Retailer Application
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-stone-500">Loading retailer dashboard...</p>
      </div>
    );
  }

  const retailer = dashboard?.retailer;
  const isApproved = retailer?.status === 'approved';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Retailer Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 border border-amber-200">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">
                {retailer?.shop_name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {retailer?.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 font-medium">
              {retailer?.address_line}, {retailer?.city} • License: <strong className="font-mono text-stone-800">{retailer?.license?.license_number || 'Under Review'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/retailer/inventory"
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            Manage Inventory
          </Link>
          <Link
            to="/retailer/orders"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            View Test Orders
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Catalogue Listings</span>
            <Layers className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {dashboard?.total_listings || 0}
          </div>
          <span className="text-[11px] text-stone-400">Total active SKUs published</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">In-Stock SKUs</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {dashboard?.active_inventory_count || 0}
          </div>
          <span className="text-[11px] text-stone-400">Available for customer discovery</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock SKUs</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">
            {dashboard?.low_stock_count || 0}
          </div>
          <span className="text-[11px] text-stone-400">Below 5 units threshold</span>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Simulated Orders</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900">
            {dashboard?.test_orders_count || 0}
          </div>
          <span className="text-[11px] text-stone-400">Test orders received for testing</span>
        </div>

      </div>

      {/* License Particulars & Regulatory Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <FileCheck className="w-4 h-4 text-amber-700" />
            Excise License Records
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-500">License Number:</span>
              <span className="font-mono font-bold text-stone-900">{retailer?.license?.license_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-500">License Classification:</span>
              <span className="font-semibold text-stone-900">{retailer?.license?.license_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-500">Issuing Authority:</span>
              <span className="text-stone-700">{retailer?.license?.issuing_authority}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50">
              <span className="text-stone-500">Validity Period:</span>
              <span className="font-semibold text-stone-900">{retailer?.license?.issued_date} to {retailer?.license?.expiry_date}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Excise Verification:</span>
              <span className={`font-bold ${retailer?.license?.is_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                {retailer?.license?.is_verified ? 'Verified & Active' : 'Pending Manual Verification'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50/80 rounded-3xl border border-amber-200 p-6 space-y-3 text-xs text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>Telangana Wine Merchant Operating Restrictions</span>
          </div>
          <p className="leading-relaxed text-stone-700">
            Under Telangana State Prohibition & Excise department conditions:
          </p>
          <ul className="space-y-1.5 text-stone-700 list-disc list-inside">
            <li>Retailers are legally prohibited from executing doorstep alcohol delivery.</li>
            <li>All prices published must strictly respect state-mandated Maximum Retail Prices (MRP).</li>
            <li>Sales to persons under 21 years of age are punishable offenses under Section 34 of the Act.</li>
            <li>Dry day sales must be strictly halted according to state excise notifications.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}

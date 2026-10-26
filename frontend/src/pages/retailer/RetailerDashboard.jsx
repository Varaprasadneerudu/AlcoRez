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
import { useLanguage } from '../../context/LanguageContext';

export default function RetailerDashboard() {
  const { user, role, switchDemoAccount } = useAuth();
  const { t, language } = useLanguage();

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
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('retailerDash.onboardingTitle')}
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
          {t('retailerDash.onboardingDesc')}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => switchDemoAccount('retailer')}
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow"
          >
            {t('retailerDash.switchToDemo')}
          </button>
          <Link
            to="/retailer/apply"
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white shadow"
          >
            {t('retailerDash.submitApplication')}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-stone-500 dark:text-stone-400">{t('retailerDash.loading')}</p>
      </div>
    );
  }

  const retailer = dashboard?.retailer;
  const isApproved = retailer?.status === 'approved';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      
      {/* Retailer Header */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                {retailer?.shop_name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isApproved
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              }`}>
                {retailer?.status === 'approved' ? t('retailerDash.approved') : t('retailerDash.underReview')}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              {retailer?.address_line}, {retailer?.city} • {t('retailerDash.licenseTag')}{' '}
              <strong className="font-mono text-stone-800 dark:text-stone-200">{retailer?.license?.license_number || t('retailerDash.underReview')}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/retailer/inventory"
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            {t('retailerDash.manageInventory')}
          </Link>
          <Link
            to="/retailer/orders"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            {t('retailerDash.viewTestOrders')}
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.catalogueListings')}</span>
            <Layers className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {dashboard?.total_listings || 0}
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.totalActiveSkus')}</span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.inStockSkus')}</span>
            <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {dashboard?.active_inventory_count || 0}
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.availableCustomer')}</span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.lowStockSkus')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 dark:text-amber-400">
            {dashboard?.low_stock_count || 0}
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.belowThreshold')}</span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.simulatedOrders')}</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {dashboard?.test_orders_count || 0}
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.testOrdersReceived')}</span>
        </div>

      </div>

      {/* License Particulars & Regulatory Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* License Records */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
            <FileCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            {t('retailerDash.licenseRecords')}
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">{t('retailerDash.licenseNumber')}</span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{retailer?.license?.license_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">{t('retailerDash.licenseClassification')}</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {retailer?.license?.license_type === 'A4_RETAIL' || retailer?.license?.license_type === 'A4 Retail Wine Shop'
                  ? t('retailerDash.a4RetailWineShop')
                  : retailer?.license?.license_type}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">{t('retailerDash.issuingAuthority')}</span>
              <span className="text-stone-700 dark:text-stone-300 text-right">{t('retailerDash.govtAuthority')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-50 dark:border-stone-800">
              <span className="text-stone-500 dark:text-stone-400">{t('retailerDash.validityPeriod')}</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{retailer?.license?.issued_date} to {retailer?.license?.expiry_date}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500 dark:text-stone-400">{t('retailerDash.exciseVerification')}</span>
              <span className={`font-bold ${retailer?.license?.is_verified ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                {retailer?.license?.is_verified ? t('retailerDash.verifiedActive') : t('retailerDash.pendingVerification')}
              </span>
            </div>
          </div>
        </div>

        {/* Operating Restrictions (High-contrast and dark mode optimized) */}
        <div className="bg-amber-50/90 dark:bg-amber-950/40 rounded-3xl border border-amber-200 dark:border-amber-900/60 p-6 space-y-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
            <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="text-sm">{t('retailerDash.operatingRestrictions')}</span>
          </div>
          <p className="leading-relaxed text-stone-800 dark:text-amber-100 font-medium">
            {t('retailerDash.conditionsIntro')}
          </p>
          <ul className="space-y-2 text-stone-700 dark:text-amber-200/90 list-disc list-inside leading-relaxed">
            <li>{t('retailerDash.restriction1')}</li>
            <li>{t('retailerDash.restriction2')}</li>
            <li>{t('retailerDash.restriction3')}</li>
            <li>{t('retailerDash.restriction4')}</li>
          </ul>
        </div>

      </div>

    </div>
  );
}

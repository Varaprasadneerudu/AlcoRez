import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Package,
  AlertTriangle,
  FileCheck,
  Clock,
  Layers,
  ArrowRight,
  History,
  Boxes,
  RefreshCw,
  AlertOctagon,
  XCircle,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RetailerDashboard() {
  const { role, switchDemoAccount } = useAuth();
  const { t, language } = useLanguage();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await api.getRetailerDashboard();
      setDashboard(data);
      setError(null);
    } catch (err) {
      if (err.status === 404) {
        setError('NO_PROFILE');
      } else {
        setError(err.message || 'Failed to load dashboard metrics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, role]);

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
            className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow cursor-pointer"
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">{t('retailerDash.loading')}</p>
      </div>
    );
  }

  if (error && error !== 'NO_PROFILE') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/80 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
          {language === 'te' ? 'డాష్‌బోర్డ్ లోడ్ చేయడం విఫలమైంది' : 'Failed to Load Dashboard'}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400">{error}</p>
        <button
          onClick={() => loadDashboard()}
          className="py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition cursor-pointer"
        >
          {language === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Retry'}
        </button>
      </div>
    );
  }

  const retailer = dashboard?.retailer;
  const isApproved = retailer?.status === 'approved';
  const lowStockCount = dashboard?.low_stock_count || 0;
  const outOfStockCount = dashboard?.out_of_stock_count || 0;
  const isLicenseExpired = dashboard?.is_license_expired;
  const isLicenseExpiringSoon = dashboard?.is_license_expiring_soon;
  const licenseDaysRemaining = dashboard?.license_days_remaining;
  const recentMovements = dashboard?.recent_movements || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors duration-200">
      
      {/* 1. Critical License Alerts */}
      {isLicenseExpired && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-100">
              {language === 'te' ? 'ఎక్సైజ్ లైసెన్స్ గడువు ముగిసింది' : 'Telangana Excise License Expired'}
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
              {language === 'te'
                ? 'మీ ఎక్సైజ్ లైసెన్స్ గడువు ముగిసింది. రాష్ట్ర ఎక్సైజ్ చట్టాల ప్రకారం ఉత్పత్తి అమ్మకాలు మరియు ఆర్డర్ నెరవేర్పు నిలిపివేయబడ్డాయి. దయచేసి పునరుద్ధరించండి.'
                : 'Your A4 retail excise license has expired. Sales and test order dispatch are restricted in compliance with Telangana Excise Department policy. Please submit renewal documents.'}
            </p>
          </div>
        </div>
      )}

      {!isLicenseExpired && isLicenseExpiringSoon && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-start gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
              {language === 'te'
                ? `లైసెన్స్ గడువు ${licenseDaysRemaining} రోజుల్లో ముగియనుంది`
                : `Excise License Expires in ${licenseDaysRemaining} Days`}
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              {language === 'te'
                ? 'సజావుగా కార్యకలాపాలు సాగడానికి గడువు తేదీకి ముందే ప్రొహిబిషన్ & ఎక్సైజ్ శాఖతో లైసెన్స్ పునరుద్ధరణ ప్రక్రియను పూర్తి చేయండి.'
                : 'Please initiate license renewal with the Prohibition & Excise Department before expiration to avoid statutory suspension.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Low Stock / Out of Stock Banner Alert */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                {language === 'te' ? 'ఇన్వెంటరీ శ్రద్ధ అవసరం' : 'Stock Attention Required'}
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                {lowStockCount > 0 && (
                  <span className="font-semibold text-amber-800 dark:text-amber-400 mr-2">
                    {lowStockCount} {language === 'te' ? 'తక్కువ స్టాక్ SKUs' : 'items low on stock'}
                  </span>
                )}
                {outOfStockCount > 0 && (
                  <span className="font-semibold text-rose-700 dark:text-rose-400">
                    {outOfStockCount} {language === 'te' ? 'పూర్తిగా నిండుకున్నవి' : 'items out of stock'}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <Link
                to="/retailer/inventory?stock=low_stock"
                className="py-2 px-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1 shadow-sm"
              >
                <span>{language === 'te' ? 'తక్కువ స్టాక్ సమీక్షించండి' : 'Review Low Stock'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            {outOfStockCount > 0 && (
              <Link
                to="/retailer/inventory?stock=out_of_stock"
                className="py-2 px-3.5 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white transition flex items-center gap-1 shadow-sm"
              >
                <span>{language === 'te' ? 'ఖాళీ అయినవి' : 'Out of Stock'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. Retailer Header */}
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
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            title="Refresh dashboard metrics"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
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

      {/* 4. Clickable Inventory Metrics Grid (Connecting directly to filtered inventory) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Listings Card -> All Inventory */}
        <Link
          to="/retailer/inventory"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.catalogueListings')}</span>
            <Layers className="w-4 h-4 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center justify-between">
            <span>{dashboard?.total_listings || 0}</span>
            <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition" />
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.totalActiveSkus')}</span>
        </Link>

        {/* In-Stock SKUs -> Filter by in_stock */}
        <Link
          to="/retailer/inventory?stock=in_stock"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.inStockSkus')}</span>
            <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>{dashboard?.active_inventory_count || 0}</span>
            <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.availableCustomer')}</span>
        </Link>

        {/* Low Stock SKUs -> Filter by low_stock */}
        <Link
          to="/retailer/inventory?stock=low_stock"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('retailerDash.lowStockSkus')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 dark:text-amber-400 flex items-center justify-between">
            <span>{lowStockCount}</span>
            <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition" />
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{t('retailerDash.belowThreshold')}</span>
        </Link>

        {/* Out of Stock SKUs -> Filter by out_of_stock */}
        <Link
          to="/retailer/inventory?stock=out_of_stock"
          className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'te' ? 'స్టాక్ ముగిసింది' : 'Out of Stock'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 flex items-center justify-between">
            <span>{outOfStockCount}</span>
            <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition" />
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            {language === 'te' ? 'పునఃస్థాపన అవసరం' : 'Immediate replenishment'}
          </span>
        </Link>

        {/* Total Physical Stock Units */}
        <Link
          to="/retailer/inventory"
          className="col-span-1 sm:col-span-2 lg:col-span-1 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-2 shadow-sm hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'te' ? 'మొత్తం యూనిట్లు' : 'Total Units'}
            </span>
            <Boxes className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center justify-between">
            <span>{dashboard?.total_units?.toLocaleString('en-IN') || 0}</span>
            <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-800 dark:group-hover:text-stone-200 group-hover:translate-x-1 transition" />
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            {language === 'te' ? 'గోదాములోని బాటిల్స్' : 'Bottles in inventory'}
          </span>
        </Link>

      </div>

      {/* 5. Recent Activity Feed & Stock Movement Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Stock Movement Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {language === 'te' ? 'ఇటీవలి ఇన్వెంటరీ కదలికలు' : 'Recent Stock Movements & Adjustments'}
              </h2>
            </div>
            <Link
              to="/retailer/inventory"
              className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
            >
              {language === 'te' ? 'అన్నీ చూడండి' : 'Manage All'} →
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Package className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {language === 'te'
                  ? 'ఇటీవలి స్టాక్ సర్దుబాట్లు లేదా మూవ్మెంట్లు లేవు.'
                  : 'No recent stock adjustments recorded for this shop.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentMovements.slice(0, 5).map((mv) => (
                <div key={mv.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider shrink-0 ${
                        mv.change_quantity > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : mv.change_quantity < 0
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      {mv.change_quantity > 0 ? `+${mv.change_quantity}` : mv.change_quantity}
                    </span>
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        {mv.product_name} ({mv.bottle_size})
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Reason: <strong className="text-stone-600 dark:text-stone-300">{mv.reason.replace(/_/g, ' ')}</strong> • By {mv.actor_name}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-stone-400 font-mono shrink-0">
                    {new Date(mv.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulated Test Orders Counter */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {t('retailerDash.simulatedOrders')}
                </h2>
              </div>
            </div>
            <div className="text-3xl font-black text-stone-900 dark:text-stone-100">
              {dashboard?.test_orders_count || 0}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {language === 'te'
                ? 'తెలంగాణ శాసనబద్ధమైన ఆల్కహాల్ నియమాల ప్రకారం ఈ పరీక్ష ఆర్డర్‌లలో నిజమైన చెల్లింపులు లేదా డెలివరీలు ఉండవు.'
                : 'Demo mode active. Simulated test orders demonstrate verification workflows without triggering actual payments or physical delivery.'}
            </p>
          </div>

          <Link
            to="/retailer/orders"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition flex items-center justify-center gap-2"
          >
            <span>{t('retailerDash.viewTestOrders')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* 6. License Particulars & Regulatory Notice */}
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
              <div className="text-right">
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  {retailer?.license?.issued_date} to {retailer?.license?.expiry_date}
                </span>
                {licenseDaysRemaining !== null && licenseDaysRemaining !== undefined && (
                  <span className={`block text-[10px] font-bold ${
                    isLicenseExpired
                      ? 'text-rose-600'
                      : isLicenseExpiringSoon
                      ? 'text-amber-800 dark:text-amber-400'
                      : 'text-stone-400'
                  }`}>
                    {isLicenseExpired
                      ? 'Expired'
                      : `${licenseDaysRemaining} days remaining`}
                  </span>
                )}
              </div>
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

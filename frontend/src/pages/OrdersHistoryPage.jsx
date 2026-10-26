import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  Store,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Search,
  Star,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Printer,
  X,
  ShieldCheck,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const STATUS_THEMES = {
  created: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    text: 'text-amber-900 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800'
  },
  confirmed: {
    bg: 'bg-sky-100 dark:bg-sky-950',
    text: 'text-sky-900 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-800'
  },
  preparing: {
    bg: 'bg-indigo-100 dark:bg-indigo-950',
    text: 'text-indigo-900 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800'
  },
  ready: {
    bg: 'bg-purple-100 dark:bg-purple-950',
    text: 'text-purple-900 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800'
  },
  completed: {
    bg: 'bg-emerald-100 dark:bg-emerald-950',
    text: 'text-emerald-900 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800'
  },
  cancelled: {
    bg: 'bg-rose-100 dark:bg-rose-950',
    text: 'text-rose-900 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800'
  }
};

export default function OrdersHistoryPage() {
  const { user, isAuthenticated, role } = useAuth();
  const { t, tp, tb, ts, tr, language, tstatus } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const fetchOrders = () => {
    if (isAuthenticated && role === 'customer') {
      setLoading(true);
      api.getOrders()
        .then((data) => setOrders(data || []))
        .catch((err) => console.error('Failed to load orders:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated, role]);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleOpenReview = (order) => {
    setReviewModalOrder(order);
    setRating(5);
    setReviewComment('');
    setReviewSubmitted(false);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewModalOrder(null);
      setReviewSubmitted(false);
    }, 1800);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE') {
          if (!['created', 'confirmed', 'preparing', 'ready'].includes(ord.status)) return false;
        } else if (statusFilter === 'COMPLETED') {
          if (ord.status !== 'completed') return false;
        } else if (statusFilter === 'CANCELLED') {
          if (ord.status !== 'cancelled') return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = ord.order_number?.toLowerCase().includes(query);
        const matchesRetailer = ord.retailer_name?.toLowerCase().includes(query);
        const matchesItems = ord.items?.some(
          (item) =>
            item.product_name?.toLowerCase().includes(query) ||
            item.brand?.toLowerCase().includes(query)
        );
        return matchesNumber || matchesRetailer || matchesItems;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Aggregate stats
  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [orders]);

  const activeCount = useMemo(() => {
    return orders.filter((o) => ['created', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('ordersHistory.signInToReview', 'Sign in to Review Your Orders')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {t('ordersHistory.signInDesc', 'Access your past simulated transactions, inspect itemized invoices, and review order fulfillment status.')}
        </p>
        <Link
          to="/login"
          className="inline-block py-2.5 px-8 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
        >
          {t('ordersHistory.signInBtn', 'Sign In')}
        </Link>
      </div>
    );
  }

  if (role === 'retailer') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('ordersHistory.retailerNoticeTitle', 'Retailer Portal Notice')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {t('ordersHistory.retailerNoticeDesc', 'You are currently signed in with a Licensed Retailer account. Customer purchase history is reserved for consumers. To review and fulfill store orders, please navigate to your Retailer Orders portal.')}
        </p>
        <div className="pt-2">
          <Link
            to="/retailer/orders"
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
          >
            <span>{t('ordersHistory.openRetailerOrders', 'Open Retailer Orders')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('ordersHistory.adminNoticeTitle', 'Excise Administrator Notice')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {t('ordersHistory.adminNoticeDesc', 'You are signed in as an Excise Administrator. Regulatory inspection, retailer licensing, and immutable audit logs are managed from the Administrator Dashboard.')}
        </p>
        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 shadow-md transition"
          >
            <span>{t('ordersHistory.openAdminDashboard', 'Open Admin Dashboard')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded uppercase tracking-wider">
              {t('ordersHistory.customerAccount', 'Customer Account')}
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t('ordersHistory.ageVerified', 'Telangana Age Verified (21+)')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-1">
            {t('ordersHistory.title', 'My Orders & Experience Reviews')}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t('ordersHistory.subtitle', 'Review previous demonstration orders for')}{' '}
            <strong className="text-stone-700 dark:text-stone-300 font-semibold">{user?.full_name}</strong> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('ordersHistory.refresh', 'Refresh')}</span>
          </button>

          <Link
            to="/products"
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 shadow transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('ordersHistory.exploreCatalogue', 'Explore Catalogue')}</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            {t('ordersHistory.totalOrders', 'Total Orders')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">{orders.length}</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">{t('ordersHistory.simulatedBadge', 'simulated')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            {t('ordersHistory.activeOrders', 'Active Orders')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{activeCount}</span>
            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">{t('ordersHistory.inProgress', 'in progress')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            {t('ordersHistory.demonstrationSpend', 'Demonstration Spend')}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">₹{totalSpent.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            {t('ordersHistory.complianceStatus', 'Telangana Compliance')}
          </span>
          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('ordersHistory.passClear', 'Pass Clear (Demo)')}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: `${t('ordersHistory.tabAll', 'All Orders')} (${orders.length})` },
            { id: 'ACTIVE', label: `${t('ordersHistory.tabActive', 'Active')} (${activeCount})` },
            { id: 'COMPLETED', label: `${t('ordersHistory.tabCompleted', 'Completed')} (${orders.filter(o => o.status === 'completed').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('ordersHistory.searchPlaceholder', 'Search by Order #, Retailer or Product...')}
            className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {searchQuery || statusFilter !== 'ALL'
              ? t('ordersHistory.noMatchingOrders', 'No matching orders found')
              : t('ordersHistory.noOrdersYet', 'No previous orders yet')}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'ALL'
              ? t('ordersHistory.noMatchingDesc', 'Try modifying your search keywords or resetting status filters to find previous orders.')
              : t('ordersHistory.noOrdersDesc', 'Add products to your cart and complete a simulated demonstration checkout to review past orders and tracking.')}
          </p>
          <div className="pt-2">
            {searchQuery || statusFilter !== 'ALL' ? (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                className="py-2.5 px-6 rounded-xl text-xs font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition"
              >
                {t('ordersHistory.resetFilters', 'Reset Filters')}
              </button>
            ) : (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
              >
                <span>{t('ordersHistory.browseCatalogue', 'Browse Telangana Catalogue')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((ord) => {
            const isExpanded = expandedOrders[ord.id] ?? true;
            const theme = STATUS_THEMES[ord.status] || STATUS_THEMES.created;
            const localizedStatus = tstatus(ord.status);

            return (
              <div
                key={ord.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-5 sm:p-6 bg-stone-50/70 dark:bg-stone-950/60 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-stone-900 dark:text-stone-100 tracking-tight">
                        {ord.order_number}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}>
                        {localizedStatus}
                      </span>
                      {ord.is_simulated && (
                        <span className="text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.5 rounded">
                          {t('ordersHistory.simulatedBadge', 'SIMULATED')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                      <span className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                        <Store className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />
                        {tr(ord.retailer_name)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(ord.created_at).toLocaleString(language === 'te' ? 'te-IN' : 'en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span>{ord.items?.length || 0} {t('ordersHistory.lineItems', 'line item(s)')}</span>
                    </div>
                  </div>

                  {/* Top Right Price & Primary Action */}
                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                        {t('ordersHistory.testAmount', 'Test Amount')}
                      </span>
                      <span className="font-black text-lg text-stone-900 dark:text-stone-100">
                        ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="py-2 px-3.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition"
                        title={t('ordersHistory.trackStatus', 'Track Status')}
                      >
                        <span>{t('ordersHistory.trackStatus', 'Track Status')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => toggleExpand(ord.id)}
                        className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white dark:hover:bg-stone-800 transition"
                        title={isExpanded ? t('ordersHistory.hideDetails', 'Hide item details') : t('ordersHistory.reviewDetails', 'Review item details')}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Order Review Details */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6">
                    
                    {/* Delivery snapshot & notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-3.5 border border-stone-100 dark:border-stone-800 flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200 block mb-0.5">
                            {t('ordersHistory.deliveryAddressSnapshot', 'Delivery / Pickup Address')}
                          </span>
                          <span className="text-stone-600 dark:text-stone-400 leading-relaxed">
                            {ord.address_snapshot || (language === 'te' ? 'వైన్ షాప్ పికప్ (హైదరాబాద్)' : 'Retail store pickup (Hyderabad)')}
                          </span>
                        </div>
                      </div>

                      <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-3.5 border border-stone-100 dark:border-stone-800 flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200 block mb-0.5">
                            {t('ordersHistory.auditPaymentStatus', 'Audit Note & Payment Status')}
                          </span>
                          <span className="text-stone-600 dark:text-stone-400 block">
                            {t('ordersHistory.paymentLabel', 'Payment:')} <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{ord.payment_status || 'SIMULATED_SUCCESS'}</strong>
                          </span>
                          <span className="text-[11px] text-stone-400 mt-0.5 block">{ord.notes || 'Demonstration simulated order.'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Itemized Order Review Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                          {t('ordersHistory.orderedItemsReview', 'Ordered Items Review')} ({ord.items?.length || 0})
                        </h4>
                        <span className="text-[11px] text-stone-400">
                          {t('ordersHistory.snapshotNotice', 'Snapshot at time of order')}
                        </span>
                      </div>

                      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                        {ord.items && ord.items.length > 0 ? (
                          ord.items.map((item) => (
                            <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-stone-50/50 dark:hover:bg-stone-950/50 transition">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                                    {tp(item.product_name)}
                                  </span>
                                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold text-[10px] px-1.5 py-0.5 rounded">
                                    {ts(item.bottle_size)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                                  <span>{t('ordersHistory.brandLabel', 'Brand:')} <strong className="text-stone-700 dark:text-stone-300">{tb(item.brand)}</strong></span>
                                  <span>•</span>
                                  <span>{t('ordersHistory.unitLabel', 'Unit:')} ₹{Number(item.unit_price).toLocaleString('en-IN')}</span>
                                  <span>•</span>
                                  <span>{t('ordersHistory.qtyLabel', 'Qty:')} <strong className="text-stone-800 dark:text-stone-200">{item.quantity}</strong></span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-black text-stone-900 dark:text-stone-100 text-sm">
                                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-stone-400 italic text-center">
                            {t('ordersHistory.noLineItems', 'No individual line items captured.')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Breakdown Footer & Actions */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setReceiptModalOrder(ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>{t('ordersHistory.reviewInvoice', 'Review Invoice / Receipt')}</span>
                        </button>

                        <button
                          onClick={() => handleOpenReview(ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>{t('ordersHistory.rateReview', 'Rate & Review Experience')}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                        <span className="text-stone-500 dark:text-stone-400">
                          {t('ordersHistory.subtotalLabel', 'Subtotal:')} <strong className="text-stone-900 dark:text-stone-100">₹{Number(ord.subtotal).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {t('ordersHistory.logisticsLabel', 'Logistics: ₹0 (Demo)')}
                        </span>
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                          {t('ordersHistory.totalLabel', 'Total:')} ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Statutory Disclaimer Card */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-0.5">
            {t('ordersHistory.statutoryNoticeHeading', 'Telangana Regulatory Notice Regarding Order Records:')}
          </h4>
          <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
            {t('ordersHistory.statutoryNoticeDesc', 'All orders presented in this portal are part of an authorized demonstration environment evaluating digital catalogues and excise traceability under the Telangana Excise Act, 1968. In accordance with current state statutes, no alcohol home dispatch or commercial transactions are fulfilled.')}
          </p>
        </div>
      </div>

      {/* Review & Experience Feedback Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setReviewModalOrder(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                {t('ordersHistory.orderReview', 'Order Review')}
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
                {t('ordersHistory.rateModalTitle', 'Rate & Review Retailer Experience')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {language === 'te' ? (
                  <><strong className="text-stone-800 dark:text-stone-200">{tr(reviewModalOrder.retailer_name)}</strong> (ఆర్డర్ #{reviewModalOrder.order_number}) కి సంబంధించి మీ సమీక్ష ఇవ్వండి</>
                ) : (
                  <>Review your simulated order for <strong className="text-stone-800 dark:text-stone-200">{reviewModalOrder.retailer_name}</strong> (Order #{reviewModalOrder.order_number})</>
                )}
              </p>
            </div>

            {reviewSubmitted ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                  {t('ordersHistory.thankYouReview', 'Thank you for your review!')}
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {t('ordersHistory.feedbackRecorded', 'Your feedback has been recorded for excise quality assurance.')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
                    {t('ordersHistory.ratingLabel', 'Rating')}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            rating >= star ? 'text-amber-500 fill-amber-400' : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-stone-700 dark:text-stone-300 text-sm">
                      {rating === 5
                        ? t('ordersHistory.ratingExcellent', 'Excellent')
                        : rating === 4
                        ? t('ordersHistory.ratingGood', 'Good')
                        : rating === 3
                        ? t('ordersHistory.ratingAverage', 'Average')
                        : t('ordersHistory.ratingImprovement', 'Needs Improvement')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
                    {t('ordersHistory.feedbackLabel', 'Order Feedback / Review Comments')}
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('ordersHistory.feedbackPlaceholder', 'Share details on retailer catalogue accuracy, bottle availability, or service speed...')}
                    className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setReviewModalOrder(null)}
                    className="px-4 py-2 rounded-xl font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    {t('checkout.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
                  >
                    {t('ordersHistory.submitReview', 'Submit Review')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Invoice / Receipt Breakdown Modal */}
      {receiptModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-stone-800">
            <button
              onClick={() => setReceiptModalOrder(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                {t('ordersHistory.invoiceModalTitle', 'Simulated Tax Invoice / Voucher')}
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {receiptModalOrder.order_number}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Issued for {user?.full_name} • {new Date(receiptModalOrder.created_at).toLocaleString(language === 'te' ? 'te-IN' : 'en-IN')}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl p-4 border border-stone-100 dark:border-stone-800 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase">
                  {t('ordersHistory.licensedShop', 'Licensed Retail Wine Shop')}
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{tr(receiptModalOrder.retailer_name)}</p>
                <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                  {t('ordersHistory.licenseCategory', 'Telangana Excise License Category A4 (Retail Off-Premises)')}
                </p>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl p-4">
                <div className="font-bold text-stone-700 dark:text-stone-300 pb-2 flex justify-between">
                  <span>{t('ordersHistory.itemDescription', 'Item Description')}</span>
                  <span>{t('ordersHistory.amount', 'Amount')}</span>
                </div>
                {receiptModalOrder.items?.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        {tp(item.product_name)} ({ts(item.bottle_size)})
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {t('ordersHistory.qtyLabel', 'Qty:')} {item.quantity} × ₹{Number(item.unit_price).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      ₹{Number(item.total_price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{t('ordersHistory.itemSubtotal', 'Item Subtotal:')}</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    ₹{Number(receiptModalOrder.subtotal).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{t('ordersHistory.homeLogistics', 'Home Logistics:')}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {t('orderConfirmation.logisticsDisabled', '₹0.00 (Disabled by Statute)')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{t('ordersHistory.cessDemo', 'Telangana Excise Cess (Demo):')}</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
                  <span>{t('ordersHistory.totalDemoValue', 'Total Demonstration Value:')}</span>
                  <span className="text-amber-900 dark:text-amber-400">
                    ₹{Number(receiptModalOrder.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                {t('ordersHistory.statutoryCaveat', 'Statutory Caveat: This receipt is generated by the AlcoDelivery Prototype for educational demonstration. It is not an excise transport permit.')}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('ordersHistory.printVoucher', 'Print Voucher')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

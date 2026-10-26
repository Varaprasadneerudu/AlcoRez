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

const STATUS_CONFIG = {
  created: {
    label: 'Order Placed',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300'
  },
  confirmed: {
    label: 'Retailer Confirmed',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    border: 'border-sky-300'
  },
  preparing: {
    label: 'Packing & Preparing',
    bg: 'bg-indigo-100',
    text: 'text-indigo-900',
    border: 'border-indigo-300'
  },
  ready: {
    label: 'Ready for Store Pickup',
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300'
  },
  completed: {
    label: 'Completed (Simulated)',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300'
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-300'
  }
};

export default function OrdersHistoryPage() {
  const { user, isAuthenticated, role } = useAuth();
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
        <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Sign in to Review Your Orders</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          Access your past simulated transactions, inspect itemized invoices, and review order fulfillment status.
        </p>
        <Link
          to="/login"
          className="inline-block py-2.5 px-8 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (role === 'retailer') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Retailer Portal Notice</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          You are currently signed in with a Licensed Retailer account (<strong className="text-stone-800">{user?.full_name}</strong>). Customer purchase history is reserved for consumers. To review and fulfill store orders, please navigate to your Retailer Orders portal.
        </p>
        <div className="pt-2">
          <Link
            to="/retailer/orders"
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
          >
            <span>Open Retailer Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-stone-100 text-stone-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Excise Administrator Notice</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          You are signed in as an Excise Administrator. Regulatory inspection, retailer licensing, and immutable audit logs are managed from the Administrator Dashboard.
        </p>
        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white shadow-md transition"
          >
            <span>Open Admin Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
              Customer Account
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Telangana Age Verified (21+)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            My Orders & Experience Reviews
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Review previous demonstration orders for <strong className="text-stone-700 font-semibold">{user?.full_name}</strong> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/products"
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white shadow transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Explore Catalogue</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Total Orders</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-stone-900">{orders.length}</span>
            <span className="text-xs text-stone-500">simulated</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Active Orders</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">{activeCount}</span>
            <span className="text-xs text-amber-600 font-medium">in progress</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Demonstration Spend</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-stone-900">₹{totalSpent.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Telangana Compliance</span>
          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pass Clear (Demo)</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: `All Orders (${orders.length})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'COMPLETED', label: `Completed (${orders.filter(o => o.status === 'completed').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
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
            placeholder="Search by Order #, Retailer or Product..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
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
            <div key={i} className="h-44 bg-white rounded-3xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {searchQuery || statusFilter !== 'ALL' ? 'No matching orders found' : 'No previous orders yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try modifying your search keywords or resetting status filters to find previous orders.'
              : 'Add products to your cart and complete a simulated demonstration checkout to review past orders and tracking.'}
          </p>
          <div className="pt-2">
            {searchQuery || statusFilter !== 'ALL' ? (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                className="py-2.5 px-6 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/products"
                className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
              >
                <span>Browse Telangana Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((ord) => {
            const isExpanded = expandedOrders[ord.id] ?? true; // default open to make reviewing easy
            const statusStyle = STATUS_CONFIG[ord.status] || STATUS_CONFIG.created;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-5 sm:p-6 bg-stone-50/70 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-stone-900 tracking-tight">
                        {ord.order_number}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {statusStyle.label}
                      </span>
                      {ord.is_simulated && (
                        <span className="text-[10px] font-semibold bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                          SIMULATED
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-semibold text-stone-700">
                        <Store className="w-3.5 h-3.5 text-amber-700" />
                        {ord.retailer_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(ord.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span>{ord.items?.length || 0} line item(s)</span>
                    </div>
                  </div>

                  {/* Top Right Price & Primary Action */}
                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Test Amount
                      </span>
                      <span className="font-black text-lg text-stone-900">
                        ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="py-2 px-3.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition"
                        title="View live order tracking & status machine"
                      >
                        <span>Track Status</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => toggleExpand(ord.id)}
                        className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-white transition"
                        title={isExpanded ? 'Hide item details' : 'Review item details'}
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
                      <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100 flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-800 block mb-0.5">Delivery / Pickup Address</span>
                          <span className="text-stone-600 leading-relaxed">{ord.address_snapshot || 'Retail store pickup (Hyderabad)'}</span>
                        </div>
                      </div>

                      <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100 flex items-start gap-2.5">
                        <FileText className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-800 block mb-0.5">Audit Note & Payment Status</span>
                          <span className="text-stone-600 block">
                            Payment: <strong className="text-emerald-700 font-semibold">{ord.payment_status || 'SIMULATED_SUCCESS'}</strong>
                          </span>
                          <span className="text-[11px] text-stone-400 mt-0.5 block">{ord.notes || 'Demonstration simulated order.'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Itemized Order Review Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                          Ordered Items Review ({ord.items?.length || 0})
                        </h4>
                        <span className="text-[11px] text-stone-400">Snapshot at time of order</span>
                      </div>

                      <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
                        {ord.items && ord.items.length > 0 ? (
                          ord.items.map((item) => (
                            <div key={item.id} className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-stone-50/50 transition">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-stone-900 text-sm">{item.product_name}</span>
                                  <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-1.5 py-0.5 rounded">
                                    {item.bottle_size}
                                  </span>
                                </div>
                                <div className="text-[11px] text-stone-500 flex items-center gap-2">
                                  <span>Brand: <strong className="text-stone-700">{item.brand}</strong></span>
                                  <span>•</span>
                                  <span>Unit: ₹{Number(item.unit_price).toLocaleString('en-IN')}</span>
                                  <span>•</span>
                                  <span>Qty: <strong className="text-stone-800">{item.quantity}</strong></span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-black text-stone-900 text-sm">
                                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-xs text-stone-400 italic text-center">
                            No individual line items captured.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Breakdown Footer & Actions */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => setReceiptModalOrder(ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 flex items-center gap-1.5 transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>Review Invoice / Receipt</span>
                        </button>

                        <button
                          onClick={() => handleOpenReview(ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5 transition"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Rate & Review Experience</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                        <span className="text-stone-500">
                          Subtotal: <strong className="text-stone-900">₹{Number(ord.subtotal).toLocaleString('en-IN')}</strong>
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-emerald-700 font-semibold">
                          Logistics: ₹0 (Demo)
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="font-extrabold text-stone-900 text-sm">
                          Total: ₹{Number(ord.total_amount).toLocaleString('en-IN')}
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
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900 mb-0.5">Telangana Regulatory Notice Regarding Order Records:</h4>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            All orders presented in this portal are part of an authorized demonstration environment evaluating digital catalogues and excise traceability under the Telangana Excise Act, 1968. In accordance with current state statutes, no alcohol home dispatch or commercial transactions are fulfilled.
          </p>
        </div>
      </div>

      {/* Review & Experience Feedback Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setReviewModalOrder(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Order Review
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                Rate & Review Retailer Experience
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Review your simulated order for <strong className="text-stone-800">{reviewModalOrder.retailer_name}</strong> (Order #{reviewModalOrder.order_number})
              </p>
            </div>

            {reviewSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-950">Thank you for your review!</h4>
                <p className="text-xs text-emerald-800">
                  Your feedback on {reviewModalOrder.retailer_name} has been recorded for excise quality assurance.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-800 block mb-1.5">Rating</label>
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
                            rating >= star ? 'text-amber-500 fill-amber-400' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-stone-700 text-sm">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1.5">
                    Order Feedback / Review Comments
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share details on retailer catalogue accuracy, bottle availability, or service speed..."
                    className="w-full p-3 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-stone-800"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setReviewModalOrder(null)}
                    className="px-4 py-2 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
                  >
                    Submit Review
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReceiptModalOrder(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-stone-200 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                Simulated Tax Invoice / Voucher
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1 font-mono">
                {receiptModalOrder.order_number}
              </h3>
              <p className="text-xs text-stone-500">
                Issued for {user?.full_name} • {new Date(receiptModalOrder.created_at).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Licensed Retail Wine Shop</span>
                <p className="font-bold text-stone-900 text-sm">{receiptModalOrder.retailer_name}</p>
                <p className="text-stone-500 text-[11px]">Telangana Excise License Category A4 (Retail Off-Premises)</p>
              </div>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-4">
                <div className="font-bold text-stone-700 pb-2 flex justify-between">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                {receiptModalOrder.items?.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">{item.product_name} ({item.bottle_size})</p>
                      <p className="text-[11px] text-stone-400">Qty {item.quantity} × ₹{Number(item.unit_price).toLocaleString('en-IN')}</p>
                    </div>
                    <span className="font-bold text-stone-900">₹{Number(item.total_price).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-200">
                <div className="flex justify-between text-stone-600">
                  <span>Item Subtotal:</span>
                  <span className="font-semibold text-stone-900">₹{Number(receiptModalOrder.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Home Logistics:</span>
                  <span className="text-emerald-700 font-semibold">₹0.00 (Disabled by Statute)</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Telangana Excise Cess (Demo):</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Demonstration Value:</span>
                  <span className="text-amber-900">₹{Number(receiptModalOrder.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Statutory Caveat:</strong> This receipt is generated by the Telangana Liquor Marketplace Prototype for educational demonstration. It is not an excise transport permit.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

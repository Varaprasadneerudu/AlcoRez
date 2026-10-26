import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  X,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  PowerOff,
  Power
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminRetailersPage() {
  const { role } = useAuth();

  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [reviewingRetailer, setReviewingRetailer] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [verifyLicense, setVerifyLicense] = useState(true);
  const [processing, setProcessing] = useState(false);

  // In-app notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRetailers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await api.getAllRetailers(filterStatus === 'all' ? '' : filterStatus);
      setRetailers(data || []);
    } catch (err) {
      console.error('Failed to load retailers:', err);
      showToast(err.message || 'Failed to load retailers', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (role === 'admin') {
      fetchRetailers();
    }
  }, [fetchRetailers, role]);

  // Quick Suspend or Quick Approve with 1 click
  const handleQuickStatusChange = async (retailer, newStatus) => {
    const isSuspending = newStatus === 'suspended';
    const confirmMsg = isSuspending
      ? `Are you sure you want to SUSPEND "${retailer.shop_name}"? It will immediately be hidden from all customers and its inventory disabled.`
      : `Are you sure you want to APPROVE "${retailer.shop_name}"? Its catalog and store will become visible to customers.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setProcessing(true);
      await api.reviewRetailer(retailer.id, {
        status: newStatus,
        review_notes: isSuspending
          ? 'Immediate statutory suspension applied by State Excise Administrator'
          : 'Re-approved and authorized by State Excise Administrator',
        verify_license: !isSuspending,
      });

      showToast(
        isSuspending
          ? `"${retailer.shop_name}" has been SUSPENDED and hidden from customer discovery.`
          : `"${retailer.shop_name}" has been APPROVED and activated.`,
        isSuspending ? 'error' : 'success'
      );
      await fetchRetailers(true);
    } catch (err) {
      showToast(`Action failed: ${err.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingRetailer) return;

    setProcessing(true);
    try {
      await api.reviewRetailer(reviewingRetailer.id, {
        status: reviewAction,
        review_notes: reviewNotes || `Decision recorded as ${reviewAction} by Excise Administrator`,
        verify_license: verifyLicense,
      });

      showToast(
        `Retailer "${reviewingRetailer.shop_name}" updated to ${reviewAction.toUpperCase()} and logged to excise audit trail.`,
        reviewAction === 'suspended' ? 'error' : 'success'
      );
      setReviewingRetailer(null);
      setReviewNotes('');
      await fetchRetailers(true);
    } catch (err) {
      showToast(`Review failed: ${err.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Admin Authorization Required</h2>
        <Link to="/admin" className="text-xs font-bold text-amber-800 dark:text-amber-400 underline">Return to Admin Portal</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 transition-colors duration-200">
      
      {/* In-app Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 p-3.5 rounded-2xl shadow-xl border text-xs animate-in slide-in-from-top duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-950/95 text-rose-200 border-rose-800'
            : 'bg-emerald-950/95 text-emerald-200 border-emerald-800'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Retailer Applications & License Verification
            </h1>
            <button
              onClick={() => fetchRetailers(true)}
              disabled={refreshing}
              title="Refresh list"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Manually review gazetted A4 excise licenses, inspect shop premises, and approve or suspend retail wine outlets.
          </p>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold">
          {[
            { key: 'all', label: 'All Shops' },
            { key: 'pending_review', label: 'Pending Review' },
            { key: 'approved', label: 'Approved' },
            { key: 'suspended', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterStatus === tab.key
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Retailers List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 animate-pulse" />
          ))}
        </div>
      ) : retailers.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-12 text-center space-y-3">
          <Store className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-200">No retailers in this status category</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">All submissions in this category have been evaluated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retailers.map((r) => {
            const isApproved = r.status === 'approved';
            const isSuspended = r.status === 'suspended';

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm space-y-4 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">{r.shop_name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : r.status === 'pending_review'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                      {isSuspended && (
                        <span className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold">
                          (Hidden from Customer Discovery)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      Trade: {r.trade_name || 'N/A'} • Contact: <strong>{r.contact_person}</strong> ({r.phone}, {r.email})
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      Premises: {r.address_line}, {r.city}, {r.state} - {r.postal_code}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="shrink-0 flex items-center gap-2">
                    {/* Quick 1-click Toggle Action */}
                    {isApproved ? (
                      <button
                        onClick={() => handleQuickStatusChange(r, 'suspended')}
                        disabled={processing}
                        className="py-2 px-3.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Immediately suspend this store and hide all products from customers"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        <span>Suspend Store</span>
                      </button>
                    ) : isSuspended ? (
                      <button
                        onClick={() => handleQuickStatusChange(r, 'approved')}
                        disabled={processing}
                        className="py-2 px-3.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Re-activate this store and restore catalogue discovery"
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>Re-Activate Store</span>
                      </button>
                    ) : null}

                    {/* Detailed Review Button */}
                    <button
                      onClick={() => {
                        setReviewingRetailer(r);
                        setReviewAction(r.status === 'approved' ? 'suspended' : 'approved');
                        setReviewNotes(r.review_notes || '');
                      }}
                      className="py-2 px-4 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white shadow transition cursor-pointer"
                    >
                      Audit / Review
                    </button>
                  </div>
                </div>

                {/* License Details Row */}
                {r.license && (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">License Number</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xs">{r.license.license_number}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Classification</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{r.license.license_type}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Validity Period</span>
                      <span className="text-stone-700 dark:text-stone-300">{r.license.issued_date} to {r.license.expiry_date}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Excise Verification</span>
                      <span className={`font-bold ${r.license.is_verified ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {r.license.is_verified ? '✓ Verified by State' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>
                )}

                {r.review_notes && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 bg-amber-50/50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/40">
                    <strong className="text-stone-700 dark:text-stone-300">Audit Notes:</strong> {r.review_notes}
                  </p>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Review Action Modal */}
      {reviewingRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                Excise Administrative Review: {reviewingRetailer.shop_name}
              </h3>
              <button onClick={() => setReviewingRetailer(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Administrative Decision</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold"
                >
                  <option value="approved">Approve Retailer & Authorize Catalogue</option>
                  <option value="suspended">Suspend Retailer (Immediately hides store and products from customers)</option>
                  <option value="rejected">Reject Application</option>
                </select>
              </div>

              {reviewAction === 'approved' && (
                <label className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifyLicense}
                    onChange={(e) => setVerifyLicense(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold">Mark Excise License TS-HYD-A4 Verified & Gazetted</span>
                </label>
              )}

              {reviewAction === 'suspended' && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 rounded-xl border border-rose-200 dark:border-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Suspending this store will immediately mark all associated inventory as inactive and hide the store from the customer homepage and catalog search.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">Audit Review Notes (Logged to immutable ledger)</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record verification details, physical inspection report, and statutory gazette reference..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 outline-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setReviewingRetailer(null)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow disabled:opacity-50 cursor-pointer"
                >
                  {processing ? 'Submitting Decision...' : 'Confirm Regulatory Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

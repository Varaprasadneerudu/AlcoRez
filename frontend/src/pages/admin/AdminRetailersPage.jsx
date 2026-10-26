import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  X,
  ArrowLeft
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminRetailersPage() {
  const { role } = useAuth();

  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [reviewingRetailer, setReviewingRetailer] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [verifyLicense, setVerifyLicense] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchRetailers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllRetailers(filterStatus === 'all' ? '' : filterStatus);
      setRetailers(data || []);
    } catch (err) {
      console.error('Failed to load retailers:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (role === 'admin') {
      fetchRetailers();
    }
  }, [fetchRetailers, role]);

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

      setReviewingRetailer(null);
      setReviewNotes('');
      await fetchRetailers();
      alert(`Retailer status updated to ${reviewAction.toUpperCase()} and logged to audit trail.`);
    } catch (err) {
      alert(`Review failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Admin Authorization Required</h2>
        <Link to="/admin" className="text-xs font-bold text-amber-800 underline">Return to Admin Portal</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            Retailer Applications & License Verification
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manually review gazetted A4 excise licenses, inspect shop locations, and approve or suspend retail wine outlets.
          </p>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 text-xs font-semibold">
          {[
            { key: 'pending_review', label: 'Pending Review' },
            { key: 'approved', label: 'Approved' },
            { key: 'suspended', label: 'Suspended' },
            { key: 'all', label: 'All Shops' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === tab.key
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
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
            <div key={i} className="h-40 bg-white rounded-3xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : retailers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
          <Store className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-sm text-stone-800">No retailers in this status category</h3>
          <p className="text-xs text-stone-500">All submissions in this category have been evaluated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retailers.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-stone-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-stone-900">{r.shop_name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      r.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : r.status === 'pending_review'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-medium">
                    Trade: {r.trade_name || 'N/A'} • Contact: <strong>{r.contact_person}</strong> ({r.phone}, {r.email})
                  </p>
                  <p className="text-xs text-stone-600">
                    Premises Address: {r.address_line}, {r.city}, {r.state} - {r.postal_code}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setReviewingRetailer(r);
                      setReviewAction(r.status === 'approved' ? 'suspended' : 'approved');
                      setReviewNotes(r.review_notes || '');
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow transition"
                  >
                    Review Application
                  </button>
                </div>
              </div>

              {/* License Details Row */}
              {r.license && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">License Number</span>
                    <span className="font-mono font-bold text-stone-900 text-xs">{r.license.license_number}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Classification</span>
                    <span className="font-semibold text-stone-800">{r.license.license_type}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Validity Period</span>
                    <span className="text-stone-700">{r.license.issued_date} to {r.license.expiry_date}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Excise Verification</span>
                    <span className={`font-bold ${r.license.is_verified ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {r.license.is_verified ? '✓ Verified by State' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              )}

              {r.review_notes && (
                <p className="text-xs text-stone-500 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <strong className="text-stone-700">Audit Notes:</strong> {r.review_notes}
                </p>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Review Action Modal */}
      {reviewingRetailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-base text-stone-900">
                Excise Administrative Review: {reviewingRetailer.shop_name}
              </h3>
              <button onClick={() => setReviewingRetailer(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Administrative Decision</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none bg-stone-50 font-bold"
                >
                  <option value="approved">Approve Retailer & Authorize Catalogue</option>
                  <option value="rejected">Reject Application</option>
                  <option value="suspended">Suspend Retailer Account</option>
                </select>
              </div>

              {reviewAction === 'approved' && (
                <label className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifyLicense}
                    onChange={(e) => setVerifyLicense(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold">Mark Excise License TS-HYD-A4 Verified & Gazetted</span>
                </label>
              )}

              <div>
                <label className="block text-stone-700 font-bold mb-1">Audit Review Notes (Logged to immutable ledger)</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record verification details, physical inspection report, and statutory gazette reference..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReviewingRetailer(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow disabled:opacity-50"
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

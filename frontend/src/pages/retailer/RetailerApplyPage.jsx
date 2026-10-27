import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, FileCheck, ShieldAlert, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RetailerApplyPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [existingStores, setExistingStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');

  const [formData, setFormData] = useState({
    shop_name: '',
    trade_name: '',
    contact_person: user?.full_name || '',
    phone: user?.phone || '+91-9876543210',
    email: user?.email || '',
    address_line: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postal_code: '500081',
    license_number: 'TS-HYD-A4-2024-',
    license_type: 'A4 Retail Wine Shop',
    issuing_authority: 'Prohibition & Excise Department, Govt of Telangana',
    issued_date: '2024-04-01',
    expiry_date: '2027-03-31',
    document_url: 'https://mock-storage.telangana.gov/licenses/sample-a4-license.pdf',
    existing_retailer_id: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.getRetailers()
      .then((data) => setExistingStores(data || []))
      .catch(() => {});
  }, []);

  const handleStoreSelect = (storeId) => {
    setSelectedStoreId(storeId);
    if (!storeId) {
      setFormData((prev) => ({
        ...prev,
        existing_retailer_id: '',
        shop_name: '',
        trade_name: '',
        address_line: '',
        postal_code: '500081',
        license_number: 'TS-HYD-A4-2024-',
      }));
      return;
    }

    const st = existingStores.find((s) => s.id === storeId);
    if (st) {
      setFormData((prev) => ({
        ...prev,
        existing_retailer_id: st.id,
        shop_name: st.shop_name,
        trade_name: st.trade_name || '',
        address_line: st.address_line || '',
        city: st.city || 'Hyderabad',
        state: st.state || 'Telangana',
        postal_code: st.postal_code || '500081',
        phone: st.phone || prev.phone,
        license_number: st.license?.license_number || prev.license_number,
        license_type: st.license?.license_type || 'A4 Retail Wine Shop',
        issuing_authority: st.license?.issuing_authority || prev.issuing_authority,
        issued_date: st.license?.issued_date || '2024-04-01',
        expiry_date: st.license?.expiry_date || '2027-03-31',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in or select a user persona before submitting an onboarding application.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.submitRetailerApplication(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/retailer');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Onboarding submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Marketplace
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Retailer License Onboarding Application
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Apply to list your licensed A4 wine shop on the Alco Platform.
        </p>
      </div>

      {/* Statutory Requirement Alert */}
      <div className="bg-amber-50 rounded-2xl border border-amber-300 p-5 text-xs text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <span>Statutory Review Requirement (Telangana Excise Dept)</span>
        </div>
        <p className="leading-relaxed text-stone-700">
          Under state regulations, submitted documents are <strong>never automatically approved</strong>. Applications enter a
          strict <code>PENDING_REVIEW</code> status by default. An authorized State Excise Administrator must manually review the
          gazetted license number and physical shop jurisdiction before catalogue listing permissions are granted.
        </p>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-emerald-950">
            Application Submitted Successfully!
          </h2>
          <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
            Your application for <strong>{formData.shop_name}</strong> is currently in <code>PENDING_REVIEW</code> status.
            You can monitor verification progress on your retailer dashboard.
          </p>
          <p className="text-[11px] text-emerald-700">Redirecting to Retailer Dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
          
          {/* Option: Choose existing store or apply new */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
              <Store className="w-4 h-4 text-amber-700" />
              <span>Select an Existing Store or Apply for New A4 Shop</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              If your licensed wine shop is already registered on Alco, select it below to link your account and auto-fill details:
            </p>
            <select
              value={selectedStoreId}
              onChange={(e) => handleStoreSelect(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-medium text-stone-900 outline-none text-xs"
            >
              <option value="">— Register a Brand New Shop (New A4 License Application) —</option>
              {existingStores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.shop_name} ({st.city} • License: {st.license?.license_number || 'A4 Verified'})
                </option>
              ))}
            </select>
            {formData.existing_retailer_id && (
              <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-[11px] text-emerald-900 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Existing Store Selected: Submitting will link your user account to {formData.shop_name} and grant immediate management access!</span>
              </div>
            )}
          </div>

          {/* Section 1: Business Particulars */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Store className="w-4 h-4 text-amber-700" />
              1. Shop & Business Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Official Shop Name</label>
                <input
                  type="text"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  placeholder="e.g. Kondapur Cellars & Malts"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Trade / Business Name</label>
                <input
                  type="text"
                  value={formData.trade_name}
                  onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                  placeholder="e.g. Sri Balaji Beverage Enterprises"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. K. Srinivas Goud"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Business Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91-9849012345"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Business Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. retailer@kondapurwines.mock"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Store Physical Location */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Store className="w-4 h-4 text-amber-700" />
              2. Physical Store Address (Hyderabad Zone)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address_line}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                  placeholder="Plot / Road / Colony"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none bg-stone-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Postal Code (PIN)</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="e.g. 500084"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Excise License Details */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <FileCheck className="w-4 h-4 text-amber-700" />
              3. Telangana Excise License Particulars
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Excise License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="e.g. TS-HYD-A4-2024-9988"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">License Classification</label>
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none bg-stone-50"
                >
                  <option value="A4 Retail Wine Shop">A4 Retail Wine Shop (Gazetted)</option>
                  <option value="2B Bar & Restaurant">2B Bar & Restaurant</option>
                  <option value="CS-1 Elite Retailer">CS-1 Elite Retailer</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Date of Issuance</label>
                <input
                  type="date"
                  value={formData.issued_date}
                  onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">License Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-bold mb-1">Supporting Document URL / PDF</label>
                <input
                  type="text"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-8 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : 'Submit Application for Excise Review'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}

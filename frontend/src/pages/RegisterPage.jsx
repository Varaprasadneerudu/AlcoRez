import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Store, Shield, Lock, Mail, User, Calendar, Phone, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const ROLES = [
  {
    id: 'customer',
    label: 'Customer',
    sublabel: 'Consumer • Age 21+',
    desc: 'Browse catalogs, explore local wine shops, and test checkout.',
    icon: Wine,
    badge: 'Age 21+ Gate',
    color: 'from-amber-500 to-amber-700'
  },
  {
    id: 'retailer',
    label: 'Licensed Retailer',
    sublabel: 'A4 Wine Shop Owner',
    desc: 'Manage store SKU listings, stock quantities, and MRP pricing.',
    icon: Store,
    badge: 'A4 Licensee',
    color: 'from-emerald-600 to-teal-800'
  },
  {
    id: 'admin',
    label: 'Excise Admin',
    sublabel: 'Govt of Telangana',
    desc: 'Verify shop licenses, inspect audit trails, and oversee compliance.',
    icon: Shield,
    badge: 'Regulatory',
    color: 'from-stone-800 to-stone-950'
  }
];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: '1998-05-15',
    role: 'customer',
    retailer_id: '',
  });
  const [existingStores, setExistingStores] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getRetailers()
      .then((data) => setExistingStores(data || []))
      .catch(() => {});
  }, []);

  const selectedRole = ROLES.find((r) => r.id === formData.role) || ROLES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must confirm statutory compliance with the Telangana Excise Act, 1968.');
      return;
    }

    setError(null);
    try {
      const payload = {
        ...formData,
        retailer_id: formData.role === 'retailer' && formData.retailer_id ? formData.retailer_id : undefined
      };
      await register(payload);
      if (formData.role === 'retailer') {
        if (formData.retailer_id) {
          navigate('/retailer');
        } else {
          navigate('/retailer/apply');
        }
      } else if (formData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedRole.color} text-white flex items-center justify-center mx-auto shadow-lg transition-all`}>
          <selectedRole.icon className="w-7 h-7 text-amber-200" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Create {selectedRole.label} Account
        </h1>
        <p className="text-xs text-stone-500">
          Telangana State Liquor Discovery & Verified Retailer Platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-5 shadow-sm text-xs">
        
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-stone-700 font-bold mb-2">Select Account Type / Role</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = formData.role === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setFormData({ ...formData, role: r.id })}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-sm'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isSelected ? 'bg-amber-200/60 text-amber-900' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {r.badge}
                    </span>
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-stone-900 block">{r.label}</span>
                    <span className="text-[10px] text-stone-500 font-medium block leading-tight mt-0.5">{r.sublabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Context Notice */}
        {/* Dynamic Context Notice & Existing Store Selection for Retailer */}
        {formData.role === 'retailer' && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>Licensed Wine Shop Affiliation</span>
            </div>
            
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Select an already existing authorized wine shop to immediately manage inventory & orders, or register a new A4 licensed store:
            </p>

            <div>
              <label className="block font-bold text-stone-700 mb-1 text-[11px]">Select Store (Existing or New Application)</label>
              <select
                value={formData.retailer_id}
                onChange={(e) => setFormData({ ...formData, retailer_id: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white font-medium text-stone-900 outline-none text-xs"
              >
                <option value="">— Register a Brand New Wine Shop (Submit A4 License Application) —</option>
                {existingStores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.shop_name} ({st.city} • Verified A4 Licensee)
                  </option>
                ))}
              </select>
            </div>

            {formData.retailer_id ? (
              <div className="p-2.5 bg-emerald-100/70 border border-emerald-300/80 rounded-xl text-[11px] text-emerald-900 font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Selected Store Confirmed: You will have immediate access to manage listings and incoming orders for this shop!</span>
              </div>
            ) : (
              <p className="text-[10px] text-emerald-700 italic">
                Note: Selecting a new shop will route you to the official Telangana Excise license verification form.
              </p>
            )}
          </div>
        )}

        {formData.role === 'admin' && (
          <div className="p-3.5 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>State Excise Department Administrative Account</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Administrator privileges grant supervisory access to verify gazetted licenses, monitor immutable audit logs, and oversee statutory compliance posture.
            </p>
          </div>
        )}

        {/* Full Legal Name */}
        <div>
          <label className="block text-stone-700 font-bold mb-1">
            {formData.role === 'retailer' ? 'Shop Owner / Licensee Full Name' : formData.role === 'admin' ? 'Officer Legal Name' : 'Full Legal Name'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder={formData.role === 'retailer' ? 'e.g. Suresh Goud' : formData.role === 'admin' ? 'e.g. Inspector K. Venkat Rao' : 'e.g. Ravi Teja Varma'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
              required
            />
            <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-stone-700 font-bold mb-1">
            {formData.role === 'admin' ? 'Official / Government Email Address' : 'Email Address'}
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={formData.role === 'admin' ? 'officer@telanganaliquor.gov.mock' : 'user@domain.com'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
              required
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mobile Phone */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">Mobile Contact Phone</label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9876543210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-stone-700 font-bold mb-1">
              Date of Birth <span className="text-amber-700 font-extrabold">(21+ Mandatory)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                required
              />
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-stone-700 font-bold mb-1">Account Password</label>
          <div className="relative">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
              required
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 21+ Statutory Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
          />
          <span className="leading-snug text-[11px]">
            I certify under penalty of law that I am at least <strong>21 years of age</strong> as mandated by the Telangana Excise Act, 1968, and agree to the statutory platform rules.
          </span>
        </label>

        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : `Create ${selectedRole.label} Account`}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-amber-800 hover:text-amber-900 underline">
              Sign In
            </Link>
          </p>
        </div>

      </form>

    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Lock, Mail, Sparkles, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';

export default function LoginPage() {
  const { login, switchDemoAccount, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await login(email, password);
      if (data.role === 'retailer') navigate('/retailer');
      else if (data.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickDemo = async (key) => {
    try {
      const data = await switchDemoAccount(key);
      if (data.role === 'retailer') navigate('/retailer');
      else if (data.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Wine className="w-6 h-6 text-amber-200" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-stone-500">
          Telangana Alcoholic Beverage Marketplace Platform
        </p>
      </div>

      {/* Quick 1-Click Demo Login Box */}
      <div className="bg-amber-50/90 rounded-3xl border border-amber-200 p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Quick 1-Click Demo Personas</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleQuickDemo(key)}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200/80 text-left text-xs font-semibold text-stone-800 flex items-center justify-between transition shadow-sm"
            >
              <div>
                <span className="block text-stone-900">{acc.label}</span>
                <span className="text-[10px] text-stone-500 font-normal">{acc.email}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
            </button>
          ))}
        </div>
      </div>

      {/* Standard Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-sm">
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-700 font-bold mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

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
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-stone-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-amber-800 hover:text-amber-900 underline">
              Register (21+ Customer)
            </Link>
          </p>
        </div>
      </form>

    </div>
  );
}

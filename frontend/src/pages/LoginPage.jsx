import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Lock, Mail, Sparkles, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlcoRezIcon } from '../components/AlcoRezLogo';

export default function LoginPage() {
  const { login, switchDemoAccount, loading } = useAuth();
  const { t, language } = useLanguage();
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
      setError(
        language === 'te'
          ? 'లాగిన్ విఫలమైంది. దయచేసి మీ వివరాలను తనిఖీ చేయండి.'
          : (err.message || 'Login failed. Please check your credentials.')
      );
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

  const getDemoLabel = (key, defaultLabel) => {
    if (language !== 'te') return defaultLabel;
    if (key === 'customer') return 'రవి తేజ వర్మ (కస్టమర్)';
    if (key === 'retailer') return 'మాదాపూర్ వైన్స్ (రిటైలర్)';
    if (key === 'admin') return 'రాష్ట్ర ఎక్సైజ్ అడ్మిన్';
    return defaultLabel;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      
      {/* Back Link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'స్టోర్‌కు తిరిగి వెళ్ళండి' : 'Back to Store'}</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <AlcoRezIcon className="h-16 w-auto shadow-xl rounded-xl" />
        </div>
        <div className="flex items-center justify-center text-xl tracking-tight leading-none pt-1">
          <span className="text-amber-800 dark:text-amber-400 font-black">Alco</span>
          <span className="text-stone-900 dark:text-stone-100 font-extrabold">Rez</span>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
          {t('auth.signInTitle', 'Sign In to Your Account')}
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium tracking-wide">
          Reserve. Verify. Collect.
        </p>
      </div>

      {/* Quick 1-Click Demo Login Box */}
      <div className="bg-amber-50/90 dark:bg-amber-950/40 rounded-3xl border border-amber-200 dark:border-amber-800 p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{t('auth.quickDemoTitle', 'Quick 1-Click Demo Personas')}</span>
        </div>
        <div className="space-y-1.5">
          {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleQuickDemo(key)}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-stone-900 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800 text-left text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-between transition shadow-sm"
            >
              <div>
                <span className="block text-stone-900 dark:text-stone-100 font-bold">
                  {getDemoLabel(key, acc.label)}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">{acc.email}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Standard Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-sm">
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
              {t('auth.emailAddress', 'Email Address')}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder', 'you@domain.com')}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
              {t('auth.password', 'Password')}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 rounded-xl text-xs border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition disabled:opacity-50"
        >
          {loading ? t('auth.authenticating', 'Authenticating...') : t('auth.signIn', 'Sign In')}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <Link to="/register" className="font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline">
              {t('auth.registerCustomer', 'Register (21+ Customer)')}
            </Link>
          </p>
        </div>
      </form>

    </div>
  );
}

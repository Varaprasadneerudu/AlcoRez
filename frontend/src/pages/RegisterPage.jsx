import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Calendar, Phone, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlcoRezIcon } from '../components/AlcoRezLogo';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: '1998-05-15',
    role: 'customer',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError(
        language === 'te'
          ? 'మీరు తప్పనిసరిగా తెలంగాణ ఎక్సైజ్ చట్టం, 1968 నిబంధనలకు అంగీకరించాలి.'
          : 'You must confirm statutory compliance with the Telangana Excise Act, 1968.'
      );
      return;
    }

    setError(null);
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        date_of_birth: formData.date_of_birth,
        role: 'customer'
      });
      navigate('/');
    } catch (err) {
      setError(err.message || (language === 'te' ? 'నమోదు విఫలమైంది' : 'Registration failed'));
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      
      {/* Back Link */}
      <div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'te' ? 'లాగిన్‌కు తిరిగి వెళ్ళండి' : 'Back to Login'}</span>
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
          {language === 'te' ? 'కస్టమర్ ఖాతాను సృష్టించండి' : 'Create Customer Account'}
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {language === 'te'
            ? 'రిజర్వ్ చేయండి • ధృవీకరించండి • సేకరించండి • 21+ వయస్సు తెలంగాణ మార్కెట్‌ప్లేస్'
            : 'Reserve. Verify. Collect. • 21+ Verified Telangana Marketplace'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-5 shadow-sm text-xs">
        
        {/* Full Legal Name */}
        <div>
          <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
            {t('auth.fullName', 'Full Legal Name')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Ravi Teja Varma"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
              required
            />
            <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
            {t('auth.emailAddress', 'Email Address')}
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@domain.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
              required
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mobile Phone */}
          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
              {t('auth.phone', 'Mobile Contact Phone')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-9876543210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
              {t('auth.dob', 'Date of Birth (21+ Mandatory)')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
                required
              />
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
            {t('auth.password', 'Account Password')}
          </label>
          <div className="relative">
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 outline-none focus:border-amber-500"
              required
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 21+ Statutory Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 text-amber-950 dark:text-amber-200 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
          />
          <span className="leading-snug text-[11px]">
            {language === 'te'
              ? 'తెలంగాణ ఎక్సైజ్ చట్టం, 1968 ప్రకారం నా వయస్సు కనీసం 21 సంవత్సరాలు అని మరియు ప్లాట్‌ఫారమ్ నిబంధనలకు అంగీకరిస్తున్నానని ధృవీకరిస్తున్నాను.'
              : 'I certify under penalty of law that I am at least 21 years of age as mandated by the Telangana Excise Act, 1968, and agree to the statutory platform rules.'}
          </span>
        </label>

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
          {loading
            ? t('auth.creatingAccount', 'Creating Account...')
            : language === 'te'
            ? 'కస్టమర్ ఖాతాను సృష్టించండి'
            : 'Create Customer Account'}
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('auth.alreadyAccount', 'Already have an account?')}{' '}
            <Link to="/login" className="font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline">
              {t('auth.loginLink', 'Sign in instead')}
            </Link>
          </p>
        </div>

      </form>

    </div>
  );
}

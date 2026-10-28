import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingCart,
  Shield,
  Store,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sparkles,
  Package,
  Sun,
  Moon,
  Globe,
  Heart
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation as useGeoLocation, HYDERABAD_ZONES } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import NotificationCenter from './NotificationCenter';
import { AlcoRezIcon } from './AlcoRezLogo';

const DEMO_ACCOUNT_LABELS = {
  customer: {
    en: 'Demo Customer (Hyderabad Consumer)',
    te: 'డెమో కస్టమర్ (హైదరాబాద్ కన్స్యూమర్)'
  },
  retailer: {
    en: 'Demo Retailer (Madhapur Wines)',
    te: 'డెమో రిటైలర్ (మాదాపూర్ వైన్స్)'
  },
  admin: {
    en: 'Demo Admin (Telangana Excise Inspector)',
    te: 'డెమో అడ్మిన్ (తెలంగాణ ఎక్సైజ్ ఇన్‌స్పెక్టర్)'
  }
};

export default function Navbar() {
  const { user, role, isAuthenticated, logout, switchDemoAccount } = useAuth();
  const { itemCount, toggleDrawer } = useCart();
  const { toggleTheme, isDark } = useTheme();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const { selectedZoneId, selectedZone, setZone } = useGeoLocation();
  const { totalFavoritesCount } = useFavorites();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneOpen, setZoneOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const selectedZoneLabel = selectedZone ? (language === 'te' ? selectedZone.te : selectedZone.en) : 'Hyderabad';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const getRoleDisplayName = (r) => {
    if (r === 'retailer') return language === 'te' ? 'రిటైలర్' : 'Retailer';
    if (r === 'admin') return language === 'te' ? 'ఎక్సైజ్ అడ్మిన్' : 'Admin';
    if (r === 'customer') return language === 'te' ? 'కస్టమర్' : 'Customer';
    return r;
  };

  return (
    <header className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-sm transition-colors duration-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <AlcoRezIcon className="h-10 w-auto rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200" />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg leading-tight tracking-tight flex items-center">
                  <span className="text-amber-800 dark:text-amber-400 font-black">Alco</span>
                  <span className="text-stone-900 dark:text-stone-100 font-extrabold">Rez</span>
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide">
                  {t('nav.subTitle')}
                </span>
              </div>
            </Link>

            {/* Location Selector (Hyderabad Zones) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setZoneOpen(!zoneOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="max-w-[150px] truncate">{selectedZoneLabel.split(' (')[0]}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {zoneOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider">
                    {t('nav.permittedAreas')}
                  </div>
                  {HYDERABAD_ZONES.map((zone) => {
                    const label = language === 'te' ? zone.te : zone.en;
                    return (
                      <button
                        key={zone.id}
                        onClick={() => {
                          setZone(zone.id);
                          setZoneOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 dark:hover:bg-stone-800 hover:text-amber-900 dark:hover:text-amber-300 text-stone-700 dark:text-stone-300 flex items-center justify-between"
                      >
                        <span className="truncate pr-2">{label}</span>
                        {selectedZoneId === zone.id && <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md xl:max-w-xl mx-2 hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-100/80 dark:hover:bg-stone-800 focus:bg-white dark:focus:bg-stone-900 border border-stone-200 dark:border-stone-700 focus:border-amber-500 dark:focus:border-amber-400 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>

          {/* Right Navigation & Roles */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 transition"
                title={t('nav.languageToggle')}
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-bold">{language === 'en' ? 'EN' : 'తెలుగు'}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between ${
                      language === 'en'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <span className="text-amber-600 dark:text-amber-400">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('te');
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between ${
                      language === 'te'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span>తెలుగు (Telugu)</span>
                    {language === 'te' && <span className="text-amber-600 dark:text-amber-400">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-amber-300 transition"
              title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600 animate-in spin-in-180 duration-200" />
              )}
            </button>

            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 transition"
                title={t('nav.switchPersona')}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden lg:inline capitalize">
                  {isAuthenticated ? `${getRoleDisplayName(role)}: ${user?.full_name?.split(' ')[0]}` : t('nav.switchPersona')}
                </span>
                <span className="lg:hidden capitalize">
                  {getRoleDisplayName(role)}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-stone-100 dark:border-stone-800">
                    <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      {t('nav.currentActiveRole')}
                    </p>
                    <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                      {isAuthenticated ? user?.full_name : 'Guest Visitor'} ({getRoleDisplayName(role)})
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{user?.email}</p>
                  </div>

                  <div className="px-3 py-2">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">
                      {t('nav.quickDemoSwitcher')}
                    </p>
                    <div className="space-y-1">
                      {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => {
                        const accountLabel = DEMO_ACCOUNT_LABELS[key]?.[language] || acc.label;
                        return (
                          <button
                            key={key}
                            onClick={async () => {
                              await switchDemoAccount(key);
                              setProfileOpen(false);
                              if (key === 'retailer') navigate('/retailer');
                              else if (key === 'admin') navigate('/admin');
                              else navigate('/');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                              role === acc.role && user?.email === acc.email
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold'
                                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                          >
                            <span>{accountLabel}</span>
                            {role === acc.role && user?.email === acc.email && <span>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800 pt-1">
                    {isAuthenticated ? (
                      <button
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('nav.logout')}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setProfileOpen(false)}
                        className="block px-3 py-2 text-xs text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800 font-semibold"
                      >
                        {t('nav.signInCustom')}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Orders Navigation Link - Only visible to Customers */}
            {isAuthenticated && role === 'customer' && (
              <Link
                to="/orders"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-200 hover:text-amber-900 dark:hover:text-amber-300 bg-stone-50 dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition"
                title="Review previous and recent orders"
              >
                <Package className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span className="hidden sm:inline">{t('nav.orders')}</span>
              </Link>
            )}

            {/* Portal Links based on role */}
            {role === 'retailer' && (
              <Link
                to="/retailer"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition"
              >
                <Store className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                {t('nav.retailerPortal')}
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800 dark:hover:bg-stone-700 border border-stone-800 dark:border-stone-600 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                {t('nav.adminPortal')}
              </Link>
            )}

            {/* Favorites Navigation Link - Only visible to Customers */}
            {isAuthenticated && role === 'customer' && (
              <Link
                to="/favorites"
                className="relative p-2 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 border border-stone-200 dark:border-stone-700 transition flex items-center justify-center cursor-pointer group"
                title="Favorite spirits & stores"
                aria-label="Favorites"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20 group-hover:scale-110 transition-transform" />
                {totalFavoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
                    {totalFavoritesCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notification Center */}
            <NotificationCenter />

            {/* Direction 3 21+ Verified Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>21+ Verified</span>
            </div>

            {/* Cart Button with Direction 3 Quick-Drawer Trigger */}
            <button
              type="button"
              onClick={toggleDrawer}
              className="relative p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-stone-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 transition flex items-center justify-center cursor-pointer group"
              aria-label={t('nav.cart')}
              title={t('nav.cart')}
            >
              <ShoppingCart className="w-5 h-5 text-amber-900 dark:text-amber-300 group-hover:scale-105 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-amber-300 border border-stone-200 dark:border-stone-700"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDark ? t('nav.lightMode') : t('nav.darkMode')}</span>
                </button>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{language === 'en' ? 'తెలుగుకు మారండి' : 'Switch to EN'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-center font-medium">
                {t('nav.browseAll')}
              </Link>
              {isAuthenticated && role === 'customer' && (
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-center font-bold">
                  {t('nav.orders')}
                </Link>
              )}
              {isAuthenticated && role === 'customer' && (
                <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-lg text-center font-bold flex items-center justify-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                  <span>Favorites ({totalFavoritesCount})</span>
                </Link>
              )}
              {role === 'retailer' && (
                <Link to="/retailer" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-center font-medium">
                  {t('nav.retailerPortal')}
                </Link>
              )}
              {role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-center font-medium">
                  {t('nav.adminPortal')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

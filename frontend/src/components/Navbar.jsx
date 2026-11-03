import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingCart,
  ChevronDown,
  LogOut,
  LogIn,
  User,
  Menu,
  X,
  Package,
  Sun,
  Moon,
  Globe,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation as useGeoLocation, HYDERABAD_ZONES } from '../context/LocationContext';
import { useFavorites } from '../context/FavoritesContext';
import NotificationCenter from './NotificationCenter';
import { AlcoRezIcon } from './AlcoRezLogo';

export default function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { itemCount, toggleDrawer } = useCart();
  const { toggleTheme, isDark } = useTheme();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const { selectedZoneId, selectedZone, setZone } = useGeoLocation();
  const { totalFavoritesCount } = useFavorites();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const isAuthPage = routerLocation.pathname === '/login' || routerLocation.pathname === '/register';

  const [searchQuery, setSearchQuery] = useState('');
  const [zoneOpen, setZoneOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const zoneRef = useRef(null);
  const userMenuRef = useRef(null);

  const [mobileUserExpanded, setMobileUserExpanded] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (zoneRef.current && !zoneRef.current.contains(event.target)) {
        setZoneOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
    if (r === 'admin') return language === 'te' ? 'సూపర్ అడ్మిన్' : 'Super Admin';
    if (r === 'customer') return language === 'te' ? 'కస్టమర్' : 'Customer';
    return r;
  };

  return (
    <header className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 shadow-sm transition-colors duration-200 w-full relative z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <AlcoRezIcon className="h-8 sm:h-10 w-auto rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-200" />
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight flex items-center">
                  <span className="text-amber-800 dark:text-amber-400 font-black">Alco</span>
                  <span className="text-stone-900 dark:text-stone-100 font-extrabold">Rez</span>
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide hidden sm:block">
                  {t('nav.subTitle')}
                </span>
              </div>
            </Link>
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

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Permitted Service Area Button (Hyderabad Zones) */}
            <div className="relative hidden md:block" ref={zoneRef}>
              <button
                type="button"
                onClick={() => setZoneOpen(!zoneOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition cursor-pointer"
                title={t('nav.permittedAreas')}
                aria-expanded={zoneOpen}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="max-w-[120px] lg:max-w-[160px] truncate">{selectedZoneLabel.split(' (')[0]}</span>
                <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${zoneOpen ? 'rotate-180' : ''}`} />
              </button>

              {zoneOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 text-[11px] font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider border-b border-stone-100 dark:border-stone-800">
                    {t('nav.permittedAreas')}
                  </div>
                  <div className="py-1">
                    {HYDERABAD_ZONES.map((zone) => {
                      const label = language === 'te' ? zone.te : zone.en;
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => {
                            setZone(zone.id);
                            setZoneOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-amber-50 dark:hover:bg-stone-800 hover:text-amber-900 dark:hover:text-amber-300 text-stone-700 dark:text-stone-300 flex items-center justify-between cursor-pointer transition"
                        >
                          <span className="truncate pr-2">{label}</span>
                          {selectedZoneId === zone.id && <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-amber-300 transition flex items-center justify-center cursor-pointer shrink-0"
              title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600 animate-in spin-in-180 duration-200" />
              )}
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Cart Button with Quick-Drawer Trigger (Hidden for Admin, Retailer, and Auth Pages) */}
            {role !== 'admin' && role !== 'retailer' && !isAuthPage && (
              <button
                type="button"
                onClick={toggleDrawer}
                className="relative p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-stone-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 transition flex items-center justify-center cursor-pointer group shrink-0"
                aria-label={t('nav.cart')}
                title={t('nav.cart')}
              >
                <ShoppingCart className="w-4 h-4 text-amber-900 dark:text-amber-300 group-hover:scale-105 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] sm:text-[11px] font-black w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Name at Rightmost Side with Dropdown (or Login if guest) */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 transition cursor-pointer"
                  title={t('nav.languageToggle')}
                >
                  <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold hidden sm:inline">{language === 'en' ? 'EN' : 'తెలుగు'}</span>
                </button>

                {!isAuthPage && (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer shrink-0"
                    title={t('nav.login')}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('nav.login')}</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    if (!userMenuOpen) setMobileMenuOpen(false);
                  }}
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 shadow-xs transition cursor-pointer group shrink-0"
                  title="User Profile & Menu"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100 max-w-[65px] xs:max-w-[95px] sm:max-w-[140px] truncate leading-tight group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                      {user?.full_name?.split(' ')[0] || user?.full_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    {role && role !== 'customer' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 leading-none hidden sm:inline">
                        {getRoleDisplayName(role)}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-72 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-extrabold text-stone-900 dark:text-stone-100 truncate">
                        {user?.full_name || 'User'}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {user?.email}
                      </p>
                      {role && (
                        <span className="inline-block mt-1.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {getRoleDisplayName(role)}
                        </span>
                      )}
                    </div>

                    {/* Navigation Buttons: Orders & Favorites (Available for Customer and Super Admin) */}
                    {(role === 'customer' || role === 'admin') && (
                      <div className="py-1.5 space-y-0.5 border-b border-stone-100 dark:border-stone-800">
                        <Link
                          to="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-800 dark:hover:text-amber-300 rounded-xl mx-1.5 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                            <span>{t('nav.orders')}</span>
                          </div>
                          <span className="text-[10px] text-stone-400">→</span>
                        </Link>

                        <Link
                          to="/favorites"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl mx-1.5 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                            <span>{language === 'te' ? 'ఇష్టమైనవి' : 'Favorites'}</span>
                          </div>
                          {totalFavoritesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              {totalFavoritesCount}
                            </span>
                          )}
                        </Link>
                      </div>
                    )}

                    {/* Portal Links based on role */}
                    {(role === 'retailer' || role === 'admin') && (
                      <div className="py-1.5 border-b border-stone-100 dark:border-stone-800">
                        <Link
                          to="/retailer"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-800 dark:hover:text-amber-300 rounded-xl mx-1.5 transition"
                        >
                          <span>{t('nav.retailerPortal')}</span>
                          <span className="text-[10px] text-stone-400">→</span>
                        </Link>
                      </div>
                    )}

                    {role === 'admin' && (
                      <div className="py-1.5 border-b border-stone-100 dark:border-stone-800">
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-800 dark:hover:text-amber-300 rounded-xl mx-1.5 transition"
                        >
                          <span>{t('nav.adminPortal')}</span>
                          <span className="text-[10px] text-stone-400">→</span>
                        </Link>
                      </div>
                    )}

                    {/* Language Change Section */}
                    <div className="px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{language === 'te' ? 'భాష మార్చండి' : 'Change Language'}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            language === 'en'
                              ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 shadow-xs'
                              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          <span>English</span>
                          {language === 'en' && <span className="text-amber-600 dark:text-amber-400 text-xs font-black">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('te')}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                            language === 'te'
                              ? 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 shadow-xs'
                              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          <span>తెలుగు</span>
                          {language === 'te' && <span className="text-amber-600 dark:text-amber-400 text-xs font-black">✓</span>}
                        </button>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <div className="p-1.5 border-t border-stone-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (!mobileMenuOpen) setUserMenuOpen(false);
              }}
              className="md:hidden p-1.5 sm:p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
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

            {/* Mobile Auth action */}
            {!isAuthenticated ? (
              !isAuthPage && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('nav.login')}</span>
                </Link>
              )
            ) : (
              <div className="rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileUserExpanded(!mobileUserExpanded)}
                  className="w-full p-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition"
                  aria-expanded={mobileUserExpanded}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[180px]">
                        {user?.full_name || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 capitalize">
                        {getRoleDisplayName(role)}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${mobileUserExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible Mobile User Drawer Details */}
                {mobileUserExpanded && (
                  <div className="p-3 border-t border-stone-200/70 dark:border-stone-700/70 bg-white/60 dark:bg-stone-900/60 space-y-2 animate-in fade-in duration-150">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">Email: </span>
                      {user?.email}
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                        {getRoleDisplayName(role)} Account
                      </span>
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                          navigate('/login');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-center font-medium">
                {t('nav.browseAll')}
              </Link>
              {isAuthenticated && (role === 'customer' || role === 'admin') && (
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-center font-bold">
                  {t('nav.orders')}
                </Link>
              )}
              {isAuthenticated && (role === 'customer' || role === 'admin') && (
                <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-lg text-center font-bold flex items-center justify-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                  <span>Favorites ({totalFavoritesCount})</span>
                </Link>
              )}
              {(role === 'retailer' || role === 'admin') && (
                <Link to="/retailer" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-lg text-center font-medium">
                  {t('nav.retailerPortal')}
                </Link>
              )}
              {role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-center font-bold">
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

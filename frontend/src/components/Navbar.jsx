import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingCart,
  User as UserIcon,
  Wine,
  Shield,
  Store,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Sparkles,
  Package
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const HYDERABAD_ZONES = [
  'Madhapur & HITEC City (500081)',
  'Jubilee Hills (500033)',
  'Banjara Hills (500034)',
  'Gachibowli (500032)',
  'Kondapur (500084)'
];

export default function Navbar() {
  const { user, role, isAuthenticated, logout, switchDemoAccount } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedZone, setSelectedZone] = useState(HYDERABAD_ZONES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneOpen, setZoneOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-[33px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center text-white shadow-md shadow-amber-800/20 group-hover:scale-105 transition">
                <Wine className="w-5 h-5 text-amber-200" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-stone-900 leading-tight tracking-tight flex items-center gap-1.5">
                  Telangana Liquor
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                    MARKET
                  </span>
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wide">
                  Licensed Retail Discovery Portal
                </span>
              </div>
            </Link>

            {/* Location Selector (Hyderabad Zones) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setZoneOpen(!zoneOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 border border-stone-200 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span className="max-w-[150px] truncate">{selectedZone.split(' (')[0]}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {zoneOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-stone-400 tracking-wider">
                    Permitted Service Areas
                  </div>
                  {HYDERABAD_ZONES.map((zone) => (
                    <button
                      key={zone}
                      onClick={() => {
                        setSelectedZone(zone);
                        setZoneOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 hover:text-amber-900 text-stone-700 flex items-center justify-between"
                    >
                      <span>{zone}</span>
                      {selectedZone === zone && <span className="text-amber-600 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-2 hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium whisky, wine, beer, gin, vodka..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-stone-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>

          {/* Right Navigation & Roles */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 transition"
                title="Switch demo persona"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden lg:inline capitalize">
                  {isAuthenticated ? `${role}: ${user?.full_name?.split(' ')[0]}` : 'Switch Persona'}
                </span>
                <span className="lg:hidden capitalize">
                  {role}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-stone-100">
                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Current Active Role
                    </p>
                    <p className="text-xs font-semibold text-stone-900 mt-0.5">
                      {isAuthenticated ? user?.full_name : 'Guest Visitor'} ({role})
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                  </div>

                  <div className="px-3 py-2">
                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                      Quick Demo Switcher
                    </p>
                    <div className="space-y-1">
                      {Object.entries(DEMO_ACCOUNTS).map(([key, acc]) => (
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
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span>{acc.label}</span>
                          {role === acc.role && user?.email === acc.email && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-1">
                    {isAuthenticated ? (
                      <button
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log out
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        onClick={() => setProfileOpen(false)}
                        className="block px-3 py-2 text-xs text-amber-800 hover:bg-amber-50 font-semibold"
                      >
                        Sign in with custom credentials
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-amber-900 bg-stone-50 hover:bg-amber-50 border border-stone-200 transition"
                title="Review previous and recent orders"
              >
                <Package className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Orders</span>
              </Link>
            )}

            {/* Portal Links based on role */}
            {role === 'retailer' && (
              <Link
                to="/retailer"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition"
              >
                <Store className="w-3.5 h-3.5 text-amber-700" />
                Retailer Portal
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Excise Admin
              </Link>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-stone-800 border border-amber-200/80 transition flex items-center justify-center"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-amber-900" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-stone-200 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search beverages..."
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-stone-100 border border-stone-200 outline-none"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 rounded-lg text-center font-medium">Browse All Products</Link>
              {isAuthenticated && role === 'customer' && (
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-center font-bold">Previous Orders</Link>
              )}
              {role === 'retailer' && (
                <Link to="/retailer" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 rounded-lg text-center font-medium">Retailer Portal</Link>
              )}
              {role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="p-2 bg-stone-100 rounded-lg text-center font-medium">Admin Portal</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

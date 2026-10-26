import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import RetailerCard from '../components/RetailerCard';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, prods, rets] = await Promise.all([
          api.getCategories(),
          api.getProducts({ limit: 8 }),
          api.getRetailers(),
        ]);
        setCategories(cats || []);
        setFeaturedProducts(prods?.items || []);
        setRetailers(rets || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 p-6 sm:p-10 lg:p-14 border border-amber-900/40 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Telangana Excise Compliant Discovery
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Discover Premium Spirits & Verified <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Wine Retailers</span> in Telangana
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Explore authentic beverage catalogues, check bottle sizes and demonstration pricing, and verify authorized A4 retail wine shops across Hyderabad.
          </p>

          {/* Demonstration Notice Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-xs text-amber-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Statutory & Prototype Disclosure:</strong>
              Commercial alcohol sales and doorstep delivery are strictly regulated under the Telangana Excise Act.
              This platform provides catalog discovery and simulated demonstration checkouts only.
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <span>Explore Full Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/compliance-info"
              className="py-3 px-6 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2"
            >
              <span>Legal Guidelines</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Navigation Horizontal Scroll / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Browse by Category</h2>
            <p className="text-xs text-stone-500 font-medium">Curated alcoholic beverage categories</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-amber-50 overflow-hidden mb-2 group-hover:scale-105 transition">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=300&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-xs text-stone-900 group-hover:text-amber-800 transition line-clamp-1">
                {cat.name.split(' & ')[0]}
              </span>
              <span className="text-[10px] text-stone-400 mt-0.5">Explore</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Licensed Retailers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Verified Wine Retailers</h2>
              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                A4 Excise License
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Officially gazetted retail wine outlets in Hyderabad</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
            All Retailers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {retailers.map((ret) => (
            <RetailerCard key={ret.id} retailer={ret} />
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Popular Brands & Malts</h2>
              <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                Mock Demonstrative Data
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Trending selections with verified retailer availability</p>
          </div>
          <Link to="/products" className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
            See More <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-200 h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Compliance Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="text-amber-800 font-extrabold text-xs uppercase tracking-widest">
              Security & Regulatory Framework
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">
              Built on Telangana Excise Compliance Principles
            </h2>
            <p className="text-xs text-stone-500">
              Our platform adheres strictly to the legal landscape governing alcoholic beverages in Telangana State.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-stone-800">
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                21+
              </div>
              <h3 className="font-bold text-sm text-stone-900">Statutory Age Verification</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Automated age verification barriers enforce the mandatory 21+ legal purchasing age under Telangana Excise rules.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                A4
              </div>
              <h3 className="font-bold text-sm text-stone-900">Strict License Verification</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Only wine shops possessing valid A4 excise licenses issued by the Telangana Prohibition & Excise Department can publish inventory.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                0₹
              </div>
              <h3 className="font-bold text-sm text-stone-900">Simulated Safe Checkout</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Live payments and physical home delivery are completely disabled by default until explicit regulatory sanction is granted.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

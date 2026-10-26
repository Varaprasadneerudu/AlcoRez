import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function ProductCard({ product }) {

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image & Badges */}
      <Link to={`/products/${product.id}`} className="block relative aspect-square bg-stone-50 overflow-hidden">
        <img
          src={product.primary_image_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Demo Label badge */}
        <span className="absolute top-2.5 left-2.5 bg-amber-500/90 text-stone-950 font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
          DEMO
        </span>

        {/* ABV badge */}
        {product.alcohol_by_volume && (
          <span className="absolute top-2.5 right-2.5 bg-stone-900/80 text-amber-300 font-semibold text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
            {product.alcohol_by_volume}
          </span>
        )}

        {/* Stock Badge */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center">
            <span className="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-md">
              Out of Stock at Verified Retailers
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold text-amber-800 uppercase tracking-wider text-[10px]">
              {product.brand}
            </span>
            <span className="text-[11px] bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
              {product.category_name || 'Spirits'}
            </span>
          </div>

          <Link to={`/products/${product.id}`} className="block group-hover:text-amber-800 transition">
            <h3 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Sizes chips */}
          {product.available_sizes && product.available_sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.available_sizes.map((sz) => (
                <span key={sz} className="text-[10px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                  {sz}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 block">Demonstration Price</span>
            <span className="font-extrabold text-stone-900 text-base">
              {product.starting_price ? `₹${Number(product.starting_price).toLocaleString('en-IN')}` : 'Price on request'}
            </span>
          </div>

          <Link
            to={`/products/${product.id}`}
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 font-semibold text-xs border border-amber-200 transition flex items-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

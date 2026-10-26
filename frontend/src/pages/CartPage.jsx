import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldAlert,
  Store,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cart, itemCount, subtotal, updateQuantity, removeItem, clearCart, loading } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Sign in to view your cart</h2>
        <p className="text-xs text-stone-500">
          Use custom credentials or choose a quick demo persona from the top navigation bar.
        </p>
        <Link
          to="/login"
          className="inline-block py-2.5 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Your cart is empty</h2>
        <p className="text-xs text-stone-500">
          Explore authentic alcoholic beverages from licensed wine retailers across Telangana.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow"
          >
            <span>Discover Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 transition"
          >
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Review Previous Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {itemCount} item(s) selected for simulated demonstration checkout
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/orders"
            className="text-xs font-semibold text-stone-700 hover:text-amber-900 bg-stone-100 hover:bg-amber-50 border border-stone-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
            title="Review past and recent orders"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Previous Orders</span>
          </Link>

          <button
            onClick={clearCart}
            disabled={loading}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition px-2.5 py-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center p-2 shrink-0">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=200&q=80'}
                    alt={item.product_name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-amber-800 uppercase tracking-wider">
                      {item.brand}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                      {item.bottle_size}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 mt-0.5">{item.product_name}</h3>
                  
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3 text-stone-400" />
                    {item.retailer_name}
                  </p>
                </div>
              </div>

              {/* Quantity controls & Price */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={loading}
                    className="p-1.5 text-stone-600 hover:bg-stone-200 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-stone-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={loading || item.quantity >= 10}
                    className="p-1.5 text-stone-600 hover:bg-stone-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-400 block font-normal">Total</span>
                  <span className="font-extrabold text-sm text-stone-900">
                    ₹{Number(item.total_price).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  disabled={loading}
                  className="p-2 text-stone-400 hover:text-red-600 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Demonstration Notice */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">Statutory Prototype Information:</p>
              <p className="leading-relaxed text-[11px] text-amber-800">
                {cart.compliance_disclaimer}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary & Simulated Checkout */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-sm">
          <h2 className="font-extrabold text-base text-stone-900 pb-3 border-b border-stone-100">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-stone-600">
              <span>Item Subtotal</span>
              <span className="font-bold text-stone-900">₹{Number(subtotal).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-stone-600">
              <span className="flex items-center gap-1">
                Home Delivery Fee
                <span className="text-[10px] bg-stone-100 text-stone-600 px-1 rounded">Disabled</span>
              </span>
              <span className="font-bold text-emerald-700">₹0.00</span>
            </div>

            <div className="flex items-center justify-between text-stone-600">
              <span>Excise & Statutory Cess</span>
              <span className="font-bold text-stone-900">₹0.00 (Demo)</span>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-sm">
              <span className="font-bold text-stone-900">Total Demonstration Value</span>
              <span className="font-extrabold text-lg text-amber-900">
                ₹{Number(subtotal).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <Link
            to="/checkout-demo"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-700/20 flex items-center justify-center gap-2 transition"
          >
            <span>Proceed to Simulated Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-stone-400 text-center leading-normal">
            No actual payment will be deducted. A test simulated order will be created in your account.
          </p>
        </div>

      </div>
    </div>
  );
}

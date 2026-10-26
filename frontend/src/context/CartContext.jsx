import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, role } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || role !== 'customer') {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (inventoryId, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your cart.');
    }
    setLoading(true);
    try {
      const updated = await api.addToCart(inventoryId, quantity);
      setCart(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    try {
      const updated = await api.updateCartItem(itemId, quantity);
      setCart(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    setLoading(true);
    try {
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await api.clearCart();
      setCart(prev => prev ? { ...prev, items: [], item_count: 0, subtotal: '0.00', total_amount: '0.00' } : null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.item_count || 0,
        subtotal: cart?.subtotal || '0.00',
        loading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

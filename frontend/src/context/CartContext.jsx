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
    // Cart is strictly reserved for Customer accounts
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

  const addToCart = async (inventoryId, quantity = 1, metadata = {}) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to your cart.');
    }

    // Capture previous state for rollback on error
    const prevCart = cart;

    // Optimistic UI calculation (instant 0ms update)
    const prevItems = prevCart?.items ? [...prevCart.items] : [];
    const existingIndex = prevItems.findIndex((it) => it.inventory_id === inventoryId);

    let updatedItems;
    if (existingIndex >= 0) {
      const existing = prevItems[existingIndex];
      const newQty = existing.quantity + quantity;
      const unitP = Number(existing.unit_price) || Number(metadata.price) || 0;
      updatedItems = [...prevItems];
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQty,
        total_price: (unitP * newQty).toFixed(2)
      };
    } else {
      const unitP = Number(metadata.price || metadata.matchedInventory?.price || metadata.product?.starting_price || 0);
      const newItem = {
        id: `optimistic_${inventoryId}`,
        inventory_id: inventoryId,
        product_id: metadata.productId || metadata.product?.id || '',
        product_name: metadata.productName || metadata.product?.name || 'Selected Item',
        brand: metadata.brand || metadata.product?.brand || '',
        bottle_size: metadata.bottleSize || metadata.selectedSize || metadata.matchedInventory?.bottle_size || '',
        unit_price: unitP.toFixed(2),
        quantity: quantity,
        total_price: (unitP * quantity).toFixed(2),
        image_url: metadata.imageUrl || metadata.product?.primary_image_url || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=300&q=80',
        retailer_id: metadata.retailerId || metadata.matchedInventory?.retailer_id || '',
        retailer_name: metadata.retailerName || metadata.matchedInventory?.retailer_name || '',
        is_available: true
      };
      updatedItems = [...prevItems, newItem];
    }

    const newSubtotal = updatedItems
      .reduce((sum, it) => sum + (Number(it.total_price) || 0), 0)
      .toFixed(2);
    const newItemCount = updatedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

    const optimisticCart = {
      ...(prevCart || {
        id: 'cart_local',
        user_id: 'current',
        delivery_fee: '0.00',
        taxes: '0.00',
        is_demo_cart: true
      }),
      items: updatedItems,
      subtotal: newSubtotal,
      total_amount: newSubtotal,
      item_count: newItemCount
    };

    // Instant local state update
    setCart(optimisticCart);
    setError(null);

    // Sync with backend asynchronously
    try {
      const updated = await api.addToCart(inventoryId, quantity);
      setCart(updated);
      return updated;
    } catch (err) {
      // Revert optimistic state on server rejection
      setCart(prevCart);
      setError(err.message);
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    const prevCart = cart;
    if (!prevCart) return;

    let updatedItems;
    if (quantity <= 0) {
      updatedItems = prevCart.items.filter((it) => it.id !== itemId && it.inventory_id !== itemId);
    } else {
      updatedItems = prevCart.items.map((it) => {
        if (it.id === itemId || it.inventory_id === itemId) {
          const unitP = Number(it.unit_price) || 0;
          return {
            ...it,
            quantity,
            total_price: (unitP * quantity).toFixed(2)
          };
        }
        return it;
      });
    }

    const newSubtotal = updatedItems
      .reduce((sum, it) => sum + (Number(it.total_price) || 0), 0)
      .toFixed(2);
    const newItemCount = updatedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

    const optimisticCart = {
      ...prevCart,
      items: updatedItems,
      subtotal: newSubtotal,
      total_amount: newSubtotal,
      item_count: newItemCount
    };

    // Instant local state update
    setCart(optimisticCart);
    setError(null);

    try {
      const realItem = prevCart.items.find((it) => it.id === itemId || it.inventory_id === itemId);
      const targetId = realItem && !String(realItem.id).startsWith('optimistic_') ? realItem.id : itemId;
      const updated = await api.updateCartItem(targetId, quantity);
      setCart(updated);
      return updated;
    } catch (err) {
      setCart(prevCart);
      setError(err.message);
      throw err;
    }
  };

  const removeItem = async (itemId) => {
    const prevCart = cart;
    if (!prevCart) return;

    const updatedItems = prevCart.items.filter((it) => it.id !== itemId && it.inventory_id !== itemId);
    const newSubtotal = updatedItems
      .reduce((sum, it) => sum + (Number(it.total_price) || 0), 0)
      .toFixed(2);
    const newItemCount = updatedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

    const optimisticCart = {
      ...prevCart,
      items: updatedItems,
      subtotal: newSubtotal,
      total_amount: newSubtotal,
      item_count: newItemCount
    };

    // Instant local state update
    setCart(optimisticCart);
    setError(null);

    try {
      const realItem = prevCart.items.find((it) => it.id === itemId || it.inventory_id === itemId);
      const targetId = realItem && !String(realItem.id).startsWith('optimistic_') ? realItem.id : itemId;
      const updated = await api.removeCartItem(targetId);
      setCart(updated);
      return updated;
    } catch (err) {
      setCart(prevCart);
      setError(err.message);
      throw err;
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => {
    if (role === 'admin' || role === 'retailer') return;
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => {
    if (role === 'admin' || role === 'retailer') return;
    setIsDrawerOpen(prev => !prev);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.item_count || 0,
        subtotal: cart?.subtotal || '0.00',
        loading,
        error,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
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

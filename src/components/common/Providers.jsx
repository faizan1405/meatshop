'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem('porville_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart items', e);
      }
    }
    const savedCoupon = localStorage.getItem('porville_coupon');
    if (savedCoupon) {
      try {
        setCoupon(JSON.parse(savedCoupon));
      } catch (e) {
        console.error('Failed to parse coupon', e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('porville_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  // Save coupon to localStorage when it changes
  useEffect(() => {
    if (isMounted) {
      if (coupon) {
        localStorage.setItem('porville_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('porville_coupon');
      }
    }
  }, [coupon, isMounted]);

  const addToCart = (product, variant, quantity = 1) => {
    if (product.priceType === 'on_call' || product.purchaseMode === 'on_call') {
      alert('This product can only be ordered by phone. Call 9217577006 to place an order.');
      return;
    }
    setCartItems((prev) => {
      // Find if item with same variant already exists
      const existingIndex = prev.findIndex(
        (item) => item.product._id === product._id && item.variant.name === variant.name
      );

      if (existingIndex > -1) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      }

      return [...prev, { product, variant, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, variantName) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product._id === productId && item.variant.name === variantName))
    );
  };

  const updateQuantity = (productId, variantName, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantName);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product._id === productId && item.variant.name === variantName
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
  };

  const itemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const itemsSubtotal = cartItems.reduce((acc, item) => {
    const price = item.variant.salePrice || item.variant.price;
    return acc + price * item.quantity;
  }, 0);

  const discountAmount = coupon
    ? coupon.discountType === 'percentage'
      ? Math.min((itemsSubtotal * coupon.discountValue) / 100, coupon.maxDiscountValue || Infinity)
      : coupon.discountValue
    : 0;

  // site settings fallback charges (delivery note can override these via state later)
  const deliveryThreshold = 500;
  const deliveryChargeValue = 50;
  const deliveryCharge = itemsSubtotal >= deliveryThreshold || itemsSubtotal === 0 ? 0 : deliveryChargeValue;

  const orderTotal = Math.max(itemsSubtotal - discountAmount + deliveryCharge, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        coupon,
        setCoupon,
        itemsCount,
        itemsSubtotal,
        discountAmount,
        deliveryCharge,
        orderTotal,
        isMounted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}

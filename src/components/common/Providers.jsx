'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

const CartContext = createContext(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

const CART_STORAGE_KEY = 'porville_cart';
const COUPON_STORAGE_KEY = 'porville_coupon';
// Email of the logged-in user the local cart is currently synced to. Lets us
// tell a genuine guest cart (to be merged on login) apart from a cached copy of
// an already-synced server cart (which must NOT be merged again, or quantities
// would double on every refresh).
const CART_OWNER_KEY = 'porville_cart_owner';

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const [cartItems, setCartItems] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // True once we've completed the initial server load/merge for this session.
  const [serverSynced, setServerSynced] = useState(false);

  // Live ref so async sync logic reads the latest cart without stale closures.
  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const persistTimer = useRef(null);

  // 1. Hydrate cart + coupon from localStorage on mount (guest cart & offline cache).
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch (e) {
      console.error('Failed to parse cart items', e);
    }
    try {
      const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
    } catch (e) {
      console.error('Failed to parse coupon', e);
    }
  }, []);

  // 2. Mirror cart to localStorage whenever it changes (guest persistence + cache).
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  // 3. Save coupon to localStorage when it changes.
  useEffect(() => {
    if (isMounted) {
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    }
  }, [coupon, isMounted]);

  // 4. On login, merge a guest cart into the server (once) and make the server
  //    cart the source of truth. On logout, stop server sync but keep the local
  //    cart visible (it stays saved on the server and restores on next login).
  useEffect(() => {
    if (!isMounted) return;

    if (status === 'unauthenticated') {
      setServerSynced(false);
      return;
    }

    if (status !== 'authenticated' || serverSynced) return;

    const email = session?.user?.email;
    if (!email) return;

    let cancelled = false;

    const syncWithServer = async () => {
      let owner = null;
      try {
        owner = localStorage.getItem(CART_OWNER_KEY);
      } catch {
        owner = null;
      }
      const localItems = cartItemsRef.current;

      try {
        let data;
        if (owner == null && localItems.length > 0) {
          // Genuine guest cart present before login → merge it into the server cart.
          const res = await fetch('/api/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: localItems }),
          });
          data = await res.json();
        } else {
          // Refresh of an already-synced cart, a different user's stale cache, or
          // no guest items → the server cart is authoritative.
          const res = await fetch('/api/cart');
          data = await res.json();
        }

        if (!cancelled && data?.success && Array.isArray(data.items)) {
          setCartItems(data.items);
        }
      } catch (e) {
        console.error('Failed to sync cart with server', e);
      } finally {
        if (!cancelled) {
          try {
            localStorage.setItem(CART_OWNER_KEY, email);
          } catch {
            /* ignore storage errors */
          }
          setServerSynced(true);
        }
      }
    };

    syncWithServer();

    return () => {
      cancelled = true;
    };
  }, [status, session, isMounted, serverSynced]);

  // 5. While logged in and synced, persist cart changes to MongoDB (debounced so
  //    rapid quantity clicks collapse into a single, last-write-wins update).
  useEffect(() => {
    if (!isMounted) return;
    if (status !== 'authenticated' || !serverSynced) return;

    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItemsRef.current }),
      }).catch((e) => console.error('Failed to persist cart', e));
    }, 350);

    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [cartItems, status, serverSynced, isMounted]);

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
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
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

  // Clears the cart everywhere. Only called after a successfully verified order.
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCoupon(null);
    if (status === 'authenticated' && serverSynced) {
      fetch('/api/cart', { method: 'DELETE' }).catch((e) =>
        console.error('Failed to clear server cart', e)
      );
    }
  }, [status, serverSynced]);

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

  // Delivery: free above ₹770, otherwise ₹40
  const deliveryThreshold = 770;
  const deliveryChargeValue = 40;
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

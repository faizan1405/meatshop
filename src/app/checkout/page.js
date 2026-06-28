'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShieldCheck, CreditCard, ShoppingBag, PlusCircle, AlertCircle } from 'lucide-react';
import { useCart } from '@/components/common/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const {
    cartItems,
    itemsSubtotal,
    discountAmount,
    deliveryCharge,
    orderTotal,
    coupon,
    clearCart,
    isMounted,
  } = useCart();

  // Saved Addresses list for authenticated customers
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(true);

  // Shipping Address fields state
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });

  // Guest details state
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Dynamically Load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // safe cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // 2. Fetch User Saved Addresses
  useEffect(() => {
    if (session?.user) {
      fetch('/api/addresses')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            setSelectedAddressId(data.addresses[0]._id);
            setIsAddingNewAddress(false);
            // Autofill form
            setAddressForm(data.addresses[0]);
          }
        })
        .catch((err) => console.error('Error fetching addresses:', err));
    }
  }, [session]);

  if (!isMounted) return null;

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setIsAddingNewAddress(false);
    setAddressForm(addr);
    setErrorMessage('');
  };

  const handleToggleAddNewAddress = () => {
    setIsAddingNewAddress(true);
    setSelectedAddressId('');
    setAddressForm({
      name: session?.user?.name || '',
      phone: '',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Form Validation
  const validateForm = () => {
    if (!addressForm.name || !addressForm.phone || !addressForm.streetAddress || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      return 'Please fill in all shipping address fields.';
    }
    if (addressForm.phone.length < 10) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    if (addressForm.postalCode.length < 6) {
      return 'Please enter a valid 6-digit postal code.';
    }
    if (!session && !guestEmail) {
      return 'Please enter your email for guest checkout.';
    }
    return null;
  };

  // Trigger Razorpay Payment & Order Creation
  const handlePayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Razorpay order on server
      const res = await fetch('/api/orders/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cartItems, 
          couponCode: coupon?.code || '' 
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize payment order');
      }

      const order = orderData.order;

      // 2. Open Razorpay Checkout modal
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_7f5U1G53q78bUe'; // Fallback to public test key
      
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Porville',
        description: 'Fresh Cuts Pure Standards Order',
        order_id: order.id,
        handler: async function (response) {
          try {
            setIsSubmitting(true);
            setErrorMessage('Verifying payment, please do not close the window...');

            // 3. Send payment details to verification endpoint
            const verifyRes = await fetch('/api/orders/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                cartItems,
                shippingAddress: addressForm,
                couponCode: coupon?.code || '',
                itemsSubtotal,
                discountAmount,
                deliveryCharge,
                orderTotal,
                isGuest: !session,
                guestInfo: !session ? {
                  name: addressForm.name,
                  email: guestEmail,
                  phone: addressForm.phone,
                } : null,
                userEmail: session?.user?.email || null,
              }),
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              clearCart();
              router.push(`/order-success?orderId=${verifyData.orderId}`);
            } else {
              setErrorMessage(verifyData.message || 'Payment verification failed. Please contact support.');
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error(err);
            setErrorMessage('An error occurred during payment verification. Please check your emails or support.');
            setIsSubmitting(false);
          }
        },
        prefill: {
          name: addressForm.name,
          contact: addressForm.phone,
          email: session?.user?.email || guestEmail,
        },
        theme: {
          color: '#0c0b0a',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            setErrorMessage('Payment process was cancelled.');
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Check your network connection.');
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to process checkout');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <main className={styles.checkoutContainer}>
        <div className="container">
          <h1 className={styles.title}>Confirm Your Order</h1>

          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <ShoppingBag size={48} style={{ color: 'var(--text-dark-muted)', marginBottom: '15px' }} />
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.4rem', color: 'var(--text-dark)' }}>
                Your cart is empty
              </h2>
              <p>Please add products to your cart before proceeding to checkout.</p>
              <button onClick={() => router.push('/shop')} className="btn-primary" style={{ marginTop: '15px' }}>
                Go to Shop
              </button>
            </div>
          ) : (
            <div className={styles.layout}>
              
              {/* Shipping Details form */}
              <div className={styles.formSection}>
                
                {/* Auth / Guest Selection */}
                {!session && authStatus !== 'loading' && (
                  <div className={styles.card} style={{ borderLeft: '3px solid var(--primary-gold)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <h4 style={{ fontWeight: 700 }}>Checking out as Guest</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-muted)' }}>
                          Log in to save multiple addresses and track orders in one place.
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push(`/login?callbackUrl=/checkout`)}
                        className="btn-primary btn-secondary" 
                        style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                      >
                        Log in with Google
                      </button>
                    </div>
                  </div>
                )}

                {/* Shipping address cards / input */}
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Shipping Address</h2>
                  
                  {/* Saved Addresses (Logged in only) */}
                  {session && savedAddresses.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Select from Saved Addresses</h4>
                      <div className={styles.addressGrid}>
                        {savedAddresses.map((addr) => (
                          <div
                            key={addr._id}
                            className={`${styles.savedAddressCard} ${selectedAddressId === addr._id && !isAddingNewAddress ? styles.savedAddressCardActive : ''}`}
                            onClick={() => handleSelectSavedAddress(addr)}
                          >
                            <div className={styles.addressName}>{addr.name}</div>
                            <div className={styles.addressDetails}>
                              {addr.streetAddress}<br />
                              {addr.city}, {addr.state} - {addr.postalCode}<br />
                              Phone: {addr.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={handleToggleAddNewAddress} 
                        className="btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <PlusCircle size={14} />
                        <span>Add New Address</span>
                      </button>
                    </div>
                  )}

                  {/* Address input fields */}
                  {(isAddingNewAddress || !session) && (
                    <form className={styles.formGrid}>
                      {!session && (
                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                          <label>Email Address (For Order Tracking)</label>
                          <input
                            type="email"
                            placeholder="Enter your email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className={styles.formGroup}>
                        <label>Receiver Name</label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Full Name"
                          value={addressForm.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Mobile Number</label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="10-digit number"
                          value={addressForm.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>Street Address (House No, Building, Area)</label>
                        <input
                          type="text"
                          name="streetAddress"
                          placeholder="D-1b/1028, Sangam Vihar"
                          value={addressForm.streetAddress}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>PIN Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          placeholder="110080"
                          value={addressForm.postalCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Country</label>
                        <input
                          type="text"
                          name="country"
                          value={addressForm.country}
                          disabled
                        />
                      </div>
                    </form>
                  )}

                </div>
              </div>

              {/* Order summary / Payment panel */}
              <div className={styles.summarySection}>
                <div className={styles.card} style={{ backgroundColor: 'var(--white)', borderTop: '2px solid var(--primary-gold)' }}>
                  <h2 className={styles.cardTitle}>Order Summary</h2>
                  
                  {/* Small cart items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {cartItems.map((item) => {
                      const itemPrice = item.variant.salePrice || item.variant.price;
                      return (
                        <div key={`${item.product._id}-${item.variant.name}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>
                            {item.product.name} ({item.variant.name}) <strong>x{item.quantity}</strong>
                          </span>
                          <span style={{ fontWeight: 600 }}>₹{itemPrice * item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.row} style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                    <span>Subtotal</span>
                    <span>₹{itemsSubtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className={styles.row} style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--success)' }}>
                      <span>Coupon Discount ({coupon?.code})</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className={styles.row} style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                    <span>Delivery Charges</span>
                    <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                  </div>

                  <div className={styles.totalRow} style={{ marginBottom: '20px' }}>
                    <span>Order Total</span>
                    <span style={{ color: 'var(--text-dark)' }}>₹{orderTotal}</span>
                  </div>

                  {errorMessage && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--error)', backgroundColor: '#ffebee', padding: '12px', borderRadius: 'var(--border-radius-sm)', marginBottom: '15px', fontSize: '0.85rem' }}>
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button 
                    onClick={handlePayment} 
                    className={`${styles.paymentBtn} btn-gold`}
                    disabled={isSubmitting}
                  >
                    <CreditCard size={18} />
                    <span>{isSubmitting ? 'Processing Payment...' : `Verify & Pay ₹${orderTotal}`}</span>
                  </button>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', color: 'var(--text-dark-muted)', fontSize: '0.7rem', marginTop: '15px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                    <span>Secure Payment processed via Razorpay</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

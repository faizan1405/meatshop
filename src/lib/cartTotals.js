// ===========================================================================
// SINGLE SOURCE OF TRUTH for cart / checkout / order totals.
//
// Every place that needs a subtotal, discount, delivery charge or grand total
// — the cart drawer, cart page, checkout page, Razorpay order creation, payment
// verification and demo orders — should go through calculateCartTotals() so the
// amount the customer SEES always equals the amount the server CHARGES and later
// records in the database.
//
// It fixes a real bug that showed a ₹1 product as ₹10: the old code used
// `variant.salePrice || variant.price`, which blindly trusts salePrice even when
// it is 0 or (mis-entered) GREATER than the real price. We now derive the price
// through variantPrice() — the same rule the product cards use — so an inverted
// or empty sale price can never inflate the total.
//
// ---------------------------------------------------------------------------
// OPTIONAL TESTING SWITCH: delivery charges can be temporarily disabled for
// payment testing. Delivery is ENABLED by default (the switch is off); it only
// turns off when DISABLE_DELIVERY_CHARGE_FOR_TESTING is explicitly set to
// 'true'. While disabled, the delivery fee is forced to 0 in the cart,
// checkout, order creation and Razorpay amount, and the free delivery threshold
// behaves as 0.
//
// This never removes or modifies any delivery settings: the admin fields
// (deliveryCharge / freeDeliveryThreshold) and the DB values are untouched and
// always resolved below — they are only bypassed while the switch is on. Keep
// the flag system in place for future testing; to disable delivery again, set
// the env flag(s) to 'true'.
// ===========================================================================

import { variantPrice } from './pricing';
import { resolveDeliveryConfig, computeDeliveryCharge } from './delivery';

// Env-controlled testing switch. NEXT_PUBLIC_* is read first so the browser cart
// and the server agree; on the client only the NEXT_PUBLIC_ value is inlined.
// Defaults to `false` (delivery ENABLED) so production is safe even when the
// flag is not set — it is only disabled when explicitly set to the string 'true'.
const envFlag =
  process.env.NEXT_PUBLIC_DISABLE_DELIVERY_CHARGE_FOR_TESTING ??
  process.env.DISABLE_DELIVERY_CHARGE_FOR_TESTING;

export const DELIVERY_DISABLED_FOR_TESTING = envFlag === 'true';

/**
 * Coupon discount for a given subtotal. Handles both discount types and
 * respects the coupon's minimum order value and (for percentage coupons) its
 * maximum discount cap. The result is clamped to [0, subtotal] so a discount can
 * never push a total negative.
 */
export function computeCouponDiscount(subtotal, coupon) {
  if (!coupon || !subtotal || subtotal <= 0) return 0;

  const value = Number(coupon.discountValue) || 0;
  const minOrder = Number(coupon.minOrderValue) || 0;
  if (subtotal < minOrder) return 0;

  let discount;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * value) / 100;
    const cap = Number(coupon.maxDiscountValue);
    if (Number.isFinite(cap) && cap > 0) discount = Math.min(discount, cap);
  } else {
    // 'flat' (or anything non-percentage) → a fixed rupee amount.
    discount = value;
  }

  return Math.min(Math.max(discount, 0), subtotal);
}

/**
 * The one function that computes cart/checkout/order totals.
 *
 * @param {Object}   opts
 * @param {Array}    opts.items    Cart items shaped `{ variant, quantity }`.
 * @param {Object}   opts.settings SiteSettings doc (for delivery config). Optional.
 * @param {Object}   opts.coupon   Applied coupon (used only when `discount` is not
 *                                  passed explicitly). Optional.
 * @param {number}   opts.discount Pre-computed discount. When provided it wins
 *                                  over `coupon` (lets a server route pass its own
 *                                  DB-validated discount).
 * @param {boolean}  opts.disableDeliveryForTesting  Defaults to the env flag.
 *
 * @returns {{ subtotal:number, deliveryCharge:number, deliveryFee:number,
 *            discount:number, total:number, freeDeliveryThreshold:number,
 *            deliveryDisabledForTesting:boolean }}
 */
export function calculateCartTotals({
  items = [],
  settings = null,
  coupon = null,
  discount,
  disableDeliveryForTesting = DELIVERY_DISABLED_FOR_TESTING,
} = {}) {
  const list = Array.isArray(items) ? items : [];

  // Bug fix: price a line via variantPrice() (ignores 0 / inverted sale prices)
  // instead of the old `salePrice || price`.
  const subtotal = list.reduce((acc, item) => {
    const price = variantPrice(item?.variant);
    const qty = Math.max(0, Math.floor(Number(item?.quantity)) || 0);
    return acc + price * qty;
  }, 0);

  const resolvedDiscount =
    typeof discount === 'number' ? discount : computeCouponDiscount(subtotal, coupon);

  // Delivery config is always resolved (admin settings preserved), then bypassed
  // while testing is on.
  const { freeDeliveryThreshold } = resolveDeliveryConfig(settings);
  const deliveryCharge = disableDeliveryForTesting
    ? 0
    : computeDeliveryCharge(subtotal, settings);

  const total = Math.max(subtotal - resolvedDiscount + deliveryCharge, 0);

  return {
    subtotal,
    deliveryCharge,
    deliveryFee: deliveryCharge, // alias — same value, both names requested
    discount: resolvedDiscount,
    total,
    freeDeliveryThreshold: disableDeliveryForTesting ? 0 : freeDeliveryThreshold,
    deliveryDisabledForTesting: disableDeliveryForTesting,
  };
}

// Single source of truth for delivery charge logic.
// Used by the client cart (Providers), the Razorpay order creation route, and
// the payment verification route so the amount the customer SEES always equals
// the amount the server CHARGES and later records. If these ever diverge, the
// Razorpay order is created for one total while the UI shows another.

export const DEFAULT_DELIVERY_CHARGE = 40;
export const DEFAULT_FREE_DELIVERY_THRESHOLD = 770;

// Turn a (possibly missing / corrupted) SiteSettings doc into sane numbers.
// A stored threshold of 0 or a non-finite value would make EVERY order ship
// free — almost always misconfiguration, so we fall back to the default.
export function resolveDeliveryConfig(settings) {
  const rawCharge = Number(settings?.deliveryCharge);
  const rawThreshold = Number(settings?.freeDeliveryThreshold);

  const deliveryCharge =
    Number.isFinite(rawCharge) && rawCharge >= 0 ? rawCharge : DEFAULT_DELIVERY_CHARGE;

  const freeDeliveryThreshold =
    Number.isFinite(rawThreshold) && rawThreshold > 0
      ? rawThreshold
      : DEFAULT_FREE_DELIVERY_THRESHOLD;

  return { deliveryCharge, freeDeliveryThreshold };
}

// Delivery charge for a given items subtotal. An empty cart (subtotal <= 0)
// never carries a delivery fee.
export function computeDeliveryCharge(subtotal, settings) {
  if (!subtotal || subtotal <= 0) return 0;
  const { deliveryCharge, freeDeliveryThreshold } = resolveDeliveryConfig(settings);
  return subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
}

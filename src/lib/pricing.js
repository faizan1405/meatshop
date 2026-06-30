/**
 * Single source of truth for how a product's price is interpreted across the
 * whole site (cards, carousels, detail page, admin list).
 *
 * Safeguard rule: a product is shown as "On call" (Call to Order) whenever it is
 * explicitly flagged on_call OR none of its variants carry a real price (> 0).
 * This guarantees customers NEVER see a silent ₹0 — a missing/zero price always
 * degrades to a phone-order CTA instead.
 */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Effective price for a single variant: the sale price when it is a real
 * discount (> 0 and below the base), otherwise the base price.
 */
export function variantPrice(variant) {
  if (!variant) return 0;
  const base = num(variant.price);
  const sale = num(variant.salePrice);
  if (sale > 0 && sale < base) return sale;
  return base;
}

export function getPricingInfo(product) {
  const explicitOnCall =
    product?.priceType === 'on_call' || product?.purchaseMode === 'on_call';

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const pricedVariants = variants.filter((v) => variantPrice(v) > 0);
  const hasRealPrice = pricedVariants.length > 0;

  const prices = pricedVariants.map(variantPrice);
  const minPrice = hasRealPrice ? Math.min(...prices) : 0;
  const maxPrice = hasRealPrice ? Math.max(...prices) : 0;

  return {
    // Treat a product with no real price as on-call so we never render ₹0.
    isOnCall: explicitOnCall || !hasRealPrice,
    hasRealPrice,
    minPrice,
    maxPrice,
    pricedVariants,
  };
}

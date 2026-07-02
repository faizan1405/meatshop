import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product';

/**
 * Resolve the logged-in customer for a cart request.
 * Returns the User document, or null if there is no valid session/user.
 * Callers should respond 401 when this returns null.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return null;

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  return user || null;
}

/**
 * Reduce arbitrary incoming cart items (either rich `{ product, variant }`
 * shapes from the frontend or already-canonical `{ productId, variantName }`)
 * down to canonical `{ productId, variantName, quantity }` entries, combining
 * duplicates that share the same product + variant.
 */
export function normalizeIncomingItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const merged = new Map();
  for (const item of rawItems) {
    if (!item) continue;

    const productId =
      item.productId ||
      (item.product && (item.product._id || item.product)) ||
      null;
    const variantName =
      item.variantName || (item.variant && item.variant.name) || null;
    const quantity = Math.floor(Number(item.quantity));

    if (!productId || !variantName || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const key = `${String(productId)}|${variantName}`;
    const prev = merged.get(key);
    if (prev) {
      prev.quantity += quantity;
    } else {
      merged.set(key, { productId: String(productId), variantName, quantity });
    }
  }

  return [...merged.values()];
}

/**
 * Validate canonical items against the Product collection and rebuild both:
 *  - `canonical`: what we persist on the Cart document
 *  - `items`: the rich frontend shape `{ product, variant, quantity }` with
 *    fresh price/image/name pulled straight from the DB
 *
 * Items are dropped (never trusted from the client) when the product is
 * missing/inactive, the product is `on_call`, or the variant no longer exists.
 */
export async function resolveCartItems(canonicalItems) {
  const normalized = normalizeIncomingItems(canonicalItems);
  if (normalized.length === 0) {
    return { canonical: [], items: [] };
  }

  await connectDB();

  const ids = [...new Set(normalized.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .populate('category', 'name slug')
    .lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const canonical = [];
  const items = [];

  for (const entry of normalized) {
    const product = productMap.get(entry.productId);
    if (!product) continue;

    // Never persist an on-call product into the cart.
    if (product.priceType === 'on_call' || product.purchaseMode === 'on_call') {
      continue;
    }

    const variant = (product.variants || []).find((v) => v.name === entry.variantName);
    if (!variant) continue;

    const quantity = Math.max(1, entry.quantity);

    canonical.push({
      product: product._id,
      variantName: variant.name,
      quantity,
    });

    items.push({
      product: {
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        images: product.images || [],
        placeholderImage: product.placeholderImage || '',
        priceType: product.priceType,
        purchaseMode: product.purchaseMode,
        // productType + category slug kept so the client can classify delivery
        // type (raw vs ready-to-eat) for a server-synced cart.
        productType: product.productType,
        category: product.category
          ? { name: product.category.name, slug: product.category.slug }
          : null,
      },
      variant: {
        name: variant.name,
        price: variant.price,
        salePrice: variant.salePrice ?? null,
        stockStatus: variant.stockStatus,
      },
      quantity,
    });
  }

  return { canonical, items };
}

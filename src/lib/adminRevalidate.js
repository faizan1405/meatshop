import { revalidatePath } from 'next/cache';

// The public storefront pages render DB data (categories, products, banners,
// reviews) inside statically cached routes. After any admin mutation the
// affected routes must be revalidated, otherwise the storefront keeps serving
// the old build-time/cached HTML until the next deploy.

export function revalidateCategoryPages() {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/category/[slug]', 'page');
}

export function revalidateProductPages() {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/category/[slug]', 'page');
  revalidatePath('/product/[slug]', 'page');
}

export function revalidateBannerPages() {
  // Banners render on the homepage hero only.
  revalidatePath('/');
}

export function revalidateReviewPages() {
  // Approved reviews appear on the homepage and product detail pages.
  revalidatePath('/');
  revalidatePath('/product/[slug]', 'page');
}

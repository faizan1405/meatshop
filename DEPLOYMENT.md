# Porville — Vercel Deployment Guide

## 1. Required environment variables

Add **all** of these in Vercel → Project → Settings → Environment Variables
(set them for **Production** and **Preview**). Only `NEXT_PUBLIC_*` values reach the browser.

| Variable | Exposed to browser? | Purpose |
|---|---|---|
| `MONGODB_URI` | No | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | No | Signs session JWTs (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | No | Full deployment URL, e.g. `https://porville.com` |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |
| `RAZORPAY_KEY_ID` | No | Razorpay server key |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret (signature verification) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes** | Same as `RAZORPAY_KEY_ID`; used by checkout widget |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary account |
| `CLOUDINARY_API_KEY` | No | Cloudinary key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary secret |
| `ADMIN_EMAIL` | No | Initial admin login email (seed only) |
| `ADMIN_PASSWORD` | No | Initial admin password (seed only) |
| `SEED_SECRET` | No | Required token to run `/api/seed` (`openssl rand -hex 24`) |

## 2. Google OAuth setup

In Google Cloud Console → Credentials → your OAuth client, add the **Authorized
redirect URI**:

```
https://<your-domain>/api/auth/callback/google
```

Also keep `http://localhost:3000/api/auth/callback/google` for local dev.
`NEXTAUTH_URL` must match the deployed origin exactly.

## 3. Razorpay

- Use **test** keys for staging, **live** keys for production.
- `RAZORPAY_KEY_SECRET` is server-only and used for HMAC signature verification.
- Orders are only saved as `paid` **after** server-side signature verification.

## 4. Seeding the database (one-time, after first deploy)

The seed route is protected by `SEED_SECRET`. Run it once after deploy:

```bash
curl -X POST "https://<your-domain>/api/seed" \
  -H "Authorization: Bearer <SEED_SECRET>"
```

- It is **idempotent**: re-running updates existing records (matched by slug) and
  does not create duplicates.
- The admin user is created **only if it doesn't already exist**; an existing
  admin password is never overwritten.
- It seeds 8 categories, 41 products, site settings, a default banner, and the
  `WELCOME10` coupon.
- It also **deletes** any product/category whose slug is not in the seed list.

**After seeding is confirmed:** remove `SEED_SECRET` from the Vercel env (this
disables the route — it returns 403 with no secret configured), or delete
`src/app/api/seed/route.js` and `src/data/seedProducts.js` and redeploy.

## 5. Pre-deploy checklist

- [ ] `npm run build` passes locally
- [ ] All env vars above are set in Vercel (Production + Preview)
- [ ] `NEXTAUTH_SECRET` is a real random value (no fallback in production)
- [ ] Google redirect URI added for the production domain
- [ ] MongoDB Atlas Network Access allows Vercel (`0.0.0.0/0` or Vercel IPs)
- [ ] Razorpay keys are correct for the environment (test vs live)

## 6. Post-deploy staging test plan

- [ ] Homepage loads with **real** products (not fallback — check server logs for the fallback warning)
- [ ] Shop page loads
- [ ] Category pages load
- [ ] Product detail page loads
- [ ] Add to cart works (normal priced products)
- [ ] On-call products show "Call to Order" and **cannot** be added to cart
- [ ] Cart quantity update / remove works
- [ ] Checkout validation works
- [ ] Razorpay test payment works end-to-end
- [ ] Order saves in MongoDB only after successful payment
- [ ] Cancelled/failed payment does **not** create a paid order
- [ ] Order appears in the admin panel
- [ ] Admin can update order status
- [ ] Google login works and creates a customer in MongoDB
- [ ] Admin login (credentials) works and is separate from customer login
- [ ] Cloudinary image upload from admin works and saves the URL
- [ ] Mobile layout works
- [ ] Production build passes on Vercel

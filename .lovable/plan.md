

# Shopify Storefront + Recommended Resources

## Overview

Add two new sections to the app: a **Shop** page powered by Shopify Storefront API with full cart/checkout, and a **Resources** page with curated recommendations (books, apps, podcasts, websites, services) aligned with Positive Thots values.

---

## 1. Shopify Store Integration

**New files to create:**

- `src/lib/shopify.ts` — Storefront API config (domain, token, `storefrontApiRequest` helper, GraphQL queries, cart mutations, types)
- `src/stores/cartStore.ts` — Zustand persistent cart state (add/update/remove items, Shopify cart sync)
- `src/hooks/useCartSync.ts` — Visibility-change hook to sync cart after checkout
- `src/pages/Shop.tsx` — Product grid fetched from Storefront API; shows "No products found" if empty
- `src/pages/ProductDetail.tsx` — Individual product page at `/product/:handle` with variant selection and Add to Cart
- `src/components/CartDrawer.tsx` — Slide-out cart with quantity controls and Shopify checkout button

**Files to modify:**

- `src/App.tsx` — Add `/shop` and `/product/:handle` routes; add `useCartSync` hook; add `/resources` route
- `src/components/BottomNav.tsx` — Add Shop icon (ShoppingBag) to nav items. The nav will have 6 items; reduce icon/text size slightly to fit.

**Key details:**
- Store domain: `positivethots-j10yh.myshopify.com`
- API version: `2025-07`
- Storefront token: `5eac930c5ca1cb9d71987ad7600a49fe`
- Cart checkout uses Storefront API `cartCreate` mutation (never manual URLs)
- Checkout opens in new tab with `channel=online_store` param
- Install `zustand` dependency
- Currently 0 products — the shop page will show an empty state message

---

## 2. Recommended Resources Page

**New files to create:**

- `src/pages/Resources.tsx` — Curated resources page with categories: Books, Apps, Podcasts, Websites, Services

**Database:**
- Create a `recommended_resources` table (id, title, description, category, url, image_url, created_at, is_featured, order_index) with RLS allowing authenticated users to read and admins to manage
- Seed with initial empty structure (resources added by admins later)

**Design:**
- Filterable by category tabs (All, Books, Apps, Podcasts, Websites, Services)
- Each resource card shows title, description, category badge, and external link
- Accessible from Profile page or a dedicated nav entry
- Add a link to Resources from the Learn page or Profile page (not bottom nav, to avoid overcrowding — Shop takes the 6th slot)

---

## 3. Navigation Updates

The bottom nav currently has 5 items. Adding Shop makes 6. Resources will be accessible from the Profile page (as a menu item) rather than the bottom nav to keep it clean.

---

## Technical Details

- **Dependencies**: `zustand` (for cart state)
- **Database migration**: `recommended_resources` table with RLS
- **Routes**: `/shop`, `/product/:handle`, `/resources`
- **No mock products** — real Shopify API only; empty state if no products exist


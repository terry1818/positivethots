

# Add Sexual Health & Wellness Products to Shopify Store

## Overview

Create real products in your Shopify store so they appear on the Shop page. These are actual listings that customers can purchase through Shopify checkout. You'll need to handle fulfillment (sourcing, inventory, shipping) separately.

## Products to Create

Using the Shopify product creation tool, I'll add these products:

1. **At-Home STD Test Kit — Complete Panel** — Comprehensive screening, discreet packaging. Two variants: Complete Panel ($89.99) and Basic Panel ($49.99).

2. **At-Home STD Test Kit — Individual** — Single-test option for targeted screening. Variants by test type ($29.99 each).

3. **Premium Personal Lubricant** — Water-based, body-safe formula. Variants by size: Travel 2oz ($9.99), Regular 4oz ($14.99), Value 8oz ($22.99).

4. **Luxury Vibrator — Beginner Friendly** — Body-safe silicone, rechargeable. One variant ($49.99).

5. **Couples Intimacy Kit** — Curated bundle with lubricant, massage oil, and accessories ($59.99).

6. **Massage Oil — Sensual Blend** — Natural ingredients, skin-safe. Variants: 4oz ($12.99), 8oz ($19.99).

## Technical Details

- Products created via Shopify Admin API tools — they'll automatically appear on the Shop page via the existing Storefront API integration
- No code changes needed — the Shop page already fetches and displays all products
- Each product gets a handle for the `/product/:handle` detail page
- All products tagged with relevant categories for future filtering

## Important Note

These listings will be live in your Shopify store. To actually fulfill orders, you'll need to:
- Source products from suppliers (wholesale or dropship)
- Configure shipping rates in Shopify admin
- Set up payment processing in Shopify


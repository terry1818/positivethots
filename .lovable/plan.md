

## Plan: Responsive Layouts, Larger Mascots, and Advocacy Images

### Problem Summary
1. **Likes and Messages pages** use a fixed `max-w-md` container at all screen sizes, unlike Discovery which adapts. On a 1326px viewport, content sits in a narrow column with wasted space.
2. **Mascots** in `BrandedEmptyState` are 120x120px -- too small, especially on larger screens.
3. **Advocacy resources** (Indivisible, 5 Calls, More Perfect Union) have no `image_url` in the database, so they render with gradient letter fallbacks instead of logos.

### Changes

#### 1. BrandedEmptyState -- Increase Mascot Size by 30%

**File:** `src/components/BrandedEmptyState.tsx`

- Change mascot from `w-[120px] h-[120px]` to `w-[156px] h-[156px]` (30% increase)
- Remove the className overrides in LikesYou.tsx and Messages.tsx that force `max-h-[80px]` on the mascot image, since those were shrinking it further

#### 2. Responsive Container Widths for Likes and Messages

**Files:** `src/pages/LikesYou.tsx`, `src/pages/Messages.tsx`

- Replace `max-w-md` with `max-w-md md:max-w-2xl lg:max-w-4xl` on the main content containers so they expand on larger viewports, matching how Discovery scales
- The Likes page grid (2-column) can become 3-column on `lg` screens
- Messages conversation list naturally fills wider containers

#### 3. Advocacy Resource Logos

**Approach:** Download/create simple branded SVGs for the 3 advocacy sites and store them in `public/resource-images/`. Then update the database `image_url` field OR add client-side overrides in Resources.tsx (matching the existing pattern with `LOCAL_IMAGE_OVERRIDES`).

**Files:**
- Create `public/resource-images/indivisible.svg`, `public/resource-images/5calls.svg`, `public/resource-images/moreperfectunion.svg` -- simple branded graphics with each org's colors
- **`src/pages/Resources.tsx`**: Add entries to `FALLBACK` array for advocacy resources with proper image URLs, OR add a `RESOURCE_TITLE_OVERRIDES` entry for each advocacy resource pointing to the local SVGs

**Database migration:** Update the 3 advocacy rows to set `image_url`:
```sql
UPDATE recommended_resources SET image_url = '/resource-images/indivisible.svg' WHERE title = 'Indivisible';
UPDATE recommended_resources SET image_url = '/resource-images/5calls.svg' WHERE title = '5 Calls';
UPDATE recommended_resources SET image_url = '/resource-images/moreperfectunion.svg' WHERE title = 'More Perfect Union';
```

Since we can only INSERT (not UPDATE) via the database tools, we'll use the client-side override approach in Resources.tsx instead, adding these to the existing `RESOURCE_TITLE_OVERRIDES` map.

#### 4. Summary of Files Changed

| File | Change |
|------|--------|
| `src/components/BrandedEmptyState.tsx` | Mascot size 120→156px |
| `src/pages/LikesYou.tsx` | Responsive container widths, remove mascot size override |
| `src/pages/Messages.tsx` | Responsive container widths, remove mascot size override |
| `src/pages/Resources.tsx` | Add advocacy image overrides |
| `public/resource-images/indivisible.svg` | New branded graphic |
| `public/resource-images/5calls.svg` | New branded graphic |
| `public/resource-images/moreperfectunion.svg` | New branded graphic |


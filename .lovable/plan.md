

# Image Loading Optimization Plan

## Overview
Create a reusable `BlurImage` component and replace all raw `<img>` tags for user/product photos across the app to eliminate CLS, add smooth loading transitions, and improve perceived performance.

## Changes

### 1. Create `src/components/BlurImage.tsx`
Reusable image component with:
- Purple-tinted gradient placeholder (`#7C3AED` at 10% opacity) with `animate-pulse`
- `useState` to track loaded/error states
- `onLoad` handler triggers 300ms opacity fade transition
- Error fallback: branded silhouette avatar (purple circle with user icon)
- Props: `src`, `alt`, `className`, `width`, `height`, `loading` (lazy/eager), `fetchPriority`, `aspectRatio` (default "1/1" for profiles, "3/4" for cards)
- Always renders `decoding="async"` and explicit dimensions

### 2. Update `SwipeDiscoveryCard.tsx`
- Replace the raw `<img>` on line 149-154 with `<BlurImage>`
- Top card (stackIndex 0): `fetchPriority="high"`, no lazy loading
- Other cards: `loading="lazy"`
- Add `aspect-ratio: 3/4` to the photo container (already has `h-96`)

### 3. Update `DiscoveryCard.tsx`
- Replace `<img>` on line 66-73 with `<BlurImage>`
- First card (index 0): eager loading; rest: lazy
- Add `width={400} height={256}` to match the `h-64` container

### 4. Update `ProfileDetailSheet.tsx`
- Replace the profile photo `<img>` with `<BlurImage>`
- Add explicit dimensions matching the drawer photo area

### 5. Update `Messages.tsx` (line 133-138)
- Replace match avatar `<img>` with `<BlurImage>` 
- Set `className="h-16 w-16 rounded-full"`, `aspectRatio="1/1"`
- Keep `loading="lazy"` and `decoding="async"`

### 6. Update `LikesYou.tsx` (line 194)
- Replace liker photo `<img>` with `<BlurImage>`
- Add explicit `h-44 w-full` dimensions, `aspectRatio="3/4"`

### 7. Update `Profile.tsx` (line 195-200)
- Replace own profile photo `<img>` with `<BlurImage>`
- Keep `loading="eager"` for own profile

### 8. Update `ProfileCard.tsx`
- Replace profile image `<img>` with `<BlurImage>`

### 9. Update `ResourceCard.tsx` / Resources page product images
- Replace product `<img>` tags with `<BlurImage>`
- Add explicit dimensions matching card size
- All product images: `loading="lazy"`

### 10. CLS fixes
- Add `min-height` to async containers: match list (`min-h-[80px]`), message list, badge grid
- Ensure all skeleton loaders in Index.tsx, Messages.tsx, LikesYou.tsx match exact content dimensions

## Technical Details

**BlurImage component structure:**
```text
<div style={{ aspectRatio }} className="relative overflow-hidden bg-[#7C3AED]/10">
  {!loaded && !error && <div className="absolute inset-0 animate-pulse bg-gradient-..." />}
  {error ? <FallbackAvatar /> : (
    <img
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      style={{ opacity: loaded ? 1 : 0, transition: 'opacity 300ms' }}
      decoding="async"
      ...props
    />
  )}
</div>
```

**Files modified:** ~10 files
**No URL changes, no business logic changes.**


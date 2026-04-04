

## Plan: Consistent Header Across All Pages

### Problem
The Discovery page header differs from the other pages (Profile, Messages, etc.) in two ways:
1. **Settings icon**: Discovery uses a Shield icon at `h-4 w-4` inside a small `h-9 w-9` outline button. Profile page uses a Settings gear at `h-6 w-6` inside a `size="icon"` ghost button — larger and bolder.
2. **Header structure**: Discovery has extra buttons (Incognito, Boost, Thot count) that are fine, but the container styling differs slightly (`py-2.5` vs `py-4`, no `border-b` class on the outer header).

### Reference (Profile page — the "correct" pattern)
```
<header className="border-b border-border bg-card">
  <div className="container max-w-md mx-auto px-4 py-4 flex items-center justify-between">
    <Logo size="md" showText={false} />
    <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigate("/settings")}>
      <Settings className="h-6 w-6" />
    </Button>
  </div>
</header>
```

### Changes

#### 1. Discovery Page Header (`src/pages/Index.tsx`)

- Change the outer sticky div to include `border-b border-border bg-card` (matching Profile)
- Change `py-2.5` to `py-4` for consistent vertical spacing
- Replace the Settings button: swap `Shield` icon for `Settings` (gear), change from `variant="outline" h-9 w-9 p-0` with `h-4 w-4` icon to `variant="ghost" size="icon"` with `h-6 w-6` icon — matching Profile exactly
- Keep Incognito, Boost, and Thot count buttons as they are (those are Discovery-specific)
- Add `Settings` to the lucide-react import if not already present

#### 2. All Other Pages — Already Consistent
Profile, Messages, Likes, Learn pages already use `Logo size="md"` with consistent header patterns. No changes needed there.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Match header styling and settings icon to Profile page pattern |




## Update Resources Categories

The Resources page and database already support categories via a `category` text column on the `recommended_resources` table. The change is straightforward:

### What changes

1. **Add new categories** to the Resources page: add "Movies" and "TV Shows" (or "Film & TV") alongside existing Books, Apps, Podcasts, Websites, Services
2. **Add corresponding icons** using Lucide icons (`Film` for Movies, `Tv` for TV Shows)
3. **Update the category icons map** and the categories array in `src/pages/Resources.tsx`

No database migration needed -- the `category` column is a plain text field, so any new category value (e.g. "Movies", "TV Shows") just works.

### File: `src/pages/Resources.tsx`
- Add `Film`, `Tv` imports from lucide-react
- Add entries to `categoryIcons`: `Movies: <Film />`, `"TV Shows": <Tv />`
- Update `categories` array to: `["All", "Books", "Movies", "TV Shows", "Podcasts", "Apps", "Websites", "Services"]`

### Technical detail
- The `recommended_resources` table stores category as free-text, so adding "Movies" or "TV Shows" rows via the admin panel or direct insert will immediately appear under the new tabs
- No RLS or schema changes required


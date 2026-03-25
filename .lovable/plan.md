

## Implementation: Identity & Diversity Tier (Badges 10-13)

This plan was already approved. Executing now.

### Single Migration File

Create `supabase/migrations/20260325160000_identity_diversity_tier_content.sql` containing all data operations for 4 modules:

**Badge 10 (`sexual-orientation-spectrum` — `0d6c6684-2a8b-4b93-82d3-a24127d7983a`):**
- UPDATE module title/description
- DELETE existing quiz_questions and module_sections
- INSERT 4 sections: "Beyond the Binary: Kinsey & Klein", "Sexual Fluidity: Lisa Diamond's Research", "The Asexual & Aromantic Spectrums", "Honoring Orientation Diversity in Community"
- INSERT 7 quiz questions (5 badge + 2 checkpoint linked to sections 2 and 3)

**Badge 11 (`gender-identity-expression` — `33ff8466-4bd4-42b3-890d-fb3eaa525af7`):**
- Same pattern: Gender Unicorn model, Trans/NB experiences (WPATH), Pronoun practice, Supporting gender diversity
- 7 quiz questions

**Badge 12 (`relationship-orientations` — `b3dd9660-bb2b-48bd-9e63-561b59962379`):**
- Same pattern: Landscape of orientations (Sheff), Kitchen table/parallel/garden party poly, RA & solo poly, Honoring all choices
- 7 quiz questions

**Badge 13 (`intersectionality-intimacy` — `60b16b4b-994c-4b16-9d53-3ebc6bb8dced`):**
- Same pattern: Crenshaw's framework, Race/culture/intimacy, Disability/neurodiversity (AASECT core), Building inclusive communities
- 7 quiz questions

### Technical Details
- Checkpoint questions use DO blocks to query section IDs after insertion, then link via section_id + position_in_section
- All content follows SHA/AASECT standards: sex-positive, trauma-informed, non-pathologizing, inclusive
- No schema migration needed, no frontend changes

### Files Changed
| File | Description |
|------|-------------|
| `supabase/migrations/20260325160000_identity_diversity_tier_content.sql` | All data operations for Badges 10-13 |


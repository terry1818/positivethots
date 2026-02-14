

# Photo Upload, Public/Private Albums, and Verification System

## Overview
Add a full photo management system to the Edit Profile page with public and private photo albums (8 each), AI-powered image moderation, and a selfie-based identity verification flow.

## What You'll Get

**Photo Uploads on Edit Profile**
- A new "Photos" card at the top of Edit Profile with two tabs: Public (visible to everyone) and Private (only shared with matches)
- Drag-to-reorder grid of photos, 8 slots per tab
- First public photo automatically becomes your main profile image
- Upload, delete, and rearrange photos easily

**Automatic Image Moderation**
- Every uploaded photo is scanned by AI before it goes live
- Uses the built-in Lovable AI (Gemini) to check for prohibited content, spam, and policy violations
- Photos are marked as "pending", "approved", or "rejected" -- only approved photos are shown to others
- Rejected photos show a reason so the user understands why

**Identity Verification**
- Optional "Verify Me" flow: take a live selfie holding up a specific pose/gesture
- AI compares the selfie to your profile photos to confirm you're a real person
- Verified users get a visible badge on their profile
- Builds trust and safety in the community

## Technical Details

### 1. Database Changes

**New table: `user_photos`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| storage_path | text | Path in storage bucket |
| photo_url | text | Public URL |
| visibility | text | 'public' or 'private' |
| order_index | integer | Sort order within visibility group |
| moderation_status | text | 'pending', 'approved', 'rejected' |
| moderation_reason | text | Reason if rejected |
| created_at | timestamptz | Upload timestamp |

RLS policies: users can CRUD their own photos, and can SELECT other users' approved public photos.

**New table: `verification_requests`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| selfie_path | text | Storage path of verification selfie |
| status | text | 'pending', 'verified', 'rejected' |
| reviewed_at | timestamptz | When moderation completed |
| reason | text | Rejection reason if any |
| created_at | timestamptz | Request timestamp |

**Add column to `profiles`:**
- `is_verified` (boolean, default false) -- set to true when verification passes

### 2. Storage Bucket

Create a `user-photos` bucket (public read for approved photos) with RLS policies so users can only upload/delete their own files. Folder structure: `{user_id}/public/`, `{user_id}/private/`, `{user_id}/verification/`.

### 3. Edge Function: `moderate-photo`

- Triggered after upload from the client
- Downloads the image from storage
- Sends it to Lovable AI (Gemini vision model) with a moderation prompt
- Updates `user_photos.moderation_status` accordingly
- For verification selfies: compares against existing profile photos and updates `verification_requests` and `profiles.is_verified`

### 4. UI Components

**`PhotoUploadGrid` component**
- 4x2 grid of photo slots (8 total)
- Tabs for "Public" and "Private"
- Click empty slot to upload, click existing photo to delete
- Shows moderation status badge (pending/rejected) on each photo
- Count indicator: "3/8 photos"

**Edit Profile page updates**
- Add the PhotoUploadGrid card as the first section
- Add a "Verify Identity" button/card at the bottom

**Verification flow**
- "Get Verified" card on Edit Profile
- Opens camera to capture selfie
- Uploads and calls the moderation edge function in verification mode
- Shows status: unverified, pending, verified (with checkmark badge)

**Profile page updates**
- Show verified badge next to name if `is_verified` is true
- Display public photos in a scrollable gallery on the profile card

### 5. Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/[new].sql` | Create tables, bucket, RLS policies, add `is_verified` column |
| `supabase/functions/moderate-photo/index.ts` | New edge function for AI moderation + verification |
| `src/components/PhotoUploadGrid.tsx` | New component for the photo grid |
| `src/components/VerificationCard.tsx` | New component for identity verification flow |
| `src/pages/EditProfile.tsx` | Add photo and verification sections |
| `src/pages/Profile.tsx` | Show verified badge and photo gallery |
| `src/components/ProfileCard.tsx` | Show verified badge on swipe cards |


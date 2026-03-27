import { useMemo } from "react";

interface CompletionInput {
  profile: any;
  userPhotos: any[];
  badges: any[];
  promptCount: number;
}

interface NudgeAction {
  icon: string;
  label: string;
  weight: string;
  route: string;
}

export const useProfileCompletion = ({ profile, userPhotos, badges, promptCount }: CompletionInput) => {
  return useMemo(() => {
    if (!profile) return { percentage: 0, nudges: [] as NudgeAction[] };

    let pct = 10; // baseline endowed progress
    const nudges: NudgeAction[] = [];

    // Profile photo (20%)
    const hasApprovedPhoto = userPhotos.length > 0;
    if (hasApprovedPhoto) pct += 20;
    else nudges.push({ icon: "Camera", label: "Add a profile photo", weight: "+20%", route: "/profile/edit" });

    // 3+ photos (10%)
    if (userPhotos.length >= 3) pct += 10;
    else if (hasApprovedPhoto) nudges.push({ icon: "Camera", label: "Upload more photos", weight: "+10%", route: "/profile/edit" });

    // Bio or 2+ prompts (15%)
    const hasBioOrPrompts = profile.bio?.trim() || promptCount >= 2;
    if (hasBioOrPrompts) pct += 15;
    else nudges.push({ icon: "MessageSquare", label: "Answer profile prompts", weight: "+15%", route: "/profile/edit" });

    // 3 prompts (5%)
    if (promptCount >= 3) pct += 5;

    // Identity fields (15%)
    const hasIdentity = profile.gender && profile.pronouns && profile.sexuality;
    if (hasIdentity) pct += 15;
    else nudges.push({ icon: "User", label: "Complete identity fields", weight: "+15%", route: "/profile/edit" });

    // Relationship fields (10%)
    const hasRelationship = profile.relationship_style && profile.relationship_status;
    if (hasRelationship) pct += 10;

    // 5+ interests (10%)
    if (profile.interests?.length >= 5) pct += 10;
    else nudges.push({ icon: "Sparkles", label: "Add more interests", weight: "+10%", route: "/profile/edit" });

    // Foundation badge (10%)
    if (badges.length > 0) pct += 10;
    else nudges.push({ icon: "BookOpen", label: "Earn your first badge", weight: "+10%", route: "/learn" });

    // Verified (5%)
    if (profile.is_verified) pct += 5;
    else nudges.push({ icon: "Shield", label: "Verify your profile", weight: "+5%", route: "/profile/edit" });

    return { percentage: Math.min(pct, 100), nudges: nudges.slice(0, 3) };
  }, [profile, userPhotos, badges, promptCount]);
};

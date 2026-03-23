import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaggerChildren } from "@/components/StaggerChildren";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { VerificationCard } from "@/components/VerificationCard";
import { BdsmTestSection } from "@/components/BdsmTestSection";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/PageSkeleton";

const EditProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [latestVerification, setLatestVerification] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [relationshipStyle, setRelationshipStyle] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [bdsmTestUrl, setBdsmTestUrl] = useState("");
  const [bdsmTestScreenshot, setBdsmTestScreenshot] = useState("");

  useEffect(() => { loadProfile(); }, []);

  const markChanged = () => setHasChanges(true);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const [profileResult, photosResult, verResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("user_photos").select("*").eq("user_id", session.user.id),
        supabase.from("verification_requests").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1),
      ]);
      if (profileResult.error) throw profileResult.error;
      const data = profileResult.data;
      setProfile(data);
      setName(data.name || ""); setBio(data.bio || ""); setLocation(data.location || "");
      setPronouns(data.pronouns || ""); setBoundaries(data.boundaries || "");
      setLookingFor(data.looking_for || ""); setRelationshipStyle(data.relationship_style || "");
      setRelationshipStatus(data.relationship_status || ""); setExperienceLevel(data.experience_level || "");
      setBdsmTestUrl(data.bdsm_test_url || ""); setBdsmTestScreenshot(data.bdsm_test_screenshot || "");
      setPhotos(photosResult.data || []);
      setLatestVerification(verResult.data?.[0] || null);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const reloadPhotos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [photosResult, profileResult, verResult] = await Promise.all([
      supabase.from("user_photos").select("*").eq("user_id", session.user.id),
      supabase.from("profiles").select("is_verified").eq("id", session.user.id).single(),
      supabase.from("verification_requests").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    setPhotos(photosResult.data || []);
    if (profileResult.data) setProfile((prev: any) => ({ ...prev, is_verified: profileResult.data.is_verified }));
    setLatestVerification(verResult.data?.[0] || null);
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: name.trim(), bio: bio.trim(), location: location.trim(), pronouns: pronouns.trim(),
        boundaries: boundaries.trim(), looking_for: lookingFor, relationship_style: relationshipStyle,
        relationship_status: relationshipStatus, experience_level: experienceLevel,
        bdsm_test_url: bdsmTestUrl.trim() || null, bdsm_test_screenshot: bdsmTestScreenshot || null,
      } as any).eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile updated!");
      navigate("/profile");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton variant="profile" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Edit Profile</h1>
          <Button
            size="sm" onClick={handleSave} disabled={saving}
            className={cn("transition-all", hasChanges && "animate-pulse-glow")}
          >
            <Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 pb-24">
        <StaggerChildren className="space-y-4" stagger={100}>
          {profile?.id && <PhotoUploadGrid userId={profile.id} photos={photos} onPhotosChange={reloadPhotos} />}

          <Card>
            <CardHeader><CardTitle className="text-lg">Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => { setName(e.target.value); markChanged(); }} maxLength={100} className="focus-glow" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input id="pronouns" value={pronouns} onChange={(e) => { setPronouns(e.target.value); markChanged(); }} placeholder="e.g., she/her, he/him, they/them" className="focus-glow" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (city)</Label>
                <Input id="location" value={location} onChange={(e) => { setLocation(e.target.value); markChanged(); }} placeholder="e.g., Portland" maxLength={100} className="focus-glow" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => { setBio(e.target.value); markChanged(); }} rows={4} maxLength={500} placeholder="Tell people about yourself..." className="focus-glow" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Relationship Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style">Relationship Style</Label>
                <select id="style" value={relationshipStyle} onChange={(e) => { setRelationshipStyle(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  <option value="polyamory">Polyamorous</option>
                  <option value="open-relationship">Open Relationship</option>
                  <option value="swinging">Swinging</option>
                  <option value="relationship-anarchy">Relationship Anarchy</option>
                  <option value="monogamish">Monogamish</option>
                  <option value="exploring">Exploring ENM</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Relationship Status</Label>
                <select id="status" value={relationshipStatus} onChange={(e) => { setRelationshipStatus(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Dating">Dating</option>
                  <option value="In a relationship">In a relationship</option>
                  <option value="Married">Married</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="looking">Looking For</Label>
                <select id="looking" value={lookingFor} onChange={(e) => { setLookingFor(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  <option value="New connections">New connections</option>
                  <option value="Friends first">Friends first</option>
                  <option value="Casual dating">Casual dating</option>
                  <option value="Long-term partners">Long-term partners</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Experience Level</Label>
                <select id="exp" value={experienceLevel} onChange={(e) => { setExperienceLevel(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  <option value="curious">Curious</option>
                  <option value="new">New</option>
                  <option value="experienced">Experienced</option>
                  <option value="veteran">Veteran</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Boundaries & Preferences</CardTitle></CardHeader>
            <CardContent>
              <Textarea id="boundaries" value={boundaries} onChange={(e) => { setBoundaries(e.target.value); markChanged(); }} rows={3} maxLength={500} placeholder="Share your boundaries and preferences..." className="focus-glow" />
            </CardContent>
          </Card>

          {profile?.id && (
            <VerificationCard userId={profile.id} isVerified={profile.is_verified || false} latestRequest={latestVerification} onVerificationChange={reloadPhotos} />
          )}
        </StaggerChildren>
      </main>
    </div>
  );
};

export default EditProfile;

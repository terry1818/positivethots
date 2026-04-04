import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { VerificationCard } from "@/components/VerificationCard";
import { BdsmTestSection } from "@/components/BdsmTestSection";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/PageSkeleton";
import { PROMPT_QUESTIONS } from "@/lib/promptQuestions";
import { FrameSelector } from "@/components/profile/FrameSelector";
import { syncEarnedFrames } from "@/hooks/useEarnedFrames";
import { FieldError } from "@/components/FieldError";

interface PromptRow {
  id?: string;
  prompt_question: string;
  prompt_response: string;
  display_order: number;
}

const EditProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [latestVerification, setLatestVerification] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const focusSection = (location.state as any)?.focusSection as string | undefined;
  const [openSection, setOpenSection] = useState<string>(focusSection || "basics");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [relationshipStyle, setRelationshipStyle] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [bdsmTestUrl, setBdsmTestUrl] = useState("");
  const [bdsmTestScreenshot, setBdsmTestScreenshot] = useState("");
  const [selectedFrame, setSelectedFrame] = useState("newbie");
  const [earnedFrames, setEarnedFrames] = useState<string[]>(["newbie"]);

  // Prompts state
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [editingPromptIdx, setEditingPromptIdx] = useState<number | null>(null);
  const [changingQuestionIdx, setChangingQuestionIdx] = useState<number | null>(null);

  useEffect(() => { loadProfile(); }, []);

  const markChanged = () => setHasChanges(true);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const [profileResult, photosResult, verResult, promptsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("user_photos").select("*").eq("user_id", session.user.id),
        supabase.from("verification_requests").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("profile_prompts" as any).select("*").eq("user_id", session.user.id).order("display_order", { ascending: true }),
      ]);
      if (profileResult.error) throw profileResult.error;
      const data = profileResult.data;
      setProfile(data);
      setName(data.name || ""); setBio(data.bio || ""); setLocationVal(data.location || "");
      setPronouns(data.pronouns || ""); setBoundaries(data.boundaries || "");
      setLookingFor(data.looking_for || ""); setRelationshipStyle(data.relationship_style || "");
      setRelationshipStatus(data.relationship_status || ""); setExperienceLevel(data.experience_level || "");
      setBdsmTestUrl(data.bdsm_test_url || ""); setBdsmTestScreenshot(data.bdsm_test_screenshot || "");
      setSelectedFrame((data as any).selected_frame || "newbie");
      setEarnedFrames((data as any).earned_frames || ["newbie"]);
      syncEarnedFrames(session.user.id).then(frames => setEarnedFrames(frames));
      setPhotos(photosResult.data || []);
      setLatestVerification(verResult.data?.[0] || null);
      setPrompts((promptsResult.data || []).map((p: any) => ({
        id: p.id,
        prompt_question: p.prompt_question,
        prompt_response: p.prompt_response,
        display_order: p.display_order,
      })));
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

    // Inline validation
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Display name is required";
    if (bio.length > 500) errors.bio = "Bio must be under 500 characters";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Focus first error field
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(firstKey);
      el?.focus();
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: name.trim(), bio: bio.trim(), location: locationVal.trim(), pronouns: pronouns.trim(),
        boundaries: boundaries.trim(), looking_for: lookingFor, relationship_style: relationshipStyle,
        relationship_status: relationshipStatus, experience_level: experienceLevel,
        bdsm_test_url: bdsmTestUrl.trim() || null, bdsm_test_screenshot: bdsmTestScreenshot || null,
        selected_frame: selectedFrame,
      } as any).eq("id", profile.id);
      if (error) throw error;

      await supabase.from("profile_prompts" as any).delete().eq("user_id", profile.id);
      const validPrompts = prompts.filter(p => p.prompt_response.trim());
      if (validPrompts.length > 0) {
        await supabase.from("profile_prompts" as any).insert(
          validPrompts.map((p, i) => ({
            user_id: profile.id,
            prompt_question: p.prompt_question,
            prompt_response: p.prompt_response.trim(),
            display_order: i,
          }))
        );
      }

      queryClient.invalidateQueries({ queryKey: ["profile-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-prompt-count"] });
      toast.success("Profile updated!");
      setHasChanges(false);
      navigate("/profile");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addPrompt = () => {
    const usedQuestions = prompts.map(p => p.prompt_question);
    const available = PROMPT_QUESTIONS.filter(q => !usedQuestions.includes(q));
    if (available.length === 0) return;
    setPrompts([...prompts, {
      prompt_question: available[0],
      prompt_response: "",
      display_order: prompts.length,
    }]);
    setEditingPromptIdx(prompts.length);
    markChanged();
  };

  const removePrompt = (idx: number) => {
    setPrompts(prompts.filter((_, i) => i !== idx));
    setEditingPromptIdx(null);
    markChanged();
  };

  const updatePromptResponse = (idx: number, response: string) => {
    setPrompts(prompts.map((p, i) => i === idx ? { ...p, prompt_response: response.slice(0, 150) } : p));
    markChanged();
  };

  const changePromptQuestion = (idx: number, newQuestion: string) => {
    setPrompts(prompts.map((p, i) => i === idx ? { ...p, prompt_question: newQuestion } : p));
    setChangingQuestionIdx(null);
    markChanged();
  };

  const usedQuestions = prompts.map(p => p.prompt_question);

  if (loading) {
    return <PageSkeleton variant="profile" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Edit Profile</h1>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 pb-36">
        <Accordion
          type="single"
          collapsible
          value={openSection}
          onValueChange={(val) => setOpenSection(val)}
          className="space-y-3"
        >
          {/* Photos Section */}
          <AccordionItem value="photos" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="text-base font-semibold py-4">Photos & Frame</AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {profile?.id && <PhotoUploadGrid userId={profile.id} photos={photos} onPhotosChange={reloadPhotos} />}
              <FrameSelector
                earnedFrames={earnedFrames}
                selectedFrame={selectedFrame}
                onSelect={(f) => { setSelectedFrame(f); markChanged(); }}
                profileImage={profile?.profile_image}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Basics Section */}
          <AccordionItem value="basics" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="text-base font-semibold py-4">Basics</AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); markChanged(); setFieldErrors(prev => ({ ...prev, name: "" })); }}
                  maxLength={100}
                  className="focus-glow"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                <FieldError message={fieldErrors.name} id="name-error" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input id="pronouns" value={pronouns} onChange={(e) => { setPronouns(e.target.value); markChanged(); }} placeholder="e.g., she/her, he/him, they/them" className="focus-glow" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (city)</Label>
                <Input id="location" value={locationVal} onChange={(e) => { setLocationVal(e.target.value); markChanged(); }} placeholder="e.g., Portland" maxLength={100} className="focus-glow" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* About You Section */}
          <AccordionItem value="about" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="text-base font-semibold py-4">About You</AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">About Me</Label>
                  <span className={cn("text-xs", bio.length > 500 ? "text-destructive" : "text-muted-foreground")}>{bio.length}/500</span>
                </div>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => { setBio(e.target.value); markChanged(); setFieldErrors(prev => ({ ...prev, bio: "" })); }}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell people about yourself..."
                  className="focus-glow"
                  aria-invalid={!!fieldErrors.bio}
                  aria-describedby={fieldErrors.bio ? "bio-error" : undefined}
                />
                <FieldError message={fieldErrors.bio} id="bio-error" />
              </div>

              {/* Prompts */}
              <div className="space-y-3">
                <Label>Your Prompts</Label>
                <p className="text-xs text-muted-foreground">Answer prompts so people get to know the real you</p>
                {prompts.map((prompt, idx) => (
                  <div key={idx} className="bg-muted/30 rounded-xl p-3 border border-border/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setChangingQuestionIdx(changingQuestionIdx === idx ? null : idx)}
                        className="text-sm font-medium text-primary hover:text-primary/80 text-left flex-1"
                      >
                        {prompt.prompt_question}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePrompt(idx)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {changingQuestionIdx === idx && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {PROMPT_QUESTIONS.filter(q => !usedQuestions.includes(q) || q === prompt.prompt_question).map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => changePromptQuestion(idx, q)}
                            className={cn(
                              "block w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors",
                              q === prompt.prompt_question
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted text-muted-foreground"
                            )}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    <Textarea
                      value={prompt.prompt_response}
                      onChange={(e) => updatePromptResponse(idx, e.target.value)}
                      placeholder="Your answer..."
                      maxLength={150}
                      rows={2}
                      className="text-sm resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{prompt.prompt_response.length}/150</p>
                  </div>
                ))}

                {prompts.length < 3 && (
                  <Button variant="outline" size="sm" onClick={addPrompt} className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Add {prompts.length === 0 ? "a" : "another"} prompt
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Relationship Section */}
          <AccordionItem value="relationship" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="text-base font-semibold py-4">Relationship Style</AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style">Relationship Style</Label>
                <select id="style" value={relationshipStyle} onChange={(e) => { setRelationshipStyle(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]">
                  <option value="">Select...</option>
                  <option value="monogamous">Monogamous</option>
                  <option value="polyamory">Polyamorous</option>
                  <option value="open-relationship">Open Relationship</option>
                  <option value="swinging">Swinging</option>
                  <option value="relationship-anarchy">Relationship Anarchy</option>
                  <option value="monogamish">Monogamish</option>
                  <option value="hierarchical-poly">Hierarchical Poly</option>
                  <option value="solo-poly">Solo Poly</option>
                  <option value="exploring">Exploring ENM</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Relationship Status</Label>
                <select id="status" value={relationshipStatus} onChange={(e) => { setRelationshipStatus(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]">
                  <option value="">Select...</option>
                  <option value="Single">Single</option>
                  <option value="Dating">Dating</option>
                  <option value="In a relationship">In a relationship</option>
                  <option value="Married">Married</option>
                  <option value="Partnered">Partnered</option>
                  <option value="In a polycule">In a polycule</option>
                  <option value="Nesting partner">Nesting partner</option>
                  <option value="Separated">Separated</option>
                  <option value="It's complicated">It's complicated</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="looking">Looking For</Label>
                <select id="looking" value={lookingFor} onChange={(e) => { setLookingFor(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]">
                  <option value="">Select...</option>
                  <option value="New connections">New connections</option>
                  <option value="Friends first">Friends first</option>
                  <option value="Casual connecting">Casual connecting</option>
                  <option value="Long-term partners">Long-term partners</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp">Experience Level</Label>
                <select id="exp" value={experienceLevel} onChange={(e) => { setExperienceLevel(e.target.value); markChanged(); }} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px]">
                  <option value="">Select...</option>
                  <option value="curious">Curious</option>
                  <option value="new">New</option>
                  <option value="experienced">Experienced</option>
                  <option value="veteran">Veteran</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="boundaries">Boundaries & Preferences</Label>
                <Textarea id="boundaries" value={boundaries} onChange={(e) => { setBoundaries(e.target.value); markChanged(); }} rows={3} maxLength={500} placeholder="Share your boundaries and preferences..." className="focus-glow" />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* BDSM & Verification */}
          <AccordionItem value="verification" className="border rounded-xl px-4 bg-card">
            <AccordionTrigger className="text-base font-semibold py-4">Verification & Extras</AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {profile?.id && (
                <BdsmTestSection
                  bdsmTestUrl={bdsmTestUrl}
                  bdsmTestScreenshot={bdsmTestScreenshot}
                  onUrlChange={setBdsmTestUrl}
                  onScreenshotChange={setBdsmTestScreenshot}
                  userId={profile.id}
                  onChange={markChanged}
                />
              )}
              {profile?.id && (
                <VerificationCard userId={profile.id} isVerified={profile.is_verified || false} hasApprovedPhotos={photos.some(p => p.moderation_status === 'approved')} latestRequest={latestVerification} onVerificationChange={reloadPhotos} />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>

      {/* Floating Save Button */}
      {hasChanges && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-50 animate-fade-in">
          <div className="container max-w-md mx-auto">
            <Button
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold shadow-lg rounded-xl"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;

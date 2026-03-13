import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { ChevronRight, ChevronLeft, Sparkles, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { StepTransition } from "@/components/onboarding/StepTransition";
import { ChipSelector } from "@/components/onboarding/ChipSelector";
import { HeightSlider } from "@/components/onboarding/HeightSlider";
import { GlossaryTooltip } from "@/components/onboarding/GlossaryTooltip";
import { ProfilePreview } from "@/components/onboarding/ProfilePreview";
import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";

// ── Option Data ──

const GENDER_OPTIONS = [
  "Woman", "Man", "Non-binary", "Trans Woman", "Trans Man",
  "Genderqueer", "Genderfluid", "Agender", "Two-Spirit", "Intersex", "Other",
].map(g => ({ value: g.toLowerCase().replace(/\s+/g, "-"), label: g }));

const PRONOUN_PRESETS = [
  "she/her", "he/him", "they/them", "she/they", "he/they", "any pronouns",
];

const SEXUALITY_OPTIONS = [
  "Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Queer",
  "Bicurious", "Demisexual", "Asexual", "Heteroflexible", "Homoflexible",
  "Fluid", "Questioning", "Other",
].map(s => ({ value: s.toLowerCase(), label: s }));

const DESIRE_OPTIONS = [
  "Dates", "Casual", "FWB", "Friendship", "Kink", "BDSM", "Couples",
  "ENM", "Poly", "Group", "Sensual", "Connection", "Cuddling",
  "Dom", "Sub", "GGG", "Threeway", "Watching",
].map(d => ({ value: d.toLowerCase(), label: d }));

const RELATIONSHIP_STYLE_OPTIONS = [
  { value: "polyamory", label: "Polyamory", description: "Multiple loving relationships" },
  { value: "open-relationship", label: "Open Relationship", description: "Primary partner + outside connections" },
  { value: "swinging", label: "Swinging", description: "Recreational experiences with others" },
  { value: "relationship-anarchy", label: "Relationship Anarchy", description: "No hierarchy or labels" },
  { value: "monogamish", label: "Monogamish", description: "Mostly monogamous with flexibility" },
  { value: "hierarchical-poly", label: "Hierarchical Poly", description: "Primary + secondary structure" },
  { value: "solo-poly", label: "Solo Poly", description: "Your own primary partner" },
  { value: "exploring", label: "Exploring ENM", description: "New to this, learning what fits" },
];

const RELATIONSHIP_STATUS_OPTIONS = [
  "Single", "Partnered", "Married", "Dating", "In a polycule",
  "Nesting partner", "Separated", "It's complicated",
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "curious", label: "Curious", description: "Just learning about ENM" },
  { value: "new", label: "New", description: "< 1 year of experience" },
  { value: "experienced", label: "Experienced", description: "1-5 years" },
  { value: "veteran", label: "Veteran", description: "5+ years" },
];

const ZODIAC_OPTIONS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "German", "Portuguese", "Italian",
  "Mandarin", "Japanese", "Korean", "Arabic", "Hindi", "Russian",
  "Dutch", "Swedish", "ASL", "Other",
].map(l => ({ value: l.toLowerCase(), label: l }));

const LIFESTYLE_CATEGORIES = [
  { key: "smoking", label: "Smoking", options: ["Never", "Socially", "Regularly"] },
  { key: "drinking", label: "Drinking", options: ["Never", "Socially", "Regularly"] },
  { key: "cannabis", label: "Cannabis", options: ["Never", "Socially", "Regularly"] },
  { key: "exercise", label: "Exercise", options: ["Never", "Sometimes", "Active", "Daily"] },
  { key: "diet", label: "Diet", options: ["No preference", "Vegetarian", "Vegan", "Keto", "Other"] },
  { key: "pets", label: "Pets", options: ["None", "Cat", "Dog", "Both", "Other"] },
  { key: "kids", label: "Kids", options: ["Don't have", "Have kids", "Want someday", "Don't want"] },
];

const INTERESTS_OPTIONS = [
  "Travel", "Music", "Art", "Reading", "Fitness", "Cooking", "Gaming",
  "Photography", "Dancing", "Hiking", "Movies", "Podcasts", "Yoga",
  "Meditation", "Volunteering", "Nightlife", "Wine & Spirits", "Board Games",
  "Writing", "Fashion", "Theater", "Gardening", "Cycling", "Running",
  "Swimming", "Camping", "Concerts", "Museums", "Comedy", "Karaoke",
  "Crafts", "Tattoos", "Astrology", "Festivals", "Road Trips",
];

const PHASES = [
  { label: "Identity", steps: [1, 2, 3] },
  { label: "Sexuality", steps: [4, 5] },
  { label: "Relationship", steps: [6, 7] },
  { label: "About You", steps: [8, 9, 10] },
  { label: "Your Story", steps: [11, 12] },
];

const TOTAL_STEPS = 12;

// ── Component ──

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [userName, setUserName] = useState("");
  const [userAge, setUserAge] = useState<number | undefined>();
  const [userId, setUserId] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gender: "",
    pronouns: "",
    customPronouns: "",
    sexuality: "",
    desires: [] as string[],
    relationshipStyle: "",
    relationshipStatus: "",
    experienceLevel: "",
    heightCm: null as number | null,
    zodiacSign: "",
    languages: [] as string[],
    lifestyle: {} as Record<string, string>,
    interests: [] as string[],
    bio: "",
    boundaries: "",
    location: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);
    const { data: profile } = await supabase.from("profiles").select("name, age, profile_image").eq("id", session.user.id).single();
    if (profile) {
      setUserName(profile.name);
      setUserAge(profile.age);
      setProfileImage(profile.profile_image);
    }
    const { data: photoData } = await supabase.from("user_photos").select("*").eq("user_id", session.user.id).order("order_index");
    if (photoData) setPhotos(photoData);
  };

  const reloadPhotos = async () => {
    if (!userId) return;
    const { data } = await supabase.from("user_photos").select("*").eq("user_id", userId).order("order_index");
    if (data) setPhotos(data);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: 'interests' | 'desires' | 'languages', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((i: string) => i !== value)
        : [...prev[field], value],
    }));
  };

  const goNext = () => {
    if (!validateStep()) return;
    setDirection("forward");
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection("backward");
    setStep(s => Math.max(s - 1, 1));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 2:
        if (!formData.gender) { toast.error("Please select your gender"); return false; }
        return true;
      case 3:
        if (!formData.pronouns && !formData.customPronouns.trim()) { toast.error("Please select or enter your pronouns"); return false; }
        return true;
      case 6:
        if (!formData.relationshipStyle) { toast.error("Please select your relationship style"); return false; }
        return true;
      case 7:
        if (!formData.relationshipStatus) { toast.error("Please select your status"); return false; }
        return true;
      case 10:
        if (formData.interests.length < 3) { toast.error("Please select at least 3 interests"); return false; }
        return true;
      case 11:
        if (!formData.location.trim()) { toast.error("Please enter your location"); return false; }
        return true;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const pronounsValue = formData.customPronouns.trim() || formData.pronouns;

      const { error } = await supabase
        .from("profiles")
        .update({
          pronouns: pronounsValue,
          gender: formData.gender || null,
          sexuality: formData.sexuality || null,
          desires: formData.desires.length > 0 ? formData.desires : null,
          relationship_style: formData.relationshipStyle,
          relationship_status: formData.relationshipStatus,
          experience_level: formData.experienceLevel || "curious",
          looking_for: formData.desires.join(", ") || null,
          bio: formData.bio.trim() || null,
          interests: formData.interests,
          location: formData.location.trim(),
          boundaries: formData.boundaries.trim() || null,
          height_cm: formData.heightCm,
          zodiac_sign: formData.zodiacSign || null,
          languages: formData.languages.length > 0 ? formData.languages : null,
          lifestyle: Object.keys(formData.lifestyle).length > 0 ? formData.lifestyle : null,
          onboarding_completed: true,
        } as any)
        .eq("id", session.user.id);

      if (error) throw error;
      toast.success("Welcome to Positive Thots! 💕");
      navigate("/learn");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error("Failed to complete profile setup");
    } finally {
      setLoading(false);
    }
  };

  const currentPhase = PHASES.find(p => p.steps.includes(step));
  const phaseIndex = PHASES.findIndex(p => p.steps.includes(step));

  const isOptionalStep = [4, 5, 8, 9].includes(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Phase indicator */}
        <div className="mb-4 flex items-center justify-center gap-1">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex items-center">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                i === phaseIndex ? "bg-primary text-primary-foreground" : i < phaseIndex ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}>
                {phase.label}
              </span>
              {i < PHASES.length - 1 && <div className="w-2" />}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="flex gap-0.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-primary" : i === step ? "bg-primary/40" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="shadow-[var(--shadow-elevated)] overflow-hidden">
          <CardContent className="p-6">
            <StepTransition stepKey={step} direction={direction}>
              {/* Step 1: Welcome */}
              {step === 1 && (
                <div className="text-center space-y-6 py-4">
                  <Logo size="lg" />
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">
                      Hey, {userName}! <Sparkles className="inline h-7 w-7 text-primary" />
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Let's set up your profile so you can start making meaningful connections.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">This takes about 3 minutes</p>
                  <Button onClick={goNext} className="w-full text-lg h-12">
                    Let's Go <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              )}

              {/* Step 2: Gender */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">How do you identify?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select what fits you best</p>
                  </div>
                  <ChipSelector
                    options={GENDER_OPTIONS}
                    selected={formData.gender ? [formData.gender] : []}
                    onToggle={(v) => updateField("gender", formData.gender === v ? "" : v)}
                    max={1}
                    columns={2}
                  />
                </div>
              )}

              {/* Step 3: Pronouns */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your pronouns</h2>
                    <p className="text-sm text-muted-foreground mt-1">Displayed on your profile</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRONOUN_PRESETS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { updateField("pronouns", formData.pronouns === p ? "" : p); updateField("customPronouns", ""); }}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                          ${formData.pronouns === p
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/50"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Or type your own</Label>
                    <Input
                      placeholder="e.g., ze/zir"
                      value={formData.customPronouns}
                      onChange={(e) => { updateField("customPronouns", e.target.value); updateField("pronouns", ""); }}
                      maxLength={50}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Sexuality */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your sexuality</h2>
                    <p className="text-sm text-muted-foreground mt-1">This is shown on your profile</p>
                  </div>
                  <ChipSelector
                    options={SEXUALITY_OPTIONS}
                    selected={formData.sexuality ? [formData.sexuality] : []}
                    onToggle={(v) => updateField("sexuality", formData.sexuality === v ? "" : v)}
                    max={1}
                    columns={2}
                  />
                </div>
              )}

              {/* Step 5: Desires */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">What are you looking for?</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select up to 10 — be honest!
                      <GlossaryTooltip term="ENM" />
                      <GlossaryTooltip term="GGG" />
                      <GlossaryTooltip term="FWB" />
                    </p>
                  </div>
                  <ChipSelector
                    options={DESIRE_OPTIONS}
                    selected={formData.desires}
                    onToggle={(v) => toggleArray("desires", v)}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground text-center">{formData.desires.length}/10 selected</p>
                </div>
              )}

              {/* Step 6: Relationship Style */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Relationship style</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      How do you approach relationships?
                      <GlossaryTooltip term="Solo Poly" />
                      <GlossaryTooltip term="Relationship Anarchy" />
                    </p>
                  </div>
                  <div className="space-y-2">
                    {RELATIONSHIP_STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField("relationshipStyle", opt.value)}
                        className={`w-full text-left rounded-xl px-4 py-3 border transition-all duration-200
                          ${formData.relationshipStyle === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/50"
                          }`}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className={`block text-sm mt-0.5 ${formData.relationshipStyle === opt.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7: Relationship Status */}
              {step === 7 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Current status</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Where are you right now?
                      <GlossaryTooltip term="Nesting Partner" />
                      <GlossaryTooltip term="Polycule" />
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {RELATIONSHIP_STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateField("relationshipStatus", status.toLowerCase())}
                        className={`rounded-xl px-3 py-3 text-sm font-medium border transition-all duration-200
                          ${formData.relationshipStatus === status.toLowerCase()
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/50"
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 8: Height, Zodiac, Languages */}
              {step === 8 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">A bit more about you</h2>
                    <p className="text-sm text-muted-foreground mt-1">All optional — share what you like</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Height</Label>
                    <HeightSlider value={formData.heightCm} onChange={(v) => updateField("heightCm", v)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Zodiac Sign</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {ZODIAC_OPTIONS.map(z => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => updateField("zodiacSign", formData.zodiacSign === z ? "" : z)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all
                            ${formData.zodiacSign === z
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-primary/50"
                            }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Languages</Label>
                    <ChipSelector
                      options={LANGUAGE_OPTIONS}
                      selected={formData.languages}
                      onToggle={(v) => toggleArray("languages", v)}
                      columns={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 9: Lifestyle */}
              {step === 9 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Lifestyle</h2>
                    <p className="text-sm text-muted-foreground mt-1">These appear as badges on your profile</p>
                  </div>
                  {LIFESTYLE_CATEGORIES.map(cat => (
                    <div key={cat.key} className="space-y-1.5">
                      <Label className="text-sm font-medium">{cat.label}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.options.map(opt => {
                          const selected = formData.lifestyle[cat.key] === opt.toLowerCase();
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => updateField("lifestyle", {
                                ...formData.lifestyle,
                                [cat.key]: selected ? undefined : opt.toLowerCase(),
                              })}
                              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all
                                ${selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card text-foreground border-border hover:border-primary/50"
                                }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 10: Interests */}
              {step === 10 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Your interests</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select at least 3</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS_OPTIONS.map(interest => {
                      const sel = formData.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleArray("interests", interest)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-200
                            ${sel
                              ? "bg-primary text-primary-foreground border-primary scale-105"
                              : "bg-card text-foreground border-border hover:border-primary/50"
                            }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{formData.interests.length} selected (min 3)</p>
                </div>
              )}

              {/* Step 11: Bio, Boundaries, Location */}
              {step === 11 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Tell your story</h2>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (City-level)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Portland, OR"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">About You</Label>
                    <Textarea
                      id="bio"
                      placeholder="Share your journey, what excites you, what makes you unique..."
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      maxLength={500}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boundaries">Boundaries & Preferences (Optional)</Label>
                    <Textarea
                      id="boundaries"
                      placeholder="Any important boundaries potential connections should know..."
                      value={formData.boundaries}
                      onChange={(e) => updateField("boundaries", e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 12: Photos & Preview */}
              {step === 12 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Photos & Preview</h2>
                    <p className="text-sm text-muted-foreground mt-1">Add photos and see how your profile looks</p>
                  </div>

                  {userId && (
                    <PhotoUploadGrid
                      userId={userId}
                      photos={photos}
                      onPhotosChange={reloadPhotos}
                    />
                  )}

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Profile Preview</p>
                    <ProfilePreview
                      name={userName}
                      age={userAge}
                      pronouns={formData.customPronouns.trim() || formData.pronouns}
                      gender={GENDER_OPTIONS.find(g => g.value === formData.gender)?.label || formData.gender}
                      sexuality={SEXUALITY_OPTIONS.find(s => s.value === formData.sexuality)?.label || formData.sexuality}
                      relationshipStyle={RELATIONSHIP_STYLE_OPTIONS.find(r => r.value === formData.relationshipStyle)?.label || formData.relationshipStyle}
                      location={formData.location}
                      bio={formData.bio}
                      interests={formData.interests}
                      desires={formData.desires.map(d => DESIRE_OPTIONS.find(o => o.value === d)?.label || d)}
                      heightCm={formData.heightCm}
                      zodiacSign={formData.zodiacSign}
                      profileImage={profileImage}
                    />
                  </div>
                </div>
              )}
            </StepTransition>

            {/* Navigation buttons */}
            {step > 1 && (
              <div className="flex gap-2 mt-6">
                <Button onClick={goBack} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {step < TOTAL_STEPS ? (
                  <>
                    {isOptionalStep && (
                      <Button onClick={goNext} variant="ghost" className="px-3">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    )}
                    <Button onClick={goNext} className="flex-1">
                      Continue <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleComplete} className="flex-1" disabled={loading}>
                    {loading ? "Setting up..." : "Complete Profile ✨"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { StepTransition } from "@/components/onboarding/StepTransition";
import { ChipSelector } from "@/components/onboarding/ChipSelector";
import { HeightSlider } from "@/components/onboarding/HeightSlider";
import { GlossaryTooltip } from "@/components/onboarding/GlossaryTooltip";
import { ProfilePreview } from "@/components/onboarding/ProfilePreview";
import { PhotoUploadGrid } from "@/components/PhotoUploadGrid";
import { MicroCelebration } from "@/components/onboarding/MicroCelebration";
import { PhaseInterstitial } from "@/components/onboarding/PhaseInterstitial";
import { ProgressRing } from "@/components/onboarding/ProgressRing";
import { MiniProfilePreview } from "@/components/onboarding/MiniProfilePreview";
import { StepHeader } from "@/components/onboarding/StepHeader";

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
  { key: "smoking", label: "🚬 Smoking", options: ["Never", "Socially", "Regularly"] },
  { key: "drinking", label: "🍷 Drinking", options: ["Never", "Socially", "Regularly"] },
  { key: "cannabis", label: "🌿 Cannabis", options: ["Never", "Socially", "Regularly"] },
  { key: "exercise", label: "💪 Exercise", options: ["Never", "Sometimes", "Active", "Daily"] },
  { key: "diet", label: "🥗 Diet", options: ["No preference", "Vegetarian", "Vegan", "Keto", "Other"] },
  { key: "pets", label: "🐾 Pets", options: ["None", "Cat", "Dog", "Both", "Other"] },
  { key: "kids", label: "👶 Kids", options: ["Don't have", "Have kids", "Want someday", "Don't want"] },
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
  { label: "Identity", steps: [1, 2, 3], emoji: "🌈" },
  { label: "Sexuality", steps: [4, 5], emoji: "🔥" },
  { label: "Relationship", steps: [6, 7], emoji: "🔗" },
  { label: "About You", steps: [8, 9, 10], emoji: "✨" },
  { label: "Your Story", steps: [11, 12], emoji: "📖" },
];

const STEP_EMOJIS: Record<number, string> = {
  1: "👋", 2: "🌈", 3: "💬", 4: "🔥", 5: "⭐",
  6: "🔗", 7: "💜", 8: "📏", 9: "🌿", 10: "🎨",
  11: "✍️", 12: "📸",
};

const PHASE_GRADIENTS: Record<number, string> = {
  0: "from-primary/10 via-background to-accent/10",
  1: "from-secondary/10 via-background to-primary/10",
  2: "from-accent/10 via-background to-secondary/10",
  3: "from-primary/10 via-accent/5 to-secondary/10",
  4: "from-secondary/10 via-primary/5 to-accent/10",
};

const PHASE_INTERSTITIALS = [
  { emoji: "🔥", message: "Identity locked in!", nextPhase: "Now let's explore your desires..." },
  { emoji: "💜", message: "Looking good so far!", nextPhase: "Tell us about your relationships..." },
  { emoji: "⭐", message: "Almost there!", nextPhase: "A few more things about you..." },
  { emoji: "📖", message: "The fun part!", nextPhase: "Share your story..." },
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
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialData, setInterstitialData] = useState({ emoji: "", message: "", nextPhase: "" });

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
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (profile) {
      setUserName(profile.name);
      setUserAge(profile.age);
      setProfileImage(profile.profile_image);

      // Resume onboarding from saved progress
      const saved: Partial<typeof formData> = {};
      if (profile.gender) saved.gender = profile.gender;
      if (profile.pronouns) saved.pronouns = profile.pronouns;
      if (profile.sexuality) saved.sexuality = profile.sexuality;
      if (profile.desires?.length) saved.desires = profile.desires;
      if (profile.relationship_style) saved.relationshipStyle = profile.relationship_style;
      if (profile.relationship_status) saved.relationshipStatus = profile.relationship_status;
      if (profile.experience_level && profile.experience_level !== "curious") saved.experienceLevel = profile.experience_level;
      if (profile.height_cm) saved.heightCm = profile.height_cm;
      if (profile.zodiac_sign) saved.zodiacSign = profile.zodiac_sign;
      if (profile.languages?.length) saved.languages = profile.languages;
      if (profile.lifestyle) saved.lifestyle = profile.lifestyle as Record<string, string>;
      if (profile.interests?.length) saved.interests = profile.interests;
      if (profile.bio) saved.bio = profile.bio;
      if (profile.boundaries) saved.boundaries = profile.boundaries;
      if (profile.location) saved.location = profile.location;

      if (Object.keys(saved).length > 0) {
        setFormData(prev => ({ ...prev, ...saved }));
        // Jump to the furthest incomplete step
        const stepFields: Record<number, () => boolean> = {
          2: () => !!saved.gender,
          3: () => !!saved.pronouns,
          4: () => !!saved.sexuality,
          5: () => (saved.desires?.length ?? 0) > 0,
          6: () => !!saved.relationshipStyle,
          7: () => !!saved.relationshipStatus,
          8: () => !!saved.experienceLevel,
          9: () => !!saved.heightCm || !!saved.zodiacSign,
          10: () => (saved.interests?.length ?? 0) >= 3,
          11: () => !!saved.location,
        };
        let resumeStep = 1;
        for (let s = 2; s <= 11; s++) {
          if (stepFields[s]?.()) resumeStep = s + 1;
          else break;
        }
        if (resumeStep > 1 && resumeStep <= TOTAL_STEPS) setStep(resumeStep);
      }
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

  // Check if advancing to next step crosses a phase boundary
  const isPhaseTransition = useCallback((currentStep: number): number | null => {
    const currentPhaseIdx = PHASES.findIndex(p => p.steps.includes(currentStep));
    const nextPhaseIdx = PHASES.findIndex(p => p.steps.includes(currentStep + 1));
    if (currentPhaseIdx !== -1 && nextPhaseIdx !== -1 && currentPhaseIdx !== nextPhaseIdx) {
      return currentPhaseIdx; // returns the index of the interstitial to show
    }
    return null;
  }, []);

  const goNext = () => {
    if (!validateStep()) return;
    setCelebrationTrigger(t => t + 1);
    
    const phaseTransition = isPhaseTransition(step);
    if (phaseTransition !== null && phaseTransition < PHASE_INTERSTITIALS.length) {
      const data = PHASE_INTERSTITIALS[phaseTransition];
      setInterstitialData(data);
      setShowInterstitial(true);
    } else {
      advanceStep();
    }
  };

  const advanceStep = async () => {
    setDirection("forward");
    setStep(s => Math.min(s + 1, TOTAL_STEPS));

    // Save progress after each step
    if (userId) {
      const pronounsValue = formData.customPronouns.trim() || formData.pronouns;
      await supabase.from("profiles").update({
        pronouns: pronounsValue || null,
        gender: formData.gender || null,
        sexuality: formData.sexuality || null,
        desires: formData.desires.length > 0 ? formData.desires : null,
        relationship_style: formData.relationshipStyle || null,
        relationship_status: formData.relationshipStatus || null,
        experience_level: formData.experienceLevel || "curious",
        bio: formData.bio.trim() || null,
        interests: formData.interests.length > 0 ? formData.interests : null,
        location: formData.location.trim() || null,
        boundaries: formData.boundaries.trim() || null,
        height_cm: formData.heightCm,
        zodiac_sign: formData.zodiacSign || null,
        languages: formData.languages.length > 0 ? formData.languages : null,
        lifestyle: Object.keys(formData.lifestyle).length > 0 ? formData.lifestyle : null,
      } as any).eq("id", userId);
    }
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

  const phaseIndex = PHASES.findIndex(p => p.steps.includes(step));
  const currentPhase = PHASES[phaseIndex];
  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const isOptionalStep = [4, 5, 8, 9].includes(step);
  const showMiniPreview = step >= 8 && step < 12;

  // Mini-preview fields
  const miniFields = [
    { label: "Gender", value: GENDER_OPTIONS.find(g => g.value === formData.gender)?.label || "" },
    { label: "Sexuality", value: SEXUALITY_OPTIONS.find(s => s.value === formData.sexuality)?.label || "" },
    { label: "Style", value: RELATIONSHIP_STYLE_OPTIONS.find(r => r.value === formData.relationshipStyle)?.label || "" },
    { label: "Location", value: formData.location },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${PHASE_GRADIENTS[phaseIndex] || PHASE_GRADIENTS[0]} transition-all duration-700 flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-blob-float" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl animate-blob-float" style={{ animationDelay: "-6s" }} />
        <div className="absolute top-1/3 right-0 w-56 h-56 rounded-full bg-accent/5 blur-3xl animate-blob-float" style={{ animationDelay: "-12s" }} />
      </div>

      <MicroCelebration trigger={celebrationTrigger} />
      <PhaseInterstitial
        show={showInterstitial}
        emoji={interstitialData.emoji}
        message={interstitialData.message}
        nextPhase={interstitialData.nextPhase}
        onComplete={() => { setShowInterstitial(false); advanceStep(); }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Progress ring + phase label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ProgressRing
              progress={progress}
              phaseEmoji={currentPhase?.emoji || "👋"}
            />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                {currentPhase?.label || "Welcome"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Step {step} of {TOTAL_STEPS}
              </p>
            </div>
          </div>
          {/* Phase dots */}
          <div className="flex gap-1.5">
            {PHASES.map((phase, i) => (
              <div
                key={phase.label}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === phaseIndex
                    ? "w-6 bg-primary"
                    : i < phaseIndex
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="shadow-[var(--shadow-elevated)] overflow-hidden border-border/50 backdrop-blur-sm bg-card/95">
          <CardContent className="p-6">
            <StepTransition stepKey={step} direction={direction}>
              {/* Step 1: Welcome */}
              {step === 1 && (
                <div className="text-center space-y-6 py-4">
                  <span className="text-6xl block animate-bounce-in">👋</span>
                  <Logo size="lg" />
                  <div className="space-y-2 animate-stagger-1">
                    <h1 className="text-3xl font-bold text-foreground">
                      Hey, {userName}!
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Let's build your profile and start making meaningful connections.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground animate-stagger-2">
                    ⏱ Takes about 3 minutes
                  </p>
                  <Button onClick={goNext} className="w-full text-lg h-12 animate-stagger-3">
                    Let's Go <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              )}

              {/* Step 2: Gender */}
              {step === 2 && (
                <div className="space-y-4">
                  <StepHeader emoji="🌈" title="How do you identify?" subtitle="Select what fits you best" />
                  <div className="animate-stagger-2">
                    <ChipSelector
                      options={GENDER_OPTIONS}
                      selected={formData.gender ? [formData.gender] : []}
                      onToggle={(v) => updateField("gender", formData.gender === v ? "" : v)}
                      max={1}
                      columns={2}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Pronouns */}
              {step === 3 && (
                <div className="space-y-4">
                  <StepHeader emoji="💬" title="Your pronouns" subtitle="Displayed on your profile" />
                  <div className="flex flex-wrap gap-2 animate-stagger-2">
                    {PRONOUN_PRESETS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { updateField("pronouns", formData.pronouns === p ? "" : p); updateField("customPronouns", ""); }}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200
                          ${formData.pronouns === p
                            ? "bg-primary text-primary-foreground border-primary animate-chip-select"
                            : "bg-card text-foreground border-border hover:border-primary/50 active:scale-95"
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1 animate-stagger-3">
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
                  <StepHeader emoji="🔥" title="Your sexuality" subtitle="This is shown on your profile" />
                  <div className="animate-stagger-2">
                    <ChipSelector
                      options={SEXUALITY_OPTIONS}
                      selected={formData.sexuality ? [formData.sexuality] : []}
                      onToggle={(v) => updateField("sexuality", formData.sexuality === v ? "" : v)}
                      max={1}
                      columns={2}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Desires */}
              {step === 5 && (
                <div className="space-y-4">
                  <StepHeader emoji="⭐" title="What are you looking for?" subtitle="Select up to 10 — be honest!" />
                  <div className="flex gap-1 mb-2 animate-stagger-1">
                    <GlossaryTooltip term="ENM" />
                    <GlossaryTooltip term="GGG" />
                    <GlossaryTooltip term="FWB" />
                  </div>
                  <div className="animate-stagger-2">
                    <ChipSelector
                      options={DESIRE_OPTIONS}
                      selected={formData.desires}
                      onToggle={(v) => toggleArray("desires", v)}
                      max={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{formData.desires.length}/10 selected</p>
                </div>
              )}

              {/* Step 6: Relationship Style */}
              {step === 6 && (
                <div className="space-y-4">
                  <StepHeader emoji="🔗" title="Relationship style" subtitle="How do you approach relationships?" />
                  <div className="flex gap-1 mb-1 animate-stagger-1">
                    <GlossaryTooltip term="Solo Poly" />
                    <GlossaryTooltip term="Relationship Anarchy" />
                  </div>
                  <div className="space-y-2 animate-stagger-2">
                    {RELATIONSHIP_STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField("relationshipStyle", opt.value)}
                        className={`w-full text-left rounded-xl px-4 py-3 border transition-all duration-200
                          ${formData.relationshipStyle === opt.value
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-card text-foreground border-border hover:border-primary/50 active:scale-[0.98]"
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
                  <StepHeader emoji="💜" title="Current status" subtitle="Where are you right now?" />
                  <div className="flex gap-1 mb-1 animate-stagger-1">
                    <GlossaryTooltip term="Nesting Partner" />
                    <GlossaryTooltip term="Polycule" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 animate-stagger-2">
                    {RELATIONSHIP_STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateField("relationshipStatus", status.toLowerCase())}
                        className={`rounded-xl px-3 py-3 text-sm font-medium border transition-all duration-200
                          ${formData.relationshipStatus === status.toLowerCase()
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-card text-foreground border-border hover:border-primary/50 active:scale-95"
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
                  <StepHeader emoji="📏" title="A bit more about you" subtitle="All optional — share what you like" />

                  <div className="space-y-2 animate-stagger-1">
                    <Label className="text-sm font-medium">Height</Label>
                    <HeightSlider value={formData.heightCm} onChange={(v) => updateField("heightCm", v)} />
                  </div>

                  <div className="space-y-2 animate-stagger-2">
                    <Label className="text-sm font-medium">♈ Zodiac Sign</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {ZODIAC_OPTIONS.map(z => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => updateField("zodiacSign", formData.zodiacSign === z ? "" : z)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all
                            ${formData.zodiacSign === z
                              ? "bg-primary text-primary-foreground border-primary animate-chip-select"
                              : "bg-card text-foreground border-border hover:border-primary/50"
                            }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 animate-stagger-3">
                    <Label className="text-sm font-medium">🌍 Languages</Label>
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
                  <StepHeader emoji="🌿" title="Lifestyle" subtitle="These appear as badges on your profile" />
                  {LIFESTYLE_CATEGORIES.map((cat, catIdx) => (
                    <div key={cat.key} className="space-y-1.5" style={{ animationDelay: `${catIdx * 0.05}s` }}>
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
                                  ? "bg-primary text-primary-foreground border-primary animate-chip-select"
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
                  <StepHeader emoji="🎨" title="Your interests" subtitle="Select at least 3" />
                  <div className="flex flex-wrap gap-2 animate-stagger-2">
                    {INTERESTS_OPTIONS.map(interest => {
                      const sel = formData.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleArray("interests", interest)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-all duration-200
                            ${sel
                              ? "bg-primary text-primary-foreground border-primary scale-105 animate-chip-select"
                              : "bg-card text-foreground border-border hover:border-primary/50 active:scale-95"
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
                  <StepHeader emoji="✍️" title="Tell your story" />
                  <div className="space-y-2 animate-stagger-1">
                    <Label htmlFor="location">📍 Location (City-level)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Portland, OR"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2 animate-stagger-2">
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
                  <div className="space-y-2 animate-stagger-3">
                    <Label htmlFor="boundaries">🛡️ Boundaries & Preferences (Optional)</Label>
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
                  <StepHeader emoji="📸" title="Photos & Preview" subtitle="Add photos and see how your profile looks" />

                  {userId && (
                    <div className="animate-stagger-1">
                      <PhotoUploadGrid
                        userId={userId}
                        photos={photos}
                        onPhotosChange={reloadPhotos}
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-border animate-stagger-2">
                    <p className="text-sm font-medium text-foreground mb-3">✨ Profile Preview</p>
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
                      <Button onClick={goNext} variant="ghost" className="px-3" title="Skip this step">
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

      <MiniProfilePreview
        name={userName}
        profileImage={profileImage}
        fields={miniFields}
        visible={showMiniPreview}
      />
    </div>
  );
};

export default Onboarding;

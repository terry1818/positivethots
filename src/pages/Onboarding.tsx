import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ChevronRight, ChevronLeft, SkipForward, Check, Sparkles, ArrowRight } from "lucide-react";
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
import { PromptPicker } from "@/components/onboarding/PromptPicker";
import { ValuePropositionScreen } from "@/components/onboarding/ValuePropositionScreen";

// ── Option Data ──

const ENM_EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "I'm brand new to ENM 🌱", description: "Just starting to learn about ethical non-monogamy" },
  { value: "intermediate", label: "I know the basics 📚", description: "Familiar with core concepts and communication styles" },
  { value: "experienced", label: "I'm experienced 🎓", description: "Practiced ENM for a while and understand the dynamics" },
];

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
  { value: "monogamous", label: "Monogamous", description: "One committed partner" },
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

/*
 * NEW FLOW (14 steps):
 * 1  Welcome
 * 2  ENM Familiarity (NEW)
 * 3  Gender
 * 4  Pronouns
 * 5  Photo Upload (moved from 12)
 * 6  Sexuality
 * 7  Desires
 * 8  Relationship Style
 * 9  Relationship Status  → Quick Start interstitial after this
 * 10 Height / Zodiac / Languages
 * 11 Lifestyle
 * 12 Interests
 * 13 Prompts / Location / Boundaries
 * 14 Preview
 */

const PHASES = [
  { label: "Identity", steps: [1, 2, 3, 4, 5], emoji: "🌈" },
  { label: "Sexuality", steps: [6, 7], emoji: "🔥" },
  { label: "Relationship", steps: [8, 9], emoji: "🔗" },
  { label: "About You", steps: [10, 11, 12], emoji: "✨" },
  { label: "Your Story", steps: [13, 14], emoji: "📖" },
];

const STEP_EMOJIS: Record<number, string> = {
  1: "👋", 2: "🧭", 3: "🌈", 4: "💬", 5: "📸", 6: "🔥", 7: "⭐",
  8: "🔗", 9: "💜", 10: "📏", 11: "🌿", 12: "🎨", 13: "✍️", 14: "✨",
};

const PHASE_GRADIENTS: Record<number, string> = {
  0: "from-primary/10 via-background to-accent/10",
  1: "from-secondary/10 via-background to-primary/10",
  2: "from-accent/10 via-background to-secondary/10",
  3: "from-primary/10 via-accent/5 to-secondary/10",
  4: "from-secondary/10 via-primary/5 to-accent/10",
};

const PHASE_INTERSTITIALS = [
  { emoji: "📸", message: "Looking great!", nextPhase: "Now let's explore your desires...", nextUp: "Next up: Tell us about your sexuality and desires" },
  { emoji: "💜", message: "Almost browsing!", nextPhase: "Tell us about your relationships...", nextUp: "Next up: Your relationship style and status" },
  { emoji: "⭐", message: "Profile taking shape!", nextPhase: "A few more things about you...", nextUp: "Next up: The fun stuff — height, lifestyle, and interests" },
  { emoji: "📖", message: "The fun part!", nextPhase: "Share your story...", nextUp: "Next up: Share your story and finalize" },
];

const TOTAL_STEPS = 14;

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
  const [interstitialData, setInterstitialData] = useState({ emoji: "", message: "", nextPhase: "", nextUp: "" });
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showValueProp, setShowValueProp] = useState(false);

  const [formData, setFormData] = useState({
    enmExperienceLevel: "",
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
    prompts: [] as { question: string; response: string }[],
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const phase = PHASES.find(p => p.steps.includes(step));
    trackEvent('onboarding_step_viewed', { step, phase: phase?.label || 'Welcome' });
  }, [step]);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (profile) {
      setUserName(profile.name);
      setUserAge(profile.age);
      setProfileImage(profile.profile_image);

      const saved: Partial<typeof formData> = {};
      if ((profile as any).enm_experience_level && (profile as any).enm_experience_level !== 'beginner') saved.enmExperienceLevel = (profile as any).enm_experience_level;
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
        // NEW step mapping for resume
        const stepFields: Record<number, () => boolean> = {
          2: () => !!saved.enmExperienceLevel,
          3: () => !!saved.gender,
          4: () => !!saved.pronouns,
          // Step 5 (photos) - check if they have photos
          6: () => !!saved.sexuality,
          7: () => (saved.desires?.length ?? 0) > 0,
          8: () => !!saved.relationshipStyle,
          9: () => !!saved.relationshipStatus,
          10: () => !!saved.experienceLevel,
          11: () => !!saved.heightCm || !!saved.zodiacSign,
          12: () => (saved.interests?.length ?? 0) >= 3,
          13: () => !!saved.location,
        };
        let resumeStep = 1;
        for (let s = 2; s <= 13; s++) {
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

  const isPhaseTransition = useCallback((currentStep: number): number | null => {
    const currentPhaseIdx = PHASES.findIndex(p => p.steps.includes(currentStep));
    const nextPhaseIdx = PHASES.findIndex(p => p.steps.includes(currentStep + 1));
    if (currentPhaseIdx !== -1 && nextPhaseIdx !== -1 && currentPhaseIdx !== nextPhaseIdx) {
      return currentPhaseIdx;
    }
    return null;
  }, []);

  const goNext = () => {
    if (!validateStep()) return;

    const phase = PHASES.find(p => p.steps.includes(step));
    trackEvent('onboarding_step_completed', { step, phase: phase?.label || 'Welcome' });

    setCelebrationTrigger(t => t + 1);

    // Show Quick Start after step 9 (Relationship Status)
    if (step === 9) {
      setShowQuickStart(true);
      return;
    }

    const phaseTransition = isPhaseTransition(step);
    if (phaseTransition !== null && phaseTransition < PHASE_INTERSTITIALS.length) {
      trackEvent('onboarding_phase_completed', { phase: phase?.label || 'Welcome' });
      const data = PHASE_INTERSTITIALS[phaseTransition];
      setInterstitialData(data);
      setShowInterstitial(true);
    } else {
      advanceStep();
    }
  };

  const handleQuickStart = async () => {
    // Save current progress and go to Discovery
    trackEvent('onboarding_quick_start', { step: 9 });
    if (userId) {
      const pronounsValue = formData.customPronouns.trim() || formData.pronouns;
      await supabase.from("profiles").update({
        enm_experience_level: formData.enmExperienceLevel || 'beginner',
        pronouns: pronounsValue || null,
        gender: formData.gender || null,
        sexuality: formData.sexuality || null,
        desires: formData.desires.length > 0 ? formData.desires : null,
        relationship_style: formData.relationshipStyle || null,
        relationship_status: formData.relationshipStatus || null,
        experience_level: formData.experienceLevel || "curious",
        onboarding_completed: true,
      } as any).eq("id", userId);
    }
    toast.success("Let's explore! 💜", { description: "Complete your profile anytime for better matches." });
    navigate("/");
  };

  const advanceStep = async () => {
    setDirection("forward");
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(nextStep);

    if (nextStep === 3 && userId) {
      supabase.from("profiles")
        .select("onboarding_started_at")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data && !data.onboarding_started_at) {
            supabase.from("profiles")
              .update({ onboarding_started_at: new Date().toISOString() } as any)
              .eq("id", userId)
              .then(() => {});
          }
        });
    }

    if (userId) {
      const pronounsValue = formData.customPronouns.trim() || formData.pronouns;
      await supabase.from("profiles").update({
        enm_experience_level: formData.enmExperienceLevel || 'beginner',
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
        if (!formData.enmExperienceLevel) { toast.error("Please select your experience level"); return false; }
        return true;
      case 3:
        if (!formData.gender) { toast.error("Please select your gender"); return false; }
        return true;
      case 4:
        if (!formData.pronouns && !formData.customPronouns.trim()) { toast.error("Please select or enter your pronouns"); return false; }
        return true;
      case 5:
        if (photos.length === 0) { toast.error("Please upload at least 1 photo"); return false; }
        return true;
      case 8:
        if (!formData.relationshipStyle) { toast.error("Please select your relationship style"); return false; }
        return true;
      case 9:
        if (!formData.relationshipStatus) { toast.error("Please select your status"); return false; }
        return true;
      case 12:
        if (formData.interests.length < 3) { toast.error("Please select at least 3 interests"); return false; }
        return true;
      case 13:
        if (!formData.location.trim()) { toast.error("Please enter your location"); return false; }
        if (formData.prompts.filter(p => p.response.trim()).length < 2) { toast.error("Please answer at least 2 prompts"); return false; }
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
          enm_experience_level: formData.enmExperienceLevel || 'beginner',
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

      if (formData.prompts.length > 0) {
        await supabase.from("profile_prompts" as any).delete().eq("user_id", session.user.id);
        const promptRows = formData.prompts
          .filter(p => p.response.trim())
          .map((p, i) => ({
            user_id: session.user.id,
            prompt_question: p.question,
            prompt_response: p.response.trim(),
            display_order: i,
          }));
        if (promptRows.length > 0) {
          await supabase.from("profile_prompts" as any).insert(promptRows);
        }
      }

      trackEvent('onboarding_completed', {});
      toast.success("Welcome to Positive Thots! 💕");
      setShowValueProp(true);
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
  const isOptionalStep = [6, 7, 10, 11].includes(step);
  const showMiniPreview = step >= 10 && step < 14;

  const miniFields = [
    { label: "Gender", value: GENDER_OPTIONS.find(g => g.value === formData.gender)?.label || "" },
    { label: "Sexuality", value: SEXUALITY_OPTIONS.find(s => s.value === formData.sexuality)?.label || "" },
    { label: "Style", value: RELATIONSHIP_STYLE_OPTIONS.find(r => r.value === formData.relationshipStyle)?.label || "" },
    { label: "Location", value: formData.location },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${PHASE_GRADIENTS[phaseIndex] || PHASE_GRADIENTS[0]} transition-all duration-700 flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-blob-float" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl animate-blob-float" style={{ animationDelay: "-6s" }} />
        <div className="absolute top-1/3 right-0 w-56 h-56 rounded-full bg-accent/5 blur-3xl animate-blob-float" style={{ animationDelay: "-12s" }} />
      </div>

      {showValueProp && (
        <ValuePropositionScreen onBegin={() => navigate("/learn")} />
      )}

      <MicroCelebration trigger={celebrationTrigger} />
      <PhaseInterstitial
        show={showInterstitial}
        emoji={interstitialData.emoji}
        message={interstitialData.message}
        nextPhase={interstitialData.nextPhase}
        nextUp={interstitialData.nextUp}
        onComplete={() => { setShowInterstitial(false); advanceStep(); }}
      />

      {/* Quick Start Modal */}
      {showQuickStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="max-w-sm w-full shadow-2xl border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-6 text-center">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold">You're ready to explore!</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Start browsing profiles now, or continue personalizing your profile for better matches.
              </p>
            </div>
            <CardContent className="p-6 space-y-3">
              <Button onClick={handleQuickStart} className="w-full text-lg h-12" size="lg">
                Start Exploring <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                onClick={() => { setShowQuickStart(false); advanceStep(); }}
                variant="outline"
                className="w-full"
              >
                Keep Going — More to share
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You can always complete your profile later from Settings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
          <CardContent className="p-6 relative">
            {/* Skip button for optional steps */}
            {isOptionalStep && step > 1 && step < TOTAL_STEPS && (
              <button
                onClick={() => { trackEvent('onboarding_skipped', { step }); goNext(); }}
                className="absolute top-2 right-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10"
                aria-label="Skip this step"
              >
                Skip for now →
              </button>
            )}
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
                    ⏱ Takes about 3-5 minutes
                  </p>
                  <Button onClick={goNext} className="w-full text-lg h-12 animate-stagger-3">
                    Let's Go <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              )}

              {/* Step 2: ENM Familiarity (NEW) */}
              {step === 2 && (
                <div className="space-y-4">
                  <StepHeader emoji="🧭" title="How familiar are you with ethical non-monogamy?" subtitle="This helps us personalize your experience · Required" />
                  <div className="space-y-2 animate-stagger-2">
                    {ENM_EXPERIENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateField("enmExperienceLevel", opt.value)}
                        className={`relative w-full text-left rounded-xl px-4 py-3 border transition-all duration-200
                          ${formData.enmExperienceLevel === opt.value
                            ? "bg-primary text-primary-foreground border-primary shadow-md"
                            : "bg-card text-foreground border-border hover:border-primary/50 active:scale-[0.98]"
                          }`}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className={`block text-sm mt-0.5 ${formData.enmExperienceLevel === opt.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Gender */}
              {step === 3 && (
                <div className="space-y-4">
                  <StepHeader emoji="🌈" title="How do you identify?" subtitle="Select what fits you best · Required" />
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

              {/* Step 4: Pronouns */}
              {step === 4 && (
                <div className="space-y-4">
                  <StepHeader emoji="💬" title="Your pronouns" subtitle="Displayed on your profile · Required" />
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

              {/* Step 5: Photo Upload (moved earlier) */}
              {step === 5 && (
                <div className="space-y-4">
                  <StepHeader emoji="📸" title="Add a photo" subtitle="At least 1 photo required · Required" />
                  {userId && (
                    <div className="animate-stagger-1">
                      <PhotoUploadGrid
                        userId={userId}
                        photos={photos}
                        onPhotosChange={reloadPhotos}
                      />
                    </div>
                  )}
                  {photos.length === 0 && (
                    <p className="text-xs text-destructive text-center">Upload at least 1 photo to continue</p>
                  )}
                </div>
              )}

              {/* Step 6: Sexuality */}
              {step === 6 && (
                <div className="space-y-4">
                  <StepHeader emoji="🔥" title="Your sexuality" subtitle="This is shown on your profile · Optional" />
                  <div className="animate-stagger-2">
                    <ChipSelector
                      options={SEXUALITY_OPTIONS}
                      selected={formData.sexuality ? [formData.sexuality] : []}
                      onToggle={(v) => updateField("sexuality", formData.sexuality === v ? "" : v)}
                      max={1}
                      columns={2}
                      popularOptions={["Bisexual", "Pansexual", "Straight", "Queer", "Heteroflexible"]}
                    />
                  </div>
                </div>
              )}

              {/* Step 7: Desires */}
              {step === 7 && (
                <div className="space-y-4">
                  <StepHeader emoji="⭐" title="What are you looking for?" subtitle="Select up to 10 — be honest! · Optional" />
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
                      popularOptions={["Casual", "Friendship", "Poly", "Kink", "Connection", "Group"]}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{formData.desires.length}/10 selected</p>
                </div>
              )}

              {/* Step 8: Relationship Style */}
              {step === 8 && (
                <div className="space-y-4">
                  <StepHeader emoji="🔗" title="Relationship style" subtitle="How do you approach relationships? · Required" />
                  <div className="flex gap-1 mb-1 animate-stagger-1">
                    <GlossaryTooltip term="Solo Poly" />
                    <GlossaryTooltip term="Relationship Anarchy" />
                  </div>
                  <div className="space-y-2 animate-stagger-2">
                    {RELATIONSHIP_STYLE_OPTIONS.map(opt => {
                      const isPopular = ["polyamory", "open-relationship", "monogamous"].includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateField("relationshipStyle", opt.value)}
                          className={`relative w-full text-left rounded-xl px-4 py-3 border transition-all duration-200
                            ${formData.relationshipStyle === opt.value
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-card text-foreground border-border hover:border-primary/50 active:scale-[0.98]"
                            }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span className={`block text-sm mt-0.5 ${formData.relationshipStyle === opt.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {opt.description}
                          </span>
                          {isPopular && formData.relationshipStyle !== opt.value && (
                            <span className="absolute top-2.5 right-3 text-[10px] text-primary/60 font-medium">Popular</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 9: Relationship Status */}
              {step === 9 && (
                <div className="space-y-4">
                  <StepHeader emoji="💜" title="Current status" subtitle="Where are you right now? · Required" />
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

              {/* Step 10: Height, Zodiac, Languages */}
              {step === 10 && (
                <div className="space-y-6">
                  <StepHeader emoji="📏" title="A bit more about you" subtitle="All optional — share what you like · Optional" />
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

              {/* Step 11: Lifestyle */}
              {step === 11 && (
                <div className="space-y-5">
                  <StepHeader emoji="🌿" title="Lifestyle" subtitle="These appear as badges on your profile · Optional" />
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

              {/* Step 12: Interests */}
              {step === 12 && (
                <div className="space-y-4">
                  <StepHeader emoji="🎨" title="Your interests" subtitle="Select at least 3" />
                  <div className="animate-stagger-2">
                    <ChipSelector
                      options={INTERESTS_OPTIONS.map(i => ({ value: i, label: i }))}
                      selected={formData.interests}
                      onToggle={(v) => toggleArray("interests", v)}
                      popularOptions={["Travel", "Music", "Fitness", "Cooking", "Hiking", "Movies", "Yoga", "Nightlife", "Concerts", "Festivals"]}
                      groupPopularFirst
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{formData.interests.length} selected (min 3)</p>
                </div>
              )}

              {/* Step 13: Prompts, Boundaries, Location */}
              {step === 13 && (
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
                  <div className="animate-stagger-2">
                    <Label className="text-sm font-medium mb-2 block">💬 Profile Prompts</Label>
                    <PromptPicker
                      answers={formData.prompts}
                      onChange={(prompts) => updateField("prompts", prompts)}
                    />
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

              {/* Step 14: Preview */}
              {step === 14 && (
                <div className="space-y-6">
                  <StepHeader emoji="✨" title="Your Profile Preview" subtitle="Here's how others will see you" />
                  <div className="animate-stagger-1">
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
              <div className="flex gap-2 mt-6 pb-16 relative z-50">
                <Button onClick={goBack} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {step < TOTAL_STEPS ? (
                  <>
                    {isOptionalStep && (
                      <Button onClick={() => { trackEvent('onboarding_skipped', { step }); goNext(); }} variant="ghost" className="px-3" title="Skip this step">
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

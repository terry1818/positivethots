import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const INTERESTS_OPTIONS = [
  "Travel", "Music", "Art", "Reading", "Fitness", "Cooking",
  "Gaming", "Photography", "Dancing", "Hiking", "Movies", "Podcasts",
  "Yoga", "Meditation", "Volunteering", "Nightlife"
];

const LOOKING_FOR_OPTIONS = [
  { value: "dating", label: "Dating", description: "Romantic connections" },
  { value: "friends", label: "Friends", description: "Platonic connections" },
  { value: "play-partners", label: "Play Partners", description: "Intimate but not romantic" },
  { value: "community", label: "Community", description: "Events & social connections" },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pronouns: "",
    gender: "",
    genderPreference: "",
    relationshipStyle: "",
    relationshipStatus: "",
    lookingFor: [] as string[],
    bio: "",
    interests: [] as string[],
    location: "",
    experienceLevel: "",
    boundaries: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: 'interests' | 'lookingFor', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((i: string) => i !== value)
        : [...prev[field], value]
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.pronouns.trim()) {
          toast.error("Please enter your pronouns");
          return false;
        }
        return true;
      case 2:
        if (!formData.relationshipStyle) {
          toast.error("Please select your relationship style");
          return false;
        }
        return true;
      case 3:
        if (!formData.relationshipStatus) {
          toast.error("Please select your relationship status");
          return false;
        }
        return true;
      case 4:
        if (formData.lookingFor.length === 0) {
          toast.error("Please select what you're looking for");
          return false;
        }
        return true;
      case 5:
        if (!formData.experienceLevel) {
          toast.error("Please select your experience level");
          return false;
        }
        return true;
      case 6:
        if (!formData.location.trim()) {
          toast.error("Please enter your location");
          return false;
        }
        return true;
      case 7:
        if (formData.interests.length < 3) {
          toast.error("Please select at least 3 interests");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const { error } = await supabase
        .from("profiles")
        .update({
          pronouns: formData.pronouns.trim(),
          gender: formData.gender || null,
          gender_preference: formData.genderPreference || null,
          relationship_style: formData.relationshipStyle,
          relationship_status: formData.relationshipStatus,
          looking_for: formData.lookingFor.join(", "),
          bio: formData.bio.trim() || null,
          interests: formData.interests,
          location: formData.location.trim(),
          experience_level: formData.experienceLevel,
          boundaries: formData.boundaries.trim() || null,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Welcome to Positive Thots! 💕");
      navigate("/learn");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete profile setup");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-1 text-center">
          <Logo size="lg" />
          <CardTitle className="text-2xl mt-4">Create Your Profile</CardTitle>
          <CardDescription>
            Step {step} of {totalSteps}
          </CardDescription>
          {/* Progress bar */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Step 1: Pronouns */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pronouns">Your Pronouns</Label>
                <Input
                  id="pronouns"
                  placeholder="e.g., she/her, he/him, they/them"
                  value={formData.pronouns}
                  onChange={(e) => updateField("pronouns", e.target.value)}
                  maxLength={50}
                />
                <p className="text-sm text-muted-foreground">
                  This will be displayed on your profile
                </p>
              </div>
              <div className="space-y-2">
                <Label>Gender (Optional)</Label>
                <RadioGroup 
                  value={formData.gender} 
                  onValueChange={(v) => updateField("gender", v)}
                >
                  {["Woman", "Man", "Non-binary", "Other"].map((g) => (
                    <div key={g} className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value={g.toLowerCase()} id={g.toLowerCase()} />
                      <Label htmlFor={g.toLowerCase()} className="flex-1 cursor-pointer">{g}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Button onClick={handleNext} className="w-full">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {/* Step 2: Relationship Style */}
          {step === 2 && (
            <>
              <div className="space-y-3">
                <Label>Relationship Style</Label>
                <RadioGroup 
                  value={formData.relationshipStyle} 
                  onValueChange={(v) => updateField("relationshipStyle", v)}
                >
                  {[
                    { value: "polyamory", label: "Polyamory", desc: "Multiple loving relationships" },
                    { value: "open-relationship", label: "Open Relationship", desc: "Primary partner + outside connections" },
                    { value: "swinging", label: "Swinging", desc: "Recreational experiences with others" },
                    { value: "relationship-anarchy", label: "Relationship Anarchy", desc: "No hierarchy or labels" },
                    { value: "monogamish", label: "Monogamish", desc: "Mostly monogamous with flexibility" },
                    { value: "exploring", label: "Exploring ENM", desc: "New to this, learning what fits" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-start space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="block text-sm text-muted-foreground">{option.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Relationship Status */}
          {step === 3 && (
            <>
              <div className="space-y-3">
                <Label>Current Relationship Status</Label>
                <RadioGroup 
                  value={formData.relationshipStatus} 
                  onValueChange={(v) => updateField("relationshipStatus", v)}
                >
                  {[
                    "Single",
                    "Partnered",
                    "Married",
                    "In a polycule",
                    "It's complicated",
                  ].map((status) => (
                    <div key={status} className="flex items-center space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value={status.toLowerCase()} id={status.toLowerCase()} />
                      <Label htmlFor={status.toLowerCase()} className="flex-1 cursor-pointer">{status}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Looking For */}
          {step === 4 && (
            <>
              <div className="space-y-3">
                <Label>What are you looking for? (Select all that apply)</Label>
                {LOOKING_FOR_OPTIONS.map((option) => (
                  <div 
                    key={option.value} 
                    className={`flex items-start space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                      formData.lookingFor.includes(option.value) ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => toggleArrayField("lookingFor", option.value)}
                  >
                    <Checkbox 
                      checked={formData.lookingFor.includes(option.value)}
                      onCheckedChange={() => toggleArrayField("lookingFor", option.value)}
                    />
                    <div className="flex-1">
                      <span className="font-medium">{option.label}</span>
                      <span className="block text-sm text-muted-foreground">{option.description}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 5: Experience Level */}
          {step === 5 && (
            <>
              <div className="space-y-3">
                <Label>ENM Experience Level</Label>
                <RadioGroup 
                  value={formData.experienceLevel} 
                  onValueChange={(v) => updateField("experienceLevel", v)}
                >
                  {[
                    { value: "curious", label: "Curious", desc: "Just learning about ENM" },
                    { value: "new", label: "New", desc: "< 1 year of experience" },
                    { value: "experienced", label: "Experienced", desc: "1-5 years of experience" },
                    { value: "veteran", label: "Veteran", desc: "5+ years of experience" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-start space-x-2 border rounded-lg p-3">
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="block text-sm text-muted-foreground">{option.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 6: Location */}
          {step === 6 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="location">Location (City-level)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Portland, OR"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  maxLength={100}
                />
                <p className="text-sm text-muted-foreground">
                  Only city-level location is shown for privacy
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(5)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 7: Interests */}
          {step === 7 && (
            <>
              <div className="space-y-3">
                <Label>Interests (Select at least 3)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => toggleArrayField("interests", interest)}
                    >
                      {interest}
                      {formData.interests.includes(interest) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.interests.length}/3 minimum selected
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(6)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}

          {/* Step 8: Bio & Boundaries */}
          {step === 8 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">About You</Label>
                  <Textarea
                    id="bio"
                    placeholder="Share a bit about yourself, your journey, what makes you excited..."
                    value={formData.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boundaries">Boundaries & Preferences (Optional)</Label>
                  <Textarea
                    id="boundaries"
                    placeholder="Share any important boundaries or preferences potential connections should know..."
                    value={formData.boundaries}
                    onChange={(e) => updateField("boundaries", e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    This helps set expectations upfront
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(7)} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button onClick={handleComplete} className="flex-1" disabled={loading}>
                  {loading ? "Setting up..." : "Complete Profile"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
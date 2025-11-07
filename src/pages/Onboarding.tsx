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
import { Flame, X } from "lucide-react";
import { toast } from "sonner";

const INTERESTS_OPTIONS = [
  "Travel", "Music", "Sports", "Movies", "Reading", "Cooking",
  "Art", "Gaming", "Fitness", "Photography", "Dancing", "Hiking"
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState("");
  const [genderPreference, setGenderPreference] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (step === 1 && !gender) {
      toast.error("Please select your gender");
      return;
    }
    if (step === 2 && !genderPreference) {
      toast.error("Please select who you'd like to meet");
      return;
    }
    if (step === 3 && !location.trim()) {
      toast.error("Please enter your location");
      return;
    }
    if (step === 4 && interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    setStep(step + 1);
  };

  const handleComplete = async () => {
    if (!lookingFor) {
      toast.error("Please select what you're looking for");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const { error } = await supabase
        .from("profiles")
        .update({
          gender,
          gender_preference: genderPreference,
          bio: bio.trim() || null,
          interests,
          looking_for: lookingFor,
          location: location.trim(),
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Profile completed! Start swiping!");
      navigate("/");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete profile setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SwipeMatch
            </h1>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>Step {step} of 5</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup value={gender} onValueChange={setGender}>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="woman" id="woman" />
                    <Label htmlFor="woman" className="flex-1 cursor-pointer">Woman</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="man" id="man" />
                    <Label htmlFor="man" className="flex-1 cursor-pointer">Man</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="non-binary" id="non-binary" />
                    <Label htmlFor="non-binary" className="flex-1 cursor-pointer">Non-binary</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button onClick={handleNext} className="w-full">Continue</Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-3">
                <Label>Show me</Label>
                <RadioGroup value={genderPreference} onValueChange={setGenderPreference}>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="women" id="women" />
                    <Label htmlFor="women" className="flex-1 cursor-pointer">Women</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="men" id="men" />
                    <Label htmlFor="men" className="flex-1 cursor-pointer">Men</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="everyone" id="everyone" />
                    <Label htmlFor="everyone" className="flex-1 cursor-pointer">Everyone</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-3">
                <Label>What are your interests? (Select at least one)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                      {interests.includes(interest) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="space-y-3">
                <Label>What are you looking for?</Label>
                <RadioGroup value={lookingFor} onValueChange={setLookingFor}>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="relationship" id="relationship" />
                    <Label htmlFor="relationship" className="flex-1 cursor-pointer">Long-term relationship</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="dating" id="dating" />
                    <Label htmlFor="dating" className="flex-1 cursor-pointer">Short-term dating</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="friends" id="friends" />
                    <Label htmlFor="friends" className="flex-1 cursor-pointer">New friends</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="unsure" id="unsure" />
                    <Label htmlFor="unsure" className="flex-1 cursor-pointer">Still figuring it out</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1">Back</Button>
                <Button onClick={handleComplete} className="flex-1" disabled={loading}>
                  {loading ? "Completing..." : "Complete Profile"}
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

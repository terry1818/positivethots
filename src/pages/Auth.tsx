import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShimmerButton } from "@/components/ShimmerButton";
import { Logo } from "@/components/Logo";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long").optional(),
  age: z.number().min(18, "Must be 18 or older").max(100, "Invalid age").optional(),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }) }).optional(),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = isSignUp
        ? { email: email.trim(), password, name: name.trim(), age: parseInt(age), agreedToTerms: agreedToTerms as true }
        : { email: email.trim(), password };
      authSchema.parse(data);

      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { name: name.trim(), age: parseInt(age) } },
        });
        if (signUpError) throw signUpError;
        if (authData.user && !authData.session) {
          // Email confirmation required — don't create profile yet
          toast.success("Account created! Check your email to confirm your account before signing in.");
          setIsSignUp(false);
          return;
        }
        if (authData.user && authData.session) {
          // Auto-confirmed (shouldn't happen with current config, but handle gracefully)
          const { error: profileError } = await supabase.from("profiles").insert({
            id: authData.user.id, name: name.trim(), age: parseInt(age), bio: "",
            location: "Location not set",
            profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`,
          });
          if (profileError) console.error("Profile creation error:", profileError);
          toast.success("Account created successfully!");
          navigate("/onboarding");
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        // Create profile on first login if missing (e.g. user confirmed email but profile wasn't created)
        if (signInData.user) {
          const { data: existingProfile } = await supabase
            .from("profiles").select("id").eq("id", signInData.user.id).maybeSingle();
          if (!existingProfile) {
            const meta = signInData.user.user_metadata;
            const userName = meta?.name || email.split("@")[0];
            const userAge = meta?.age || 18;
            await supabase.from("profiles").insert({
              id: signInData.user.id, name: userName, age: userAge, bio: "",
              location: "Location not set",
              profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${signInData.user.id}`,
            });
            toast.success("Signed in successfully!");
            navigate("/onboarding");
            return;
          }
        }
        toast.success("Signed in successfully!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      else if (error.name === "AuthWeakPasswordError" || error.message?.includes("weak") || error.message?.includes("leaked")) toast.error("This password has appeared in a data breach. Please choose a different, more unique password.");
      else if (error.message?.includes("User already registered")) toast.error("This email is already registered. Please sign in instead.");
      else if (error.message?.includes("Invalid login credentials")) toast.error("Invalid email or password");
      else if (error.message?.includes("Email not confirmed")) toast.error("Please confirm your email before signing in. Check your inbox for a confirmation link.");
      else toast.error(error.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-blob-float" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/20 blur-3xl animate-blob-float [animation-delay:5s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-blob-float [animation-delay:10s]" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-secondary/10 blur-3xl animate-blob-float [animation-delay:15s]" />

      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)] relative z-10 animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center"><Logo size="lg" /></div>
          <CardTitle className="text-2xl">{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription>{isSignUp ? "Join the Positive Thots community" : "Sign in to continue your journey"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2 animate-stagger-fade" style={{ animationDelay: "0ms" }}>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="focus-glow" />
                </div>
                <div className="space-y-2 animate-stagger-fade" style={{ animationDelay: "80ms" }}>
                  <Label htmlFor="age">Age (18+)</Label>
                  <Input id="age" type="number" placeholder="Your age" value={age} onChange={(e) => setAge(e.target.value)} required min={18} max={100} className="focus-glow" />
                </div>
              </>
            )}
            {isSignUp && (
              <div className="flex items-start space-x-2 animate-stagger-fade" style={{ animationDelay: "160ms" }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                  I am at least 18 years old and agree to the{" "}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>
                </Label>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="focus-glow" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && <ForgotPasswordModal />}
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={100} className="focus-glow" />
            </div>
            <ShimmerButton
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </ShimmerButton>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

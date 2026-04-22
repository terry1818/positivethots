import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShimmerButton } from "@/components/ShimmerButton";
import { Logo } from "@/components/Logo";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { buildAuthRedirectUrl } from "@/lib/authRedirect";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Circle, GraduationCap, ShieldCheck, Heart } from "lucide-react";
import { BrandTagline } from "@/components/BrandTagline";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine((val) => {
    const dob = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  }, "You must be 18 or older to join"),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }) }),
});

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email too long"),
  password: z.string().min(1, "Password is required").max(100, "Password too long"),
});

import { FieldError } from "@/components/FieldError";

const TESTIMONIALS = [
  "Finally, a dating app that expects you to learn first.",
  "The education modules changed how I communicate.",
  "I feel safer here than any other dating app.",
];

const Auth = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  // Rotate testimonials
  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  // Capture referral code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      useSessionStore.getState().setReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  // Clear field errors when switching modes
  useEffect(() => {
    setFieldErrors({});
  }, [isSignUp]);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const focusFirstError = (errors: Record<string, string>) => {
    const fieldOrder = isSignUp ? ['name', 'dateOfBirth', 'agreedToTerms', 'email', 'password'] : ['email', 'password'];
    for (const field of fieldOrder) {
      if (errors[field]) {
        const el = formRef.current?.querySelector<HTMLInputElement>(`#${field}`);
        el?.focus();
        break;
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        const parsed = signUpSchema.safeParse({
          email: email.trim(),
          password,
          name: name.trim(),
          dateOfBirth,
          agreedToTerms: agreedToTerms as true,
        });

        if (!parsed.success) {
          const errors: Record<string, string> = {};
          parsed.error.errors.forEach(err => {
            const field = err.path[0]?.toString();
            if (field && !errors[field]) errors[field] = err.message;
          });
          setFieldErrors(errors);
          setTimeout(() => focusFirstError(errors), 50);
          setLoading(false);
          return;
        }

        // Calculate age from DOB
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let computedAge = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) computedAge--;

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: {
            emailRedirectTo: buildAuthRedirectUrl("/"),
            data: { name: name.trim(), age: computedAge, date_of_birth: dateOfBirth },
          },
        });
        if (signUpError) throw signUpError;
        if (authData.user && !authData.session) {
          toast.success("Account created! Check your email to confirm your account before signing in.");
          setIsSignUp(false);
          return;
        }
        if (authData.user && authData.session) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: authData.user.id, name: name.trim(), age: computedAge, bio: "",
            location: "Location not set",
            date_of_birth: dateOfBirth,
            profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`,
          } as any);
          if (profileError) console.error("Profile creation error:", profileError);
          toast.success("Account created successfully!");
          navigate("/onboarding");
        }
      } else {
        const result = signInSchema.safeParse({ email: email.trim(), password });
        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            const field = err.path[0]?.toString();
            if (field && !errors[field]) errors[field] = err.message;
          });
          setFieldErrors(errors);
          setTimeout(() => focusFirstError(errors), 50);
          setLoading(false);
          return;
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
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
      if (error.name === "AuthWeakPasswordError" || error.message?.includes("weak") || error.message?.includes("leaked")) {
        setFieldErrors({ password: "This password has appeared in a data breach. Please choose a different password." });
        formRef.current?.querySelector<HTMLInputElement>('#password')?.focus();
      } else if (error.message?.includes("User already registered")) {
        setFieldErrors({ email: "This email is already registered. Sign in instead?" });
        formRef.current?.querySelector<HTMLInputElement>('#email')?.focus();
      } else if (error.message?.includes("Invalid login credentials")) {
        setFieldErrors({ password: "Invalid email or password" });
        formRef.current?.querySelector<HTMLInputElement>('#password')?.focus();
      } else if (error.message?.includes("Email not confirmed")) {
        setFieldErrors({ email: "Please confirm your email first. Check your inbox for a confirmation link." });
        formRef.current?.querySelector<HTMLInputElement>('#email')?.focus();
      } else {
        toast.error(error.message || "An error occurred during authentication");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-blob-float" aria-hidden="true" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/20 blur-3xl animate-blob-float [animation-delay:5s]" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-blob-float [animation-delay:10s]" aria-hidden="true" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-secondary/10 blur-3xl animate-blob-float [animation-delay:15s]" aria-hidden="true" />

      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)] relative z-10 animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center"><Logo size="lg" /></div>
          <CardTitle className="text-2xl">{isSignUp ? "Create your account" : "Welcome back"}</CardTitle>
          <BrandTagline variant="secondary" className="mt-1" />
          <p className="text-sm text-muted-foreground/50 mt-1">
            {isSignUp ? "The relationship wellness app that teaches you to be a better partner" : "Ready to meet like-minded people?"}
          </p>

          {/* Value proposition icons */}
          {isSignUp && (
            <div className="pt-3 space-y-2">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />Evidence-based courses
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />Education-verified community
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 text-primary shrink-0" />Built for ethical non-monogamy
                </span>
              </div>
              <p className="text-sm text-muted-foreground/70 text-center">Join 500+ members learning together</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleAuth} className="space-y-4" noValidate>
            {isSignUp && (
              <>
                <div className="space-y-1 animate-stagger-fade" style={{ animationDelay: "0ms" }}>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                    maxLength={100}
                    className={cn("focus-glow min-h-[48px]", fieldErrors.name && "border-destructive/50 focus-visible:ring-destructive/30")}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    aria-invalid={!!fieldErrors.name}
                  />
                  <FieldError message={fieldErrors.name} id="name-error" />
                </div>
                <div className="space-y-1 animate-stagger-fade" style={{ animationDelay: "80ms" }}>
                  <Label htmlFor="dateOfBirth">Date of Birth (18+)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => { setDateOfBirth(e.target.value); clearFieldError('dateOfBirth'); }}
                    max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                    min="1920-01-01"
                    className={cn("focus-glow min-h-[48px]", fieldErrors.dateOfBirth && "border-destructive/50 focus-visible:ring-destructive/30")}
                    aria-describedby={fieldErrors.dateOfBirth ? "dob-error" : undefined}
                    aria-invalid={!!fieldErrors.dateOfBirth}
                  />
                  <FieldError message={fieldErrors.dateOfBirth} id="dob-error" />
                </div>
              </>
            )}
            {isSignUp && (
              <div className="space-y-1 animate-stagger-fade" style={{ animationDelay: "160ms" }}>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    checked={agreedToTerms}
                    onChange={(e) => { setAgreedToTerms(e.target.checked); clearFieldError('agreedToTerms'); }}
                    className={cn("mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary", fieldErrors.agreedToTerms && "border-destructive")}
                    aria-describedby={fieldErrors.agreedToTerms ? "terms-error" : undefined}
                    aria-invalid={!!fieldErrors.agreedToTerms}
                  />
                  <Label htmlFor="agreedToTerms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                    I am at least 18 years old and agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>
                  </Label>
                </div>
                <FieldError message={fieldErrors.agreedToTerms} id="terms-error" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                maxLength={255}
                className={cn("focus-glow min-h-[48px]", fieldErrors.email && "border-destructive/50 focus-visible:ring-destructive/30")}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                aria-invalid={!!fieldErrors.email}
              />
              <FieldError message={fieldErrors.email} id="email-error" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && <ForgotPasswordModal />}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                maxLength={100}
                className={cn("focus-glow min-h-[48px]", fieldErrors.password && "border-destructive/50 focus-visible:ring-destructive/30")}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                aria-invalid={!!fieldErrors.password}
              />
              <FieldError message={fieldErrors.password} id="password-error" />

              {/* Password requirements — visible during sign-up */}
              {isSignUp && password.length > 0 && (
                <div className="space-y-1 mt-2 animate-fade-in">
                  <div className={cn("flex items-center gap-1.5 text-sm transition-colors",
                    password.length >= 6 ? "text-success" : "text-muted-foreground"
                  )}>
                    {password.length >= 6
                      ? <Check className="h-3 w-3" />
                      : <Circle className="h-3 w-3" />
                    }
                    At least 6 characters
                  </div>
                </div>
              )}
            </div>
            <ShimmerButton
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 min-h-[48px]"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </ShimmerButton>

            {isSignUp && (
              <p className="text-sm text-muted-foreground text-center mt-1">
                Next: A quick profile setup, then start your learning journey ✨
              </p>
            )}

            <Button type="button" variant="ghost" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </form>

          {/* Rotating testimonial */}
          <div className="mt-4 text-center min-h-[40px] flex items-center justify-center">
            <p
              key={prefersReducedMotion ? 0 : testimonialIdx}
              className={cn("text-sm text-muted-foreground italic", !prefersReducedMotion && "animate-fade-in")}
            >
              "{TESTIMONIALS[prefersReducedMotion ? 0 : testimonialIdx]}"
              <span className="block text-muted-foreground/60 mt-0.5 not-italic">— Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup> member</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
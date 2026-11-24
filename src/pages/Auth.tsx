import { GuideArt } from "@/components/mascot/GuideArt";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionStore } from "@/stores/sessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { buildAuthRedirectUrl } from "@/lib/authRedirect";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Check, Circle, GraduationCap, ShieldCheck, Heart, Eye, EyeOff } from "lucide-react";
import { BrandTagline } from "@/components/BrandTagline";

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

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  // Same-origin relative redirect target (used by the OAuth consent flow).
  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;


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
            emailRedirectTo: buildAuthRedirectUrl(nextPath ?? "/"),
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
          navigate(nextPath ?? "/onboarding");
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
            navigate(nextPath ?? "/onboarding");
            return;
          }
        }
        toast.success("Signed in successfully!");
        navigate(nextPath ?? "/");
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

  const field = (hasError?: string) => cn("kit-field focus-glow", hasError && "border-destructive/60 focus-visible:ring-destructive/30");

  return (
    <div className="kit-area-learn kit-entry">
      <h1 className="sr-only">{isSignUp ? "Create your Positive Thots account" : "Sign in to Positive Thots"}</h1>

      <div className="auth-guide-layout my-auto">
        {/* Wide screens: the welcome sits beside the form. On a phone it is the strip at the top of the card. */}
        <aside className="auth-guide-welcome !hidden lg:!flex">
          <GuideArt name="guide-celebrate-all" size={150} />
          <p className="mt-6 text-xl font-bold text-foreground">Learn first. Connect better.</p>
        </aside>

        <div className="kit-card kit-rise w-full max-w-md overflow-hidden">
          <div className="kit-panel !rounded-b-none !rounded-t-[18px] !border-0 h-[132px] lg:hidden">
            <GuideArt name="guide-celebrate-all" size={124} />
          </div>

          <div className="p-5">
            <div className="text-center">
              <div className="flex justify-center"><Logo size="md" /></div>
              <h2 className="mt-1 text-2xl font-extrabold [text-wrap:balance]">{isSignUp ? "Create your account" : "Welcome back"}</h2>
              <BrandTagline className="mt-1 text-sm text-muted-foreground" />
              <p className="mt-1 text-sm text-muted-foreground [text-wrap:pretty]">
                {isSignUp ? "The relationship wellness platform where learning comes first." : "Learn first. Connect better."}
              </p>

              {isSignUp && (
                <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <li className="kit-chip" data-tone="quiet"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Evidence-based courses</li>
                  <li className="kit-chip" data-tone="quiet"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Education-verified community</li>
                  <li className="kit-chip" data-tone="quiet"><Heart className="h-3.5 w-3.5" aria-hidden="true" /> Every relationship style welcome</li>
                </ul>
              )}
            </div>

            <form ref={formRef} onSubmit={handleAuth} className="mt-5 space-y-4" noValidate>
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                      maxLength={100}
                      className={field(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      aria-invalid={!!fieldErrors.name}
                    />
                    <FieldError message={fieldErrors.name} id="name-error" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">Date of birth (you must be 18 or older)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      autoComplete="bday"
                      value={dateOfBirth}
                      onChange={(e) => { setDateOfBirth(e.target.value); clearFieldError('dateOfBirth'); }}
                      max={new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]}
                      min="1920-01-01"
                      className={field(fieldErrors.dateOfBirth)}
                      aria-describedby={fieldErrors.dateOfBirth ? "dob-error" : undefined}
                      aria-invalid={!!fieldErrors.dateOfBirth}
                    />
                    <FieldError message={fieldErrors.dateOfBirth} id="dob-error" />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  maxLength={255}
                  className={field(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  aria-invalid={!!fieldErrors.email}
                />
                <FieldError message={fieldErrors.email} id="email-error" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && <ForgotPasswordModal />}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    maxLength={100}
                    className={cn(field(fieldErrors.password), "pr-12")}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} id="password-error" />

                {isSignUp && password.length > 0 && (
                  <p className={cn("flex items-center gap-1.5 text-sm font-semibold", password.length >= 6 ? "text-success" : "text-muted-foreground")}>
                    {password.length >= 6 ? <Check className="h-4 w-4" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />}
                    At least 6 characters
                  </p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-1">
                  <div className="flex items-start gap-1">
                    <label htmlFor="agreedToTerms" className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center">
                      <Checkbox
                        id="agreedToTerms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => { setAgreedToTerms(checked === true); clearFieldError('agreedToTerms'); }}
                        className={cn(fieldErrors.agreedToTerms && "border-destructive")}
                        aria-describedby={fieldErrors.agreedToTerms ? "terms-error" : undefined}
                        aria-invalid={!!fieldErrors.agreedToTerms}
                      />
                    </label>
                    <Label htmlFor="agreedToTerms" className="cursor-pointer py-2.5 text-sm leading-snug text-muted-foreground">
                      I am at least 18 years old and agree to the{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="kit-text font-bold underline underline-offset-2">Terms of Service</a>{" "}
                      and{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="kit-text font-bold underline underline-offset-2">Privacy Policy</a>
                    </Label>
                  </div>
                  <FieldError message={fieldErrors.agreedToTerms} id="terms-error" />
                </div>
              )}

              <Button type="submit" className="kit-cta w-full" disabled={loading}>
                {loading ? "One moment…" : isSignUp ? "Create account" : "Sign in"}
              </Button>

              {isSignUp && (
                <p className="text-center text-sm text-muted-foreground">
                  Next: a quick profile setup, then your first lesson.
                </p>
              )}

              <Button type="button" variant="ghost" className="min-h-[44px] w-full font-bold" onClick={() => { setIsSignUp(!isSignUp); setFieldErrors({}); }}>
                {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
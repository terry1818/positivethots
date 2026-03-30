import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Heart, BookOpen, Shield, Users, Camera, MessageCircle, Scale, Award } from "lucide-react";

const Section = ({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20">
    <div className="flex items-center gap-2 mt-8 mb-3">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
    {children}
  </section>
);

const CommunityGuidelines = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" showText={false} />
          <h1 className="text-xl font-bold">Community Guidelines</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none text-foreground">
          {/* Intro */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
            <p className="text-muted-foreground leading-relaxed m-0">
              Positive Thots is built on <strong className="text-foreground">consent, education, and respect</strong>. These guidelines keep our community safe and welcoming for everyone practicing ethical non-monogamy.
            </p>
          </div>

          {/* Our Values */}
          <Section id="values" icon={Heart} title="Our Values">
            <div className="grid gap-3">
              {[
                { emoji: "💜", title: "Consent is everything", desc: "Enthusiastic, informed, and ongoing — always." },
                { emoji: "📚", title: "Education before connection", desc: "Learning builds better relationships." },
                { emoji: "🤝", title: "Respect all relationship structures", desc: "No hierarchy of \"valid\" ENM." },
                { emoji: "🔒", title: "Privacy is sacred", desc: "What happens on Positive Thots stays here." },
              ].map((v) => (
                <div key={v.title} className="flex gap-3 items-start bg-muted/40 rounded-lg p-3">
                  <span className="text-xl mt-0.5">{v.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm m-0">{v.title}</p>
                    <p className="text-xs text-muted-foreground m-0">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Expected Behavior */}
          <Section id="expected-behavior" icon={Users} title="Expected Behavior">
            <ul className="list-none space-y-2 pl-0 mb-4">
              {[
                "Communicate openly and honestly about your relationship structure",
                "Respect boundaries — \"no\" is a complete sentence",
                "Use inclusive language for all gender identities and orientations",
                "Report concerns rather than engaging with bad actors",
                "Complete education modules to unlock features (it's a feature, not a punishment)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Prohibited Behavior */}
          <Section id="prohibited-behavior" icon={Shield} title="Prohibited Behavior">
            <p className="text-sm text-muted-foreground mb-3">Violations result in escalating consequences:</p>
            <div className="space-y-3">
              {[
                { behavior: "Harassment, bullying, intimidation", consequence: "Warning → Temporary ban → Permanent ban", severity: "escalating" },
                { behavior: "Hate speech targeting identity, orientation, or relationship style", consequence: "Immediate permanent ban", severity: "immediate" },
                { behavior: "Non-consensual sharing of intimate content", consequence: "Immediate permanent ban + law enforcement referral", severity: "immediate" },
                { behavior: "Solicitation or sex work promotion", consequence: "Account removal", severity: "removal" },
                { behavior: "Minors or age misrepresentation", consequence: "Permanent ban + law enforcement referral", severity: "immediate" },
                { behavior: "Spam, scams, catfishing", consequence: "Account removal", severity: "removal" },
                { behavior: "Outing someone's ENM status outside the app", consequence: "Permanent ban", severity: "immediate" },
              ].map((item) => (
                <div key={item.behavior} className="border border-border rounded-lg p-3">
                  <p className="text-sm font-medium m-0">{item.behavior}</p>
                  <Badge
                    variant={item.severity === "immediate" ? "destructive" : "secondary"}
                    className="mt-1.5 text-[10px]"
                  >
                    {item.consequence}
                  </Badge>
                </div>
              ))}
            </div>
          </Section>

          {/* Photo Guidelines */}
          <Section id="photo-guidelines" icon={Camera} title="Photo Guidelines">
            <ul className="list-none space-y-2 pl-0 mb-4">
              {[
                "Profile photos must show your face clearly",
                "No explicit/nude content in profile photos (this is an education-first app)",
                "No photos of other people without their consent",
                "No stock photos, celebrity photos, or AI-generated faces",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Camera className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Messaging Guidelines */}
          <Section id="messaging-guidelines" icon={MessageCircle} title="Messaging Guidelines">
            <ul className="list-none space-y-2 pl-0 mb-4">
              {[
                "Don't open with explicit content unless both parties have consented",
                "Respect response times — not everyone is available 24/7",
                "Use the in-app reporting system for unwanted messages",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Appeals Process */}
          <Section id="appeals" icon={Scale} title="Appeals Process">
            <div className="bg-muted/40 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground m-0">Users can appeal moderation decisions within <strong className="text-foreground">30 days</strong>.</p>
              <p className="text-sm m-0">
                Email: <a href="mailto:appeals@positivethots.com" className="text-primary hover:underline font-medium">appeals@positivethots.com</a>
              </p>
              <p className="text-sm text-muted-foreground m-0">Appeals are reviewed within <strong className="text-foreground">5 business days</strong>. The decision is final after appeal review.</p>
            </div>
          </Section>

          {/* Community Standing */}
          <Section id="community-standing" icon={Award} title="Community Standing">
            <p className="text-sm text-muted-foreground mb-3">Your profile displays a Community Standing badge reflecting your account status:</p>
            <div className="grid gap-2">
              {[
                { status: "Good Standing", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", desc: "No violations — full access to all features" },
                { status: "Warning", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", desc: "Minor violation — still active, on notice" },
                { status: "Restricted", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", desc: "Limited features pending review" },
                { status: "Banned", color: "bg-destructive/10 text-destructive border-destructive/20", desc: "Permanent removal from the platform" },
              ].map((s) => (
                <div key={s.status} className={`flex items-center gap-3 rounded-lg border p-3 ${s.color}`}>
                  <Badge variant="outline" className={`shrink-0 text-xs ${s.color}`}>{s.status}</Badge>
                  <p className="text-xs text-muted-foreground m-0">{s.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              These guidelines are subject to change. Continued use of Positive Thots constitutes acceptance of the current guidelines.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Questions? Contact us at{" "}
              <a href="mailto:legal@positivethots.com" className="text-primary hover:underline">legal@positivethots.com</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityGuidelines;

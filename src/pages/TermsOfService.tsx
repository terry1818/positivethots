import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ChevronLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" />
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="text-muted-foreground text-sm mb-6">Last updated: March 22, 2026</p>

          <h2 className="text-lg font-bold mt-6 mb-3">1. Acceptance of Terms</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            By accessing or using Positive Thots ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">2. Eligibility</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            You must be at least <strong>18 years of age</strong> to create an account or use any features of the App. By registering, you represent and warrant that you are at least 18 years old. We reserve the right to terminate any account we reasonably believe belongs to a minor.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">3. Account Responsibilities</h2>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li>You are responsible for maintaining the confidentiality of your login credentials</li>
            <li>You must provide accurate and truthful information in your profile</li>
            <li>You may not create multiple accounts or impersonate another person</li>
            <li>You are solely responsible for all activity that occurs under your account</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">4. User Conduct</h2>
          <p className="mb-2 leading-relaxed text-muted-foreground">You agree NOT to:</p>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li>Harass, bully, stalk, threaten, or intimidate any user</li>
            <li>Post content that is illegal, defamatory, hateful, or discriminatory</li>
            <li>Share sexually explicit content without mutual consent</li>
            <li>Use the platform for commercial solicitation or spam</li>
            <li>Attempt to manipulate matching algorithms or gaming systems (e.g., XP exploitation)</li>
            <li>Circumvent safety features, content moderation, or anti-cheat measures</li>
            <li>Upload photos that do not depict you or violate our photo guidelines</li>
            <li>Share another user's private information without their consent</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">5. Content Guidelines</h2>
          <h3 className="text-base font-semibold mt-4 mb-2">5.1 Photos</h3>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            All uploaded photos are subject to automated AI moderation. Photos must clearly depict you (the account holder). We reserve the right to reject or remove any photo that violates our community standards.
          </p>
          <h3 className="text-base font-semibold mt-4 mb-2">5.2 Messages</h3>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            All messages must respect the other user's boundaries. Unsolicited explicit content is prohibited. Users can report and block others at any time.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">6. Education & Badges</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            The App includes an education system with modules, quizzes, and badges. Quiz answers are validated server-side. Any attempt to cheat, manipulate XP, or exploit the education system may result in account suspension or termination.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">7. Premium Subscriptions</h2>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li>Premium features are available via paid subscription through Stripe</li>
            <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
            <li>Refunds are handled in accordance with applicable law and Stripe's policies</li>
            <li>We reserve the right to modify pricing with reasonable notice</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">8. Safety & Reporting</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We take user safety seriously. You can report any user, message, or content that violates these terms. We investigate all reports and may take action including content removal, warnings, temporary suspension, or permanent account termination.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">9. Disclaimer of Warranties</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            The App is provided "as is" without warranties of any kind, either express or implied. We do not guarantee the accuracy, reliability, or completeness of any content or user-provided information. We are not responsible for the conduct of any user, whether online or offline.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">10. Limitation of Liability</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            To the maximum extent permitted by law, Positive Thots shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including but not limited to damages from interactions with other users.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">11. Account Termination</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time through the Settings page. Upon deletion, your personal data will be permanently removed in accordance with our Privacy Policy.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">12. Changes to Terms</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We may update these Terms from time to time. Material changes will be communicated via email or in-app notification. Continued use constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">13. Governing Law</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            These Terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through binding arbitration, except where prohibited by law.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">14. Contact</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Questions about these Terms? Contact us at legal@positivethots.com.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;

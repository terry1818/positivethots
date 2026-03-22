import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Logo size="md" />
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="text-muted-foreground text-sm mb-6">Last updated: March 22, 2026</p>

          <h2 className="text-lg font-bold mt-6 mb-3">1. Introduction</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            Positive Thots ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our dating and education platform ("the App"). By using the App, you consent to the practices described in this policy.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">2. Information We Collect</h2>
          <h3 className="text-base font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li><strong>Account Information:</strong> Name, email address, age, password</li>
            <li><strong>Profile Information:</strong> Gender, pronouns, sexuality, relationship status, relationship style, interests, desires, bio, location, height, zodiac sign, languages, experience level, photos</li>
            <li><strong>Health Information:</strong> STI testing status and date (voluntarily provided)</li>
            <li><strong>Communication Data:</strong> Messages sent to other users</li>
            <li><strong>Education Data:</strong> Quiz responses, module progress, XP and learning stats</li>
            <li><strong>Verification Data:</strong> Selfie photos for identity verification</li>
          </ul>

          <h3 className="text-base font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li>Device information and browser type</li>
            <li>Usage patterns and interaction data</li>
            <li>Authentication session data</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">3. Sensitive Data</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We recognize that information about your sexuality, gender identity, relationship preferences, desires, boundaries, and STI status is particularly sensitive. This data is:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li>Only visible to authenticated users of the platform</li>
            <li>Never sold to third parties</li>
            <li>Never used for advertising or marketing purposes</li>
            <li>Protected by row-level security policies in our database</li>
            <li>Deletable at any time through your account settings</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">4. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li>To create and manage your account</li>
            <li>To facilitate matches and connections with other users</li>
            <li>To provide educational content and track your learning progress</li>
            <li>To moderate content and ensure community safety</li>
            <li>To verify user identity through photo verification</li>
            <li>To process premium subscription payments</li>
            <li>To communicate important service updates</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">5. Data Sharing</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We do not sell your personal information. We may share data with:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li><strong>Other Users:</strong> Your profile information (as configured by your privacy settings) is visible to other authenticated users for matching purposes</li>
            <li><strong>Service Providers:</strong> Payment processing (Stripe), cloud infrastructure, AI content moderation</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">6. Data Security</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We implement industry-standard security measures including encrypted data transmission (TLS), row-level security policies, secure authentication with leaked password protection, and server-side validation of sensitive operations.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">7. Your Rights (GDPR & CCPA)</h2>
          <p className="mb-2 leading-relaxed text-muted-foreground">You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
            <li><strong>Access:</strong> Request a copy of your personal data (available in Settings → Export Data)</li>
            <li><strong>Rectification:</strong> Update or correct your information via your profile</li>
            <li><strong>Erasure:</strong> Delete your account and all associated data (available in Settings → Delete Account)</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Objection:</strong> Object to certain processing of your data</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-3">8. Data Retention</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We retain your data for as long as your account is active. Upon account deletion, all personal data is permanently removed within 30 days. Anonymized usage statistics may be retained for service improvement.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">9. Age Requirement</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            You must be at least 18 years old to use Positive Thots. We do not knowingly collect data from individuals under 18. If we discover that a user is under 18, their account will be immediately terminated and all data deleted.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">10. Changes to This Policy</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the App after changes constitutes acceptance.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-3">11. Contact Us</h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">
            If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at privacy@positivethots.com.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

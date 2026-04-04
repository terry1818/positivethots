import { LegalPageShell } from "@/components/LegalPageShell";

const TOC = [
  { id: "intro", title: "Introduction" },
  { id: "info-collect", title: "Information We Collect" },
  { id: "sensitive-data", title: "Sensitive Data" },
  { id: "how-we-use", title: "How We Use It" },
  { id: "data-sharing", title: "Data Sharing" },
  { id: "data-security", title: "Data Security" },
  { id: "your-rights", title: "Your Rights" },
  { id: "data-retention", title: "Data Retention" },
  { id: "age", title: "Age Requirement" },
  { id: "changes", title: "Changes" },
  { id: "contact", title: "Contact" },
];

const PrivacyPolicy = () => (
  <LegalPageShell title="Privacy Policy" toc={TOC}>
    <p className="text-muted-foreground text-sm mb-6">Last updated: March 22, 2026</p>

    <h2 id="intro" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Introduction</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Positive Thots ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our relationship education and community platform ("the App"). By using the App, you consent to the practices described in this policy.
    </p>

    <h2 id="info-collect" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">2. Information We Collect</h2>
    <h3 className="text-base font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Account Information:</strong> Name, email address, age, password</li>
      <li><strong>Profile Information:</strong> Gender, pronouns, sexuality, relationship status, relationship style, interests, desires, bio, location, height, zodiac sign, languages, experience level, photos</li>
      <li><strong>Health Information:</strong> STI testing status and date (voluntarily provided)</li>
      <li><strong>Communication Data:</strong> Messages sent to other users</li>
      <li><strong>Education Data:</strong> Quiz responses, module progress, XP and learning stats</li>
      <li><strong>Verification Data:</strong> Selfie photos submitted for identity and photo moderation are processed by AI and are not retained after moderation is complete. We do not store facial scans or biometric data.</li>
    </ul>

    <h3 className="text-base font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Device information and browser type</li>
      <li>Usage patterns and interaction data</li>
      <li>Authentication session data</li>
    </ul>

    <h2 id="sensitive-data" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Sensitive Data</h2>
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

    <h2 id="how-we-use" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">4. How We Use Your Information</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>To create and manage your account</li>
      <li>To facilitate matches and connections with other users</li>
      <li>To provide educational content and track your learning progress</li>
      <li>To moderate content and ensure community safety</li>
      <li>To verify user identity through photo verification</li>
      <li>To process premium subscription payments</li>
      <li>To communicate important service updates</li>
    </ul>

    <h2 id="data-sharing" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">5. Data Sharing</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We do not sell your personal information. We may share data with:
    </p>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Other Users:</strong> Your profile information (as configured by your privacy settings) is visible to other authenticated users for matching purposes</li>
      <li><strong>Service Providers:</strong> Payment processing (Stripe), cloud infrastructure, AI content moderation</li>
      <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
    </ul>

    <h2 id="data-security" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">6. Data Security</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We implement industry-standard security measures including encrypted data transmission (TLS), row-level security policies, secure authentication with leaked password protection, and server-side validation of sensitive operations.
    </p>

    <h2 id="your-rights" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">7. Your Rights (GDPR & CCPA)</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">You have the right to:</p>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Access:</strong> Request a copy of your personal data (available in Settings → Export Data)</li>
      <li><strong>Rectification:</strong> Update or correct your information via your profile</li>
      <li><strong>Erasure:</strong> Delete your account and all associated data (available in Settings → Delete Account)</li>
      <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
      <li><strong>Restriction:</strong> Limit how we process your data</li>
      <li><strong>Objection:</strong> Object to certain processing of your data</li>
    </ul>

    <h2 id="data-retention" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">8. Data Retention</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">
      We retain your personal data for as long as your account is active. Upon account deletion, personal data is permanently removed within 30 days. Specific retention periods by data type:
    </p>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Account and profile data</strong> — deleted within 30 days of account closure</li>
      <li><strong>Messages and chat logs</strong> — deleted within 30 days of account closure</li>
      <li><strong>Payment records</strong> — retained for 7 years as required by tax law; payment data is held by Stripe and governed by their retention policies</li>
      <li><strong>Verification photos</strong> — deleted immediately after AI moderation is complete</li>
    </ul>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Anonymized, non-identifiable usage statistics may be retained indefinitely for service improvement.
    </p>

    <h2 id="age" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">9. Age Requirement</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      You must be at least 18 years old to use Positive Thots. We do not knowingly collect data from individuals under 18. If we discover that a user is under 18, their account will be immediately terminated and all data deleted.
    </p>

    <h2 id="changes" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">10. Changes to This Policy</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the App after changes constitutes acceptance.
    </p>

    <h2 id="contact" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">11. Contact Us</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at privacy@positivethots.com.
    </p>
  </LegalPageShell>
);

export default PrivacyPolicy;

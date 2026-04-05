import { LegalPageShell } from "@/components/LegalPageShell";

const TOC = [
  { id: "intro", title: "Introduction" },
  { id: "info-collect", title: "Information We Collect" },
  { id: "biometric", title: "Biometric & Selfie Data" },
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
    <p className="text-muted-foreground text-sm mb-6">Last updated: April 5, 2026</p>

    <h2 id="intro" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Introduction</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Positive Thots ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our relationship education and community platform ("the App"). By using the App, you consent to the practices described in this policy.
    </p>

    <h2 id="info-collect" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">2. Information We Collect</h2>
    <h3 className="text-base font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Account Information:</strong> Name, email address, date of birth, password</li>
      <li><strong>Profile Information:</strong> Gender, pronouns, sexuality, relationship status, relationship style, interests, desires, bio, location, height, zodiac sign, languages, experience level, photos</li>
      <li><strong>Birth Information:</strong> Date of birth, time of birth (optional), and place of birth (optional) — used solely for astrology compatibility features</li>
      <li><strong>Health Information:</strong> STI testing status and date (voluntarily provided)</li>
      <li><strong>Communication Data:</strong> Messages sent to other users</li>
      <li><strong>Education Data:</strong> Quiz responses, module progress, XP and learning stats</li>
      <li><strong>Verification Data:</strong> Selfie photos submitted for identity verification (see Section 3 below for details)</li>
    </ul>

    <h3 className="text-base font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Device information and browser type</li>
      <li>Usage patterns and interaction data</li>
      <li>Authentication session data</li>
    </ul>

    <h2 id="biometric" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Biometric & Selfie Data</h2>
    <h3 className="text-base font-semibold mt-4 mb-2">3.1 What We Collect</h3>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      For identity verification, we collect a selfie photo that you voluntarily submit. This selfie is compared against your approved profile photos using AI-powered face comparison technology to confirm that you are a real person and that your profile photos depict you.
    </p>
    <h3 className="text-base font-semibold mt-4 mb-2">3.2 How Selfies Are Stored & Processed</h3>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Verification selfies are stored in a <strong>private, access-controlled storage bucket</strong> that is not publicly accessible</li>
      <li>Selfies are accessed only via time-limited signed URLs (valid for 5 minutes) during the AI verification process</li>
      <li>No unauthenticated user can view or access verification selfies</li>
      <li>Selfies are processed by AI for face comparison only — we do not build facial recognition databases or facial geometry templates</li>
    </ul>
    <h3 className="text-base font-semibold mt-4 mb-2">3.3 Retention & Deletion</h3>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      <strong>Verification selfies are deleted immediately after the AI moderation process is complete</strong> — typically within minutes of submission. We do not retain selfie images, facial scans, biometric identifiers, or facial geometry data after the verification decision has been made. The only data retained is the verification result (approved/rejected) and a timestamp.
    </p>
    <h3 className="text-base font-semibold mt-4 mb-2">3.4 Illinois BIPA & Similar State Laws</h3>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We do not collect, capture, store, or retain biometric identifiers or biometric information as defined under the Illinois Biometric Information Privacy Act (BIPA) or similar state laws. The face comparison process generates a similarity score but does not create or store a faceprint, facial geometry template, or other biometric identifier.
    </p>

    <h2 id="sensitive-data" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">4. Sensitive Data</h2>
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

    <h2 id="how-we-use" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">5. How We Use Your Information</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>To create and manage your account</li>
      <li>To facilitate matches and connections with other users</li>
      <li>To provide educational content and track your learning progress</li>
      <li>To moderate content and ensure community safety</li>
      <li>To verify user identity through photo verification</li>
      <li>To calculate astrology compatibility using birth information you provide</li>
      <li>To process premium subscription payments</li>
      <li>To communicate important service updates</li>
    </ul>

    <h2 id="data-sharing" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">6. Data Sharing</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We do not sell your personal information. We may share data with:
    </p>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Other Users:</strong> Your profile information (as configured by your privacy settings) is visible to other authenticated users for matching purposes</li>
      <li><strong>Service Providers:</strong> Payment processing (Stripe), cloud infrastructure, AI content moderation</li>
      <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
    </ul>

    <h2 id="data-security" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">7. Data Security</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We implement industry-standard security measures including encrypted data transmission (TLS), row-level security policies, secure authentication with leaked password protection, and server-side validation of sensitive operations.
    </p>

    <h2 id="your-rights" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">8. Your Rights (GDPR & CCPA)</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">You have the right to:</p>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li><strong>Access:</strong> Request a copy of your personal data (available in Settings → Export Data)</li>
      <li><strong>Rectification:</strong> Update or correct your information via your profile</li>
      <li><strong>Erasure:</strong> Delete your account and all associated data (available in Settings → Delete Account)</li>
      <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
      <li><strong>Restriction:</strong> Limit how we process your data</li>
      <li><strong>Objection:</strong> Object to certain processing of your data</li>
    </ul>

    <h2 id="data-retention" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">9. Data Retention</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">
      We retain your personal data for as long as your account is active. Upon account deletion, personal data is permanently removed within 30 days. Specific retention periods by data type:
    </p>
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm text-muted-foreground border border-border rounded-lg">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="text-left p-3 font-semibold">Data Type</th>
            <th className="text-left p-3 font-semibold">Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50">
            <td className="p-3">Account & profile data</td>
            <td className="p-3">Retained until account deletion; deleted within 30 days of closure</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3">Messages & chat logs</td>
            <td className="p-3">Retained until account deletion; deleted within 30 days of closure</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3">Verification selfies</td>
            <td className="p-3">Deleted immediately after AI verification (within minutes)</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3">Biometric data / faceprints</td>
            <td className="p-3">Not collected or retained</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3">Education progress & XP</td>
            <td className="p-3">Retained until account deletion</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3">Payment records</td>
            <td className="p-3">Retained for 7 years as required by tax law; payment data held by Stripe</td>
          </tr>
          <tr className="border-b border-border/50">
            <td className="p-3">Analytics & usage logs</td>
            <td className="p-3">Anonymized after 90 days; aggregated data retained indefinitely</td>
          </tr>
          <tr>
            <td className="p-3">Error logs</td>
            <td className="p-3">Retained for 90 days, then deleted</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Anonymized, non-identifiable usage statistics may be retained indefinitely for service improvement.
    </p>

    <h2 id="age" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">10. Age Requirement</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      You must be at least 18 years old to use Positive Thots. We do not knowingly collect data from individuals under 18. If we discover that a user is under 18, their account will be immediately terminated and all data deleted.
    </p>

    <h2 id="changes" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">11. Changes to This Policy</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the App after changes constitutes acceptance.
    </p>

    <h2 id="contact" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">12. Contact Us</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at privacy@positivethots.com.
    </p>
  </LegalPageShell>
);

export default PrivacyPolicy;

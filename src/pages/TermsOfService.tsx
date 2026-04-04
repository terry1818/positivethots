import { LegalPageShell } from "@/components/LegalPageShell";

const TOC = [
  { id: "acceptance", title: "Acceptance" },
  { id: "eligibility", title: "Eligibility" },
  { id: "account", title: "Account" },
  { id: "conduct", title: "User Conduct" },
  { id: "content", title: "Content Guidelines" },
  { id: "education", title: "Education & Badges" },
  { id: "premium", title: "Premium" },
  { id: "safety", title: "Safety & Reporting" },
  { id: "disclaimer", title: "Disclaimer" },
  { id: "liability", title: "Liability" },
  { id: "termination", title: "Termination" },
  { id: "dmca", title: "DMCA" },
  { id: "changes", title: "Changes" },
  { id: "governing-law", title: "Governing Law" },
  { id: "contact", title: "Contact" },
];

const TermsOfService = () => (
  <LegalPageShell title="Terms of Service" toc={TOC}>
    <p className="text-muted-foreground text-sm mb-6">Last updated: March 22, 2026</p>

    <h2 id="acceptance" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Acceptance of Terms</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      By accessing or using Positive Thots ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.
    </p>

    <h2 id="eligibility" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">2. Eligibility</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      You must be at least <strong>18 years of age</strong> to create an account or use any features of the App. By registering, you represent and warrant that you are at least 18 years old. We reserve the right to terminate any account we reasonably believe belongs to a minor.
    </p>

    <h2 id="account" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Account Responsibilities</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>You are responsible for maintaining the confidentiality of your login credentials</li>
      <li>You must provide accurate and truthful information in your profile</li>
      <li>You may not create multiple accounts or impersonate another person</li>
      <li>You are solely responsible for all activity that occurs under your account</li>
    </ul>

    <h2 id="conduct" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">4. User Conduct</h2>
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

    <h2 id="content" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">5. Content Guidelines</h2>
    <h3 className="text-base font-semibold mt-4 mb-2">5.1 Photos</h3>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      All uploaded photos are subject to automated AI moderation. Photos must clearly depict you (the account holder). We reserve the right to reject or remove any photo that violates our community standards.
    </p>
    <h3 className="text-base font-semibold mt-4 mb-2">5.2 Messages</h3>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      All messages must respect the other user's boundaries. Unsolicited explicit content is prohibited. Users can report and block others at any time.
    </p>

    <h2 id="education" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">6. Education & Badges</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      The App includes an education system with modules, quizzes, and badges. Quiz answers are validated server-side. Any attempt to cheat, manipulate XP, or exploit the education system may result in account suspension or termination.
    </p>

    <h2 id="premium" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">7. Premium Subscriptions</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Premium features are available via paid subscription through Stripe</li>
      <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
      <li>You may cancel your subscription at any time through Settings → Subscription within the App, or by emailing support@positivethots.com. Cancellation takes effect at the end of the current billing period. No partial-period refunds are issued except where required by applicable law.</li>
      <li>Refunds are handled in accordance with applicable law and Stripe's policies</li>
      <li>We reserve the right to modify pricing with reasonable notice</li>
    </ul>

    <h2 id="safety" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">8. Safety & Reporting</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We take user safety seriously. You can report any user, message, or content that violates these terms. We investigate all reports and may take action including content removal, warnings, temporary suspension, or permanent account termination.
    </p>

    <h2 id="disclaimer" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">9. Disclaimer of Warranties</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      The App is provided "as is" without warranties of any kind, either express or implied. We do not guarantee the accuracy, reliability, or completeness of any content or user-provided information. We are not responsible for the conduct of any user, whether online or offline.
    </p>

    <h2 id="liability" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">10. Limitation of Liability</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      To the maximum extent permitted by law, Positive Thots shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including but not limited to damages from interactions with other users.
    </p>

    <h2 id="termination" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">11. Account Termination</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time through the Settings page. Upon deletion, your personal data will be permanently removed in accordance with our Privacy Policy.
    </p>

    <h2 id="dmca" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">12. DMCA Copyright Policy</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We respect intellectual property rights. If you believe content on the App infringes your copyright, submit a written notice to our designated DMCA agent at legal@positivethots.com with: (1) identification of the copyrighted work claimed to be infringed; (2) identification of the infringing material and its location within the App; (3) your contact information including name, address, phone number, and email; (4) a statement that you have a good faith belief the use is not authorized by the copyright owner; (5) a statement that the information in your notice is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner; and (6) your physical or electronic signature. We will respond to valid notices promptly and may remove or disable access to infringing content.
    </p>

    <h2 id="changes" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">13. Changes to Terms</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We may update these Terms from time to time. Material changes will be communicated via email or in-app notification. Continued use constitutes acceptance of the updated Terms.
    </p>

    <h2 id="governing-law" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">14. Governing Law & Dispute Resolution</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      These Terms are governed by the laws of the State of Ohio, without regard to conflict of law principles. Any dispute arising from these Terms or your use of the App shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration shall be conducted in Cuyahoga County, Ohio, or via video conference at either party's request. Each party waives the right to a jury trial and to participate in any class action lawsuit or class-wide arbitration. Nothing in this section prevents either party from seeking injunctive relief in a court of competent jurisdiction.
    </p>

    <h2 id="contact" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">15. Contact</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Questions about these Terms? Contact us at legal@positivethots.com.
    </p>
  </LegalPageShell>
);

export default TermsOfService;

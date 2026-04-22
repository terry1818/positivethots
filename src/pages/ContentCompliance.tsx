import { LegalPageShell } from "@/components/LegalPageShell";

const TOC = [
  { id: "statement", title: "Compliance Statement" },
  { id: "exemption", title: "Exemption Status" },
  { id: "platform", title: "Platform Policy" },
  { id: "custodian", title: "Records Custodian" },
  { id: "contact", title: "Contact" },
];

const ContentCompliance = () => (
  <LegalPageShell title="18 U.S.C. § 2257 Compliance Statement" toc={TOC}>
    <p className="text-muted-foreground text-sm mb-6">Last updated: April 5, 2026</p>

    <h2 id="statement" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">1. Compliance Statement</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Positive Thots<sup className="text-[0.5em] ml-0.5 align-super">TM</sup> ("the App") is committed to full compliance with 18 U.S.C. § 2257 and 28 C.F.R. Part 75 regarding record-keeping requirements for visual depictions of actual sexually explicit conduct.
    </p>

    <h2 id="exemption" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">2. Exemption Status</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Positive Thots does not produce, commission, or host sexually explicit content as defined under 18 U.S.C. § 2257. The App is a relationship education and dating community platform. All user-uploaded photos are subject to automated AI moderation to prevent sexually explicit content from appearing on the platform.
    </p>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      As a platform that neither produces nor hosts sexually explicit visual depictions, Positive Thots qualifies for the primary producer exemption under 18 U.S.C. § 2257(h)(2)(B)(v). The operator of Positive Thots is not a "producer" within the meaning of § 2257 because it does not create, film, videotape, photograph, or digitally produce sexually explicit depictions.
    </p>

    <h2 id="platform" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">3. Platform Policy on Explicit Content</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>All uploaded photos undergo automated AI content moderation before appearing on the platform</li>
      <li>Sexually explicit content is prohibited under our Community Guidelines and Terms of Service</li>
      <li>Users who upload explicit content are subject to immediate account suspension or termination</li>
      <li>Users must be at least 18 years of age to create an account</li>
      <li>Age verification is enforced during the registration process</li>
    </ul>

    <h2 id="custodian" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">4. Records Custodian</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      While the exemption described above applies, the designated records custodian for any inquiries related to 18 U.S.C. § 2257 compliance is:
    </p>
    <div className="bg-muted/30 rounded-xl p-4 mb-4 text-muted-foreground">
      <p className="font-medium">Rhea &amp; Associates LLC</p>
      <p>Attn: 2257 Compliance Officer</p>
      <p>Email: legal@positivethots.com</p>
    </div>

    <h2 id="contact" className="text-lg font-bold mt-6 mb-3 scroll-mt-24">5. Contact</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      For questions regarding this compliance statement, please contact legal@positivethots.com.
    </p>
  </LegalPageShell>
);

export default ContentCompliance;

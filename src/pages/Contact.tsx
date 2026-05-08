import { LegalPageShell } from "@/components/LegalPageShell";

const ExternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary hover:underline"
  >
    {children}
  </a>
);

const MailLink = ({ email }: { email: string }) => (
  <a href={`mailto:${email}`} className="text-primary hover:underline">
    {email}
  </a>
);

const Contact = () => (
  <LegalPageShell title="Contact Us" toc={[]}>
    <div className="border-b border-border pb-4 mb-6" />

    <h2 className="text-lg font-bold mt-2 mb-3">
      Positive Thots — A platform by Rhea &amp; Associates LLC
    </h2>
    <ul className="space-y-1 mb-6 text-muted-foreground">
      <li><strong>Company name:</strong> Rhea &amp; Associates LLC</li>
      <li><strong>Doing business as (DBA):</strong> Positive Thots</li>
      <li><strong>City:</strong> PLACEHOLDER_CITY</li>
      <li><strong>State / Province:</strong> Ohio</li>
      <li><strong>Country:</strong> United States</li>
    </ul>

    <h2 className="text-lg font-bold mt-6 mb-3">Email us</h2>
    <ul className="list-disc list-inside space-y-1 mb-6 text-muted-foreground">
      <li>General support: <MailLink email="support@positivethots.app" /></li>
      <li>Billing: <MailLink email="billing@positivethots.app" /></li>
      <li>Safety / report content: <MailLink email="safety@positivethots.app" /></li>
      <li>Appeals: <MailLink email="appeals@positivethots.app" /></li>
      <li>Legal: <MailLink email="legal@positivethots.app" /></li>
    </ul>

    <h2 className="text-lg font-bold mt-6 mb-3">Mailing address</h2>
    <p className="mb-6 leading-relaxed text-muted-foreground">PLACEHOLDER_BUSINESS_ADDRESS</p>

    <h2 className="text-lg font-bold mt-6 mb-3">Payment processor support</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">
      For payment, subscription, or billing questions, our payment processor's Consumer Support team can help directly:
    </p>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Help center: <ExternalLink href="https://support.ccbill.com">https://support.ccbill.com</ExternalLink></li>
      <li>Phone: 888-596-9279</li>
      <li>Live chat: <ExternalLink href="https://ccbill.com/contact">https://ccbill.com/contact</ExternalLink></li>
    </ul>
  </LegalPageShell>
);

export default Contact;

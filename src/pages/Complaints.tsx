import { LegalPageShell } from "@/components/LegalPageShell";

const Complaints = () => (
  <LegalPageShell title="Complaints Policy" toc={[]}>
    <div className="border-b border-border pb-4 mb-6" />

    <p className="mb-4 leading-relaxed text-muted-foreground">
      If you would like to make a complaint about content or services on Positive Thots, please contact us via email at{" "}
      <a href="mailto:safety@positivethots.app" className="text-primary hover:underline">
        safety@positivethots.app
      </a>
      .
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">What we accept complaints about</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      We accept complaints about content that may be illegal, that violates our Community Guidelines, or that violates the standards of our payment processor.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">How we respond</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      All complaints will be reviewed and resolved within <strong>5 business days</strong> of receipt. We will communicate the outcome of any investigation or review directly to the person who made the complaint.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">Steps in our review process</h2>
    <ol className="list-decimal list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Receipt — We confirm receipt of your complaint within 1 business day.</li>
      <li>Review — A trained moderator reviews the reported content against our Community Guidelines and applicable law.</li>
      <li>Decision — We decide whether to remove, restrict, or retain the content.</li>
      <li>Communication — We notify the complainant of the outcome.</li>
      <li>Appeal — Either party may appeal under our Appeals Policy.</li>
    </ol>

    <h2 className="text-lg font-bold mt-6 mb-3">Possible outcomes</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Content removed and the responsible account warned, restricted, or banned.</li>
      <li>Content retained because it does not violate our Community Guidelines.</li>
      <li>Account-level action including suspension or permanent ban for severe violations.</li>
      <li>Referral to law enforcement for content that may be illegal.</li>
    </ul>

    <h2 className="text-lg font-bold mt-6 mb-3">Contact</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>
        Email:{" "}
        <a href="mailto:safety@positivethots.app" className="text-primary hover:underline">
          safety@positivethots.app
        </a>
      </li>
      <li>Mailing address: PLACEHOLDER_BUSINESS_ADDRESS</li>
    </ul>

    <p className="text-muted-foreground text-sm mt-8">Last updated: May 9, 2026</p>
  </LegalPageShell>
);

export default Complaints;

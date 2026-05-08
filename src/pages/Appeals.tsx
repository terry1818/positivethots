import { LegalPageShell } from "@/components/LegalPageShell";

const Appeals = () => (
  <LegalPageShell title="Appeals Policy" toc={[]}>
    <div className="border-b border-border pb-4 mb-6" />

    <p className="mb-4 leading-relaxed text-muted-foreground">
      This policy describes how anyone depicted in content on Positive Thots can request that the content be removed.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">Who can submit an appeal</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Any person whose likeness, identity, or personal information appears in content on Positive Thots — whether or not they have an account — may submit an appeal.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">How to submit an appeal</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">
      Send an email to{" "}
      <a href="mailto:appeals@positivethots.app" className="text-primary hover:underline">
        appeals@positivethots.app
      </a>{" "}
      and include:
    </p>
    <ol className="list-decimal list-inside space-y-1 mb-4 text-muted-foreground">
      <li>A description of the content (URL, screenshot, or written description).</li>
      <li>Your relationship to the content (the depicted person, their legal representative, etc.).</li>
      <li>The basis for your appeal (consent was not given, consent was withdrawn, or any other applicable legal ground).</li>
      <li>Contact information so we can communicate the outcome.</li>
    </ol>

    <h2 className="text-lg font-bold mt-6 mb-3">How we respond</h2>
    <ol className="list-decimal list-inside space-y-1 mb-4 text-muted-foreground">
      <li>We acknowledge receipt within 1 business day.</li>
      <li>We review the appeal within 5 business days.</li>
      <li>If we determine that consent was not given, was withdrawn, or is void under applicable law, we will remove the content.</li>
      <li>We will communicate the outcome to the appellant.</li>
    </ol>

    <h2 className="text-lg font-bold mt-6 mb-3">Disputes</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      If there is a disagreement regarding an appeal between Positive Thots and the appellant, that disagreement may be resolved by an independent neutral body. Either party may request neutral resolution.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">Contact</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>
        Email:{" "}
        <a href="mailto:appeals@positivethots.app" className="text-primary hover:underline">
          appeals@positivethots.app
        </a>
      </li>
      <li>Mailing address: PLACEHOLDER_BUSINESS_ADDRESS</li>
    </ul>

    <p className="text-muted-foreground text-sm mt-8">Last updated: May 9, 2026</p>
  </LegalPageShell>
);

export default Appeals;

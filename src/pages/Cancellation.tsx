import { LegalPageShell } from "@/components/LegalPageShell";

const Cancellation = () => (
  <LegalPageShell title="Cancellation Policy" toc={[]}>
    <div className="border-b border-border pb-4 mb-6" />

    <p className="mb-4 leading-relaxed text-muted-foreground">
      You can cancel your Positive Thots subscription at any time. This page explains how.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">How to cancel</h2>
    <p className="mb-2 leading-relaxed text-muted-foreground">
      You can cancel your subscription in any of the following ways:
    </p>
    <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">
      <li>
        <strong>In-app:</strong> Go to Settings → Subscription → Cancel Subscription. Follow the prompts.
      </li>
      <li>
        <strong>By email:</strong> Email{" "}
        <a href="mailto:billing@positivethots.app" className="text-primary hover:underline">
          billing@positivethots.app
        </a>{" "}
        with the email address on your account and a request to cancel.
      </li>
      <li>
        <strong>Through our payment processor:</strong> Contact our payment processor's Consumer Support at{" "}
        <a
          href="https://support.ccbill.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          https://support.ccbill.com
        </a>{" "}
        or by phone at 888-596-9279 (US). They can cancel any subscription on your behalf.
      </li>
    </ol>

    <h2 className="text-lg font-bold mt-6 mb-3">What happens after you cancel</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>Your subscription remains active through the end of the current billing period.</li>
      <li>You will not be charged again.</li>
      <li>You retain access to subscriber-only features until the end of the paid period.</li>
      <li>Your account, profile, and educational progress are preserved unless you also delete the account.</li>
    </ul>

    <h2 className="text-lg font-bold mt-6 mb-3">Refunds</h2>
    <p className="mb-4 leading-relaxed text-muted-foreground">
      Refund requests are reviewed individually. Contact{" "}
      <a href="mailto:billing@positivethots.app" className="text-primary hover:underline">
        billing@positivethots.app
      </a>{" "}
      with your request and we will respond.
    </p>

    <h2 className="text-lg font-bold mt-6 mb-3">Contact</h2>
    <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
      <li>
        Email:{" "}
        <a href="mailto:billing@positivethots.app" className="text-primary hover:underline">
          billing@positivethots.app
        </a>
      </li>
      <li>
        Payment processor support:{" "}
        <a
          href="https://support.ccbill.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          https://support.ccbill.com
        </a>{" "}
        / 888-596-9279
      </li>
    </ul>

    <p className="text-muted-foreground text-sm mt-8">Last updated: May 9, 2026</p>
  </LegalPageShell>
);

export default Cancellation;

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * The policy links every page carries.
 *
 * It follows each page in the normal flow. Its bottom padding (`.app-footer` in index.css) clears
 * whatever is fixed to the bottom of the screen: nothing, the tab bar, or the tab bar plus Learn's
 * continue bar.
 *
 * A screen that fills the phone exactly and does not scroll (Discover, a conversation) would gain a
 * strip of page below it, so the whole screen could be dragged up. Discover is listed in OWN_FOOTER
 * and places `<AppFooter inline />` inside its own scroll area instead; a conversation has no room
 * for one and links the policy that matters there from its menu.
 */
const OWN_FOOTER = ["/"];
/** A conversation is the same kind of screen: header, messages, composer. Its menu links the Complaints Policy. */
const NO_FOOTER_PREFIX = ["/chat/"];

const policyLinks = [
  { to: "/complaints", label: "Complaints Policy" },
  { to: "/appeals", label: "Appeals Policy" },
  { to: "/cancellation", label: "Cancellation Policy" },
  { to: "/contact", label: "Contact Us" },
  { to: "/privacy#do-not-sell", label: "Do Not Sell or Share My Personal Information" },
];

const siteLinks = [
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/community-guidelines", label: "Guidelines" },
];

export const AppFooter = ({ inline = false }: { inline?: boolean }) => {
  const { pathname } = useLocation();
  if (!inline && (OWN_FOOTER.includes(pathname) || NO_FOOTER_PREFIX.some(prefix => pathname.startsWith(prefix)))) return null;

  return (
    <footer className={cn("app-footer w-full text-center", inline && "app-footer-inline")}>
      <nav aria-label="Policies">
        <ul className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-4 text-sm">
          {policyLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to} className="app-footer-link text-muted-foreground hover:text-primary">{link.label}</Link>
            </li>
          ))}
        </ul>
        <ul className="mx-auto mt-1 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 text-xs text-muted-foreground">
          <li>© 2026 Rhea &amp; Associates LLC</li>
          {siteLinks.map(link => (
            <li key={link.to}>
              <Link to={link.to} className="app-footer-link hover:text-foreground">{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
};

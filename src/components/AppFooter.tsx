import { Link } from "react-router-dom";

const policyLinkClass =
  "font-['Inter'] text-muted-foreground hover:text-primary transition-colors";

export const AppFooter = () => (
  <footer className="w-full px-4 pb-20 pt-4 text-center">
    <div className="mx-auto mb-3 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
      <Link to="/complaints" className={policyLinkClass}>Complaints Policy</Link>
      <span aria-hidden className="text-muted-foreground/40">|</span>
      <Link to="/appeals" className={policyLinkClass}>Appeals Policy</Link>
      <span aria-hidden className="text-muted-foreground/40">|</span>
      <Link to="/cancellation" className={policyLinkClass}>Cancellation Policy</Link>
      <span aria-hidden className="text-muted-foreground/40">|</span>
      <Link to="/contact" className={policyLinkClass}>Contact Us</Link>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60">
      <span>© 2026 Rhea &amp; Associates LLC</span>
      <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
      <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
      <Link to="/community-guidelines" className="hover:text-muted-foreground transition-colors">Guidelines</Link>
      <Link to="/2257" className="hover:text-muted-foreground transition-colors">2257 Statement</Link>
    </div>
  </footer>
);

import { Link } from "react-router-dom";

export const AppFooter = () => (
  <footer className="w-full py-4 px-4 text-center pb-20">
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60">
      <span>© 2026 Rhea &amp; Associates LLC</span>
      <Link to="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
      <Link to="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
      <Link to="/community-guidelines" className="hover:text-muted-foreground transition-colors">Guidelines</Link>
      <Link to="/2257" className="hover:text-muted-foreground transition-colors">2257 Statement</Link>
    </div>
  </footer>
);

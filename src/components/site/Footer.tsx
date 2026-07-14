import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-arctic-deep px-6 py-20 text-white lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
            The Afro Polar Institute connects Africa and the Polar regions through
            scientific research, policy dialogue, indigenous knowledge and cultural exchange.
          </p>
          <div className="mt-8 space-y-1 text-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">Director</p>
            <p className="font-semibold">Larry Ibrahim Mohammed</p>
            <p className="text-white/60">+47 48 62 66 55</p>
            <a href="mailto:afropolarinitiative@gmail.com" className="text-aurora hover:text-white transition-colors">
              afropolarinitiative@gmail.com
            </a>
          </div>
        </div>

        <div>
          <h5 className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Institute</h5>
          <ul className="space-y-3 text-sm text-white/70">
            <li><Link to="/about" className="hover:text-aurora">About API</Link></li>
            <li><Link to="/research" className="hover:text-aurora">Research</Link></li>
            <li><Link to="/fellows" className="hover:text-aurora">Fellowships</Link></li>
            <li><Link to="/events" className="hover:text-aurora">Events</Link></li>
            <li><Link to="/magazine" className="hover:text-aurora">Magazine</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Newsletter</h5>
          <p className="mb-4 text-sm text-white/60">Monthly briefing on latitude-spanning research.</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label className="sr-only" htmlFor="footer-email">Email address</label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="you@institute.org"
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm placeholder:text-white/30 focus:border-aurora focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-aurora px-4 py-2 text-xs font-bold uppercase tracking-widest text-arctic-deep transition-colors hover:bg-white"
            >
              Join
            </button>
          </form>
          <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-white/30">Connecting Latitudes Monthly</p>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Afro Polar Institute. All latitudes respected.</p>
        <div className="flex gap-6 text-xs text-white/40">
          <Link to="/contact" className="hover:text-aurora">Contact</Link>
          <a href="#" className="hover:text-aurora">Privacy</a>
          <a href="#" className="hover:text-aurora">Terms</a>
        </div>
      </div>
    </footer>
  );
}

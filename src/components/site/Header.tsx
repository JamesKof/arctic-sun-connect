import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const nav = [
  { to: "/about", label: "About" },
  { to: "/research", label: "Our Work" },
  { to: "/fellows", label: "Fellows" },
  { to: "/magazine", label: "Magazine" },
  { to: "/events", label: "Events" },
];

export function Header() {
  return (
    <header className="glass fixed top-0 z-50 w-full border-b border-arctic-deep/5">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" aria-label="Afro Polar Institute — Home">
          <Logo />
        </Link>
        <div className="hidden items-center gap-8 text-[13px] font-medium uppercase tracking-[0.14em] text-arctic-deep/80 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="transition-colors hover:text-aurora"
              activeProps={{ className: "text-aurora" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden text-[12px] font-semibold uppercase tracking-[0.16em] text-arctic-deep/70 hover:text-aurora md:inline">Sign in</Link>
          <Link
            to="/contact"
            className="rounded-full bg-arctic-deep px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm ring-1 ring-arctic-deep/10 transition-all hover:bg-aurora hover:text-arctic-deep"
          >
            Collaborate
          </Link>
        </div>
      </nav>
    </header>
  );
}

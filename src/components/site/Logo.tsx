export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="group flex items-center gap-2.5">
      <div className="relative h-9 w-9 rounded-full bg-gradient-to-tr from-arctic-deep to-aurora shadow-sm transition-transform duration-500 group-hover:rotate-[18deg]">
        <div className="absolute inset-[3px] rounded-full border border-white/40" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-5 -translate-x-1/2 -translate-y-1/2 bg-sunrise" />
        <div className="absolute inset-0 rounded-full animate-pulse-ring" />
      </div>
      <div className="leading-none">
        <div className={`font-display text-[15px] font-bold uppercase tracking-[0.14em] ${light ? "text-white" : "text-arctic-deep"}`}>
          Afro Polar
        </div>
        <div className={`mt-1 text-[9px] uppercase tracking-[0.32em] ${light ? "text-white/60" : "text-arctic-deep/50"}`}>
          Institute
        </div>
      </div>
    </div>
  );
}


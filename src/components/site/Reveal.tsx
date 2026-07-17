import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { duration as D, easing as E, stagger as S } from "@/lib/motion";

type RevealVariant = "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";

type RevealProps = {
  children: ReactNode;
  /** Explicit delay in ms. Overrides `index`/`stagger`. */
  delay?: number;
  /** When present, computes delay = index * stagger for consistent sequencing. */
  index?: number;
  stagger?: keyof typeof S | number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  variant?: RevealVariant;
  /** Override the shared duration token. */
  duration?: keyof typeof D | number;
};

// Single shared observer — reused across every <Reveal /> mount so we don't
// create N observers on content-heavy pages (major perf win on the magazine).
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver() {
  if (typeof IntersectionObserver === "undefined") return null;
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          if (cb) cb();
          sharedObserver?.unobserve(entry.target);
          callbacks.delete(entry.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
  );
  return sharedObserver;
}

export function Reveal({
  children,
  delay,
  index,
  stagger = "base",
  className = "",
  as = "div",
  variant = "fade-up",
  duration: dur = "slow",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the resolved motion preference set on <html data-motion>.
    const motion = document.documentElement.getAttribute("data-motion");
    if (motion === "reduced") {
      setShown(true);
      return;
    }

    const io = getObserver();
    if (!io) {
      setShown(true);
      return;
    }
    callbacks.set(el, () => setShown(true));
    io.observe(el);
    return () => {
      io.unobserve(el);
      callbacks.delete(el);
    };
  }, []);

  const resolvedDelay =
    typeof delay === "number"
      ? delay
      : typeof index === "number"
      ? index * (typeof stagger === "number" ? stagger : S[stagger])
      : 0;
  const resolvedDuration = typeof dur === "number" ? dur : D[dur];

  const Tag = as as any;
  const style: CSSProperties = {
    transitionDelay: `${resolvedDelay}ms`,
    transitionDuration: `${resolvedDuration}ms`,
    transitionTimingFunction: E.expoOut,
  };

  return (
    <Tag
      ref={ref as any}
      style={style}
      data-shown={shown ? "true" : "false"}
      className={`reveal reveal-${variant} ${className}`}
    >
      {children}
    </Tag>
  );
}

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  variant?: "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right";
};

export function Reveal({ children, delay = 0, className = "", as = "div", variant = "fade-up" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as any;
  const style: CSSProperties = { transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` };

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

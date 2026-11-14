"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

const TILT = -78; // deg: card starts folded back on its top hinge
const FROM = 0.95, TO = 0.5; // card top travels from 95% to 50% of the viewport while it flips down
const LAG = 90; // px of scroll between cards that share a row

/** Grid whose cards flip down into place one by one as they scroll in, like a rolodex. Scrubbed, rewinds. SSR/no-JS/reduced motion: flat grid. */
export function Rolodex({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const tops = useRef<number[]>([]); // untransformed page-Y of each card's top

  const apply = (y: number) => {
    const el = ref.current;
    if (!el || reduce) return;
    const vh = window.innerHeight;
    Array.from(el.children as HTMLCollectionOf<HTMLElement>).forEach((c, i) => {
      const top = (tops.current[i] ?? 0) - y;
      const p = Math.min(1, Math.max(0, (vh * FROM - top) / (vh * (FROM - TO))));
      const e = 1 - Math.pow(1 - p, 3); // ease-out: settles softly
      c.style.transform = p < 1 ? `perspective(1000px) rotateX(${TILT * (1 - e)}deg)` : "";
      c.style.opacity = p < 1 ? String(0.35 + 0.65 * e) : "";
    });
  };

  useEffect(() => {
    const el = ref.current!;
    const kids = () => Array.from(el.children as HTMLCollectionOf<HTMLElement>);
    if (reduce) { kids().forEach(c => { c.style.transform = ""; c.style.opacity = ""; }); return; }
    kids().forEach(c => (c.style.transformOrigin = "50% 0"));
    const measure = () => {
      const base = el.getBoundingClientRect().top + window.scrollY; // grid itself is never transformed
      // offsetTop ignores transforms (grid is position:relative); a right-column card flips a beat after its row-mate
      tops.current = kids().map(c => base + c.offsetTop + (c.offsetLeft > 0 ? LAG : 0));
      apply(window.scrollY);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);
  useMotionValueEvent(scrollY, "change", apply);

  return <div ref={ref} className={className}>{children}</div>;
}

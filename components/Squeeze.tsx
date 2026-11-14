"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

const SPREAD = 0.22, SHRINK = 0.1;

/** Gallery grid whose tiles start spread out from the centre and pull in tight as you scroll ("mesa apertada"). Scrubbed, rewinds. SSR/no-JS/reduced motion: plain tight grid. */
export function Squeeze({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "center 0.55"] });
  const vecs = useRef<[number, number][]>([]);

  const apply = (v: number) => {
    const el = ref.current;
    if (!el || reduce) return;
    const s = 1 - v;
    Array.from(el.children as HTMLCollectionOf<HTMLElement>).forEach((c, i) => {
      const [dx, dy] = vecs.current[i] ?? [0, 0];
      c.style.transform = s > 0 ? `translate(${dx * s * SPREAD}px, ${dy * s * SPREAD}px) scale(${1 - s * SHRINK})` : "";
    });
  };

  useEffect(() => {
    const el = ref.current!;
    if (reduce) { Array.from(el.children as HTMLCollectionOf<HTMLElement>).forEach(c => (c.style.transform = "")); return; }
    const measure = () => {
      const cx = el.offsetWidth / 2, cy = el.offsetHeight / 2; // children's offsetParent is the grid (position:relative)
      vecs.current = Array.from(el.children as HTMLCollectionOf<HTMLElement>, c => [c.offsetLeft + c.offsetWidth / 2 - cx, c.offsetTop + c.offsetHeight / 2 - cy]);
      apply(p.get());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);
  useMotionValueEvent(p, "change", apply);

  return <div ref={ref} className={className}>{children}</div>;
}

"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";

const SPEED = 0.85; // 1 = fully slid exactly when the strip leaves the top of the viewport; lower = slower

/** Photo/tile strip that slides sideways as the page scrolls down (0 at page top; scrubbed, rewinds). Reduced motion: plain horizontal scroll. */
export function Strip({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const dist = useMotionValue(0);
  const end = useMotionValue(1); // page scrollY at which the strip has left the top of the viewport
  const { scrollY } = useScroll();
  const x = useTransform(() => -Math.min(1, (scrollY.get() * SPEED) / end.get()) * dist.get());

  useEffect(() => {
    const measure = () => {
      const r = ref.current!.getBoundingClientRect();
      dist.set(Math.max(0, track.current!.offsetWidth - r.width));
      end.set(Math.max(1, r.bottom + window.scrollY));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current!);
    ro.observe(track.current!);
    return () => ro.disconnect();
  }, [dist, end]);

  return (
    <section ref={ref} className={`strip${reduce ? " strip-free" : ""}`} aria-label={label}>
      <motion.div ref={track} className="strip-track" style={reduce ? undefined : { x }}>{children}</motion.div>
    </section>
  );
}

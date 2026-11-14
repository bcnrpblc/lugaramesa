"use client";
import { useRef, type ReactNode, type RefObject } from "react";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

type Offset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];
const INK = "#000000", CLEAR = "rgba(0,0,0,0)";

/** Scroll progress of `ref` (scrubbed, rewinds on scroll up); pinned to 1 under reduced motion. */
function useProgress(ref: RefObject<HTMLElement | null>, offset: Offset) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const done = useTransform(() => 1);
  return reduce ? done : scrollYProgress;
}

function Guest({ p, i }: { p: MotionValue<number>; i: number }) {
  const range = [i * 0.12, i * 0.12 + 0.12];
  const backgroundColor = useTransform(p, range, [CLEAR, INK]);
  const scale = useTransform(p, range, [0.82, 1]);
  return <motion.i style={{ backgroundColor, scale }} />;
}

function OpenSeat({ p }: { p: MotionValue<number> }) {
  const rotate = useTransform(p, [0.72, 1], [0, 120]);
  return <motion.i style={{ rotate }} />;
}

/** Convite card, act 1: 6 guests sit down one by one as you scroll; the 2 open seats turn, inviting. */
export function Seating() {
  const ref = useRef<HTMLDivElement>(null);
  const p = useProgress(ref, ["start 0.95", "start 0.4"]);
  return (
    <div ref={ref} className="seating" aria-label="6 lugares ocupados, 2 livres">
      {[0, 1, 2, 3, 4, 5].map(i => <Guest key={i} p={p} i={i} />)}
      <OpenSeat p={p} /><OpenSeat p={p} />
    </div>
  );
}

/** "A mesa" card, act 2: comes into focus only after the seats are full (its range starts where theirs ends). */
export function Unblur({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const p = useProgress(ref, ["start 0.55", "start 0.3"]);
  const blur = useTransform(p, [0, 1], [12, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;
  const opacity = useTransform(p, [0, 1], [0.25, 1]);
  return <motion.div ref={ref} style={{ display: "grid", gap: 12, filter, opacity }}>{children}</motion.div>;
}

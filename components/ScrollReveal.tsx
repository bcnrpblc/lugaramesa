"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

const GRAY = "#9CA3AF", INK = "#111111", HOT = "#FF83DA"; // HOT = --hot (motion can't interpolate var())

function Word({ text, hot, p, i, n }: { text: string; hot: boolean; p: MotionValue<number>; i: number; n: number }) {
  const color = useTransform(p, [i / n, (i + 1) / n], [GRAY, hot ? HOT : INK]);
  return <><motion.span style={{ color }}>{text}</motion.span>{" "}</>;
}

/** Heading whose words go gray → ink (or pink for `hot` parts) as it scrolls through the viewport. Scrubbed, reverses on scroll up. */
export function ScrollReveal({ parts }: { parts: { text: string; hot?: boolean }[] }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = parts.flatMap(({ text, hot }) => text.trim().split(/\s+/).map(w => ({ w, hot: !!hot })));
  return (
    <h2 ref={ref}>
      {words.map(({ w, hot }, i) => <Word key={i} text={w} hot={hot} p={scrollYProgress} i={i} n={words.length} />)}
    </h2>
  );
}

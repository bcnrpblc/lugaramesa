"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const KEY = "burst-seen";

/** Black CTA section: an inset rounded card that bursts to full bleed once, when its text comes into view. Remembered in localStorage, so returning visitors see it already open. */
export function Burst({ id, children }: { id?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [seen, setSeen] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(KEY)) setSeen(true); } catch {} }, []);
  useEffect(() => { if (inView) try { localStorage.setItem(KEY, "1"); } catch {} }, [inView]);

  const open = seen || inView || !!reduce;
  const instant = seen || !!reduce;
  const t = instant ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const };
  return (
    <section ref={ref} id={id} className="burst">
      <motion.div className="black ready" initial={false} transition={t}
        animate={{ clipPath: open ? "inset(0% 0% round 0px)" : "inset(0% 4.5% round 56px)" }}>
        <motion.div className="wrap" initial={false} transition={instant ? t : { ...t, delay: 0.15 }}
          animate={open ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.8, y: 120, opacity: 0.15 }}>{children}</motion.div>
      </motion.div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Value = string | string[] | boolean | undefined;
export type Values = Record<string, Value>;
export type Option = { value: string; label: string; exclusive?: boolean };

export type Step = {
  id: string;
  kind: "email" | "text" | "tel" | "textarea" | "single" | "multi" | "scale" | "consent";
  title: string;
  help?: string;
  optional?: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: Option[];
  /** multi: optional free-text field stored under this key */
  notesKey?: string;
  notesPlaceholder?: string;
  /** scale: labels for 1 and 5 */
  scaleLabels?: [string, string];
  /** consent: checkboxes; `when` decides if a box is shown (and then required) */
  boxes?: { key: string; label: React.ReactNode; when?: (v: Values) => boolean }[];
  when?: (v: Values) => boolean;
  validate?: (v: Value, all: Values) => string | null;
  /** async check on Continue (e.g. server action); return error text or null */
  check?: (v: Value, all: Values) => Promise<string | null>;
};

type Props = {
  steps: Step[];
  initial?: Values;
  submitLabel: string;
  onSubmit: (v: Values) => Promise<string | null>; // returns error text or null
  accent?: string;
  /** shown above the first question */
  intro?: React.ReactNode;
};

const LETTERS = "ABCDEFGHIJ";

function isEmpty(v: Value) {
  return v === undefined || v === "" || (Array.isArray(v) && v.length === 0) || v === false;
}

export default function Flow({ steps, initial = {}, submitLabel, onSubmit, intro }: Props) {
  const [values, setValues] = useState<Values>(initial);
  const visible = useMemo(() => steps.filter((s) => !s.when || s.when(values)), [steps, values]);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();
  const step = visible[Math.min(idx, visible.length - 1)];
  const isLast = idx >= visible.length - 1;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback((k: string, v: Value) => {
    setError(null);
    setValues((p) => ({ ...p, [k]: v }));
  }, []);

  const localError = useCallback(
    (s: Step, all: Values): string | null => {
      const v = all[s.id];
      if (s.kind === "consent") {
        const missing = (s.boxes || []).filter((b) => (!b.when || b.when(all)) && !all[b.key]);
        return missing.length ? "Marque para continuar." : null;
      }
      if (!s.optional && isEmpty(v)) return s.kind === "single" || s.kind === "multi" || s.kind === "scale" ? "Escolha uma opção." : "Responde essa pra gente seguir.";
      return s.validate ? s.validate(v, all) : null;
    },
    []
  );

  const next = useCallback(
    async (override?: Values) => {
      const all = override || values;
      const e = localError(step, all);
      if (e) return setError(e);
      setBusy(true);
      try {
        if (step.check) {
          const ce = await step.check(all[step.id], all);
          if (ce) return setError(ce);
        }
        if (isLast) {
          const se = await onSubmit(all);
          if (se) setError(se);
          return;
        }
        setDir(1);
        setIdx((i) => i + 1);
      } catch {
        setError("Algo deu errado. Tenta de novo?");
      } finally {
        setBusy(false);
      }
    },
    [values, step, isLast, onSubmit, localError]
  );

  const back = () => {
    if (idx === 0) return;
    setError(null);
    setDir(-1);
    setIdx((i) => i - 1);
  };

  const pick = (o: Option) => {
    if (step.kind === "single" || step.kind === "scale") {
      const nv = { ...values, [step.id]: o.value };
      set(step.id, o.value);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => next(nv), 260);
    } else if (step.kind === "multi") {
      const cur = (values[step.id] as string[]) || [];
      let nv: string[];
      if (cur.includes(o.value)) nv = cur.filter((x) => x !== o.value);
      else if (o.exclusive) nv = [o.value];
      else nv = [...cur.filter((x) => !step.options!.find((p) => p.value === x)?.exclusive), o.value];
      set(step.id, nv);
    }
  };

  // keyboard: letters pick options, Enter continues
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "Enter" && !e.shiftKey && !(t?.tagName === "TEXTAREA") && !(t?.tagName === "BUTTON")) {
        e.preventDefault();
        if (!busy) next();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (step.options && (step.kind === "single" || step.kind === "multi")) {
        const i = LETTERS.indexOf(e.key.toUpperCase());
        if (i >= 0 && i < step.options.length) pick(step.options[i]);
      }
      if (step.kind === "scale" && /^[1-5]$/.test(e.key)) pick({ value: e.key, label: e.key });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const variants = {
    enter: (d: number) => ({ opacity: 0, y: reduce ? 0 : d * 48 }),
    center: { opacity: 1, y: 0 },
    exit: (d: number) => ({ opacity: 0, y: reduce ? 0 : d * -48 }),
  };
  const progress = ((idx + (isLast ? 1 : 0)) / visible.length) * 100;
  const autoAdvance = step.kind === "single" || step.kind === "scale";

  return (
    <div className="min-h-[100svh] bg-cream flex flex-col">
      <div className="h-1.5 bg-line"><motion.div className="h-full bg-pink" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} /></div>
      <header className="flex items-center justify-between px-4 sm:px-8 py-4">
        <Link href="/" className="font-black uppercase tracking-tight text-[1rem] flex items-center gap-3" style={{ fontFamily: "var(--display)" }}>
          <span aria-hidden className="inline-block w-[18px] h-[18px] rounded-full bg-ink" style={{ boxShadow: "6px 0 0 var(--hot)" }} />
          <span className="ml-1.5">Um Lugar à Mesa</span>
        </Link>
        <span className="eyebrow text-muted tabular-nums">{Math.min(idx + 1, visible.length)} / {visible.length}</span>
      </header>

      <main className="flex-1 flex items-center px-4 sm:px-8 pb-28 pt-4">
        <div className="w-full max-w-[720px] mx-auto">
          {idx === 0 && intro}
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section
              key={step.id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              aria-labelledby={`q-${step.id}`}
            >
              <h1 id={`q-${step.id}`} className="display text-[clamp(2rem,5.4vw,3.4rem)]">{step.title}</h1>
              {step.help && <p className="mt-3 text-muted max-w-[52ch]">{step.help}</p>}
              <div className="mt-8">
                <StepBody step={step} values={values} set={set} pick={pick} />
              </div>
              <div className="mt-6 min-h-[1.5rem]" aria-live="polite">
                {error && <p className="font-semibold text-[#B0006E]">{error}</p>}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-cream/95 backdrop-blur border-t border-line">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
          <button type="button" className="pill pill-line" onClick={back} disabled={idx === 0 || busy} aria-label="Voltar">← Voltar</button>
          <div className="flex gap-2">
            {step.optional && !isLast && autoAdvance && (
              <button type="button" className="pill pill-line" onClick={() => { set(step.id, undefined); setDir(1); setIdx((i) => i + 1); }} disabled={busy}>Pular</button>
            )}
            {(!autoAdvance || isLast) && (
              <button type="button" className={`pill ${isLast ? "pill-hot" : "pill-ink"}`} onClick={() => next()} disabled={busy}>
                {busy ? "Enviando…" : isLast ? submitLabel : step.optional && isEmpty(values[step.id]) ? "Pular →" : "Continuar →"}
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

function StepBody({ step, values, set, pick }: { step: Step; values: Values; set: (k: string, v: Value) => void; pick: (o: Option) => void }) {
  const v = values[step.id];
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 340);
    return () => clearTimeout(t);
  }, [step.id]);

  switch (step.kind) {
    case "email":
    case "text":
    case "tel":
      return (
        <input
          ref={inputRef}
          className="field"
          type={step.kind === "text" ? "text" : step.kind}
          inputMode={step.kind === "tel" ? "tel" : step.kind === "email" ? "email" : undefined}
          autoComplete={step.kind === "email" ? "email" : step.kind === "tel" ? "tel" : step.id === "name" ? "given-name" : "off"}
          placeholder={step.placeholder}
          maxLength={step.maxLength || 200}
          value={(v as string) || ""}
          onChange={(e) => set(step.id, step.kind === "tel" ? maskPhone(e.target.value) : e.target.value)}
          aria-labelledby={`q-${step.id}`}
        />
      );
    case "textarea":
      return (
        <textarea
          ref={inputRef}
          className="field"
          rows={2}
          placeholder={step.placeholder}
          maxLength={step.maxLength || 500}
          value={(v as string) || ""}
          onChange={(e) => set(step.id, e.target.value)}
          aria-labelledby={`q-${step.id}`}
        />
      );
    case "single":
    case "multi": {
      const sel = step.kind === "multi" ? ((v as string[]) || []) : [v as string];
      return (
        <div>
          <div role={step.kind === "single" ? "radiogroup" : "group"} aria-labelledby={`q-${step.id}`} className="grid gap-2.5 max-w-[520px]">
            {step.options!.map((o, i) => {
              const on = sel.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  className="choice"
                  role={step.kind === "single" ? "radio" : "checkbox"}
                  aria-checked={on}
                  onClick={() => pick(o)}
                >
                  <kbd aria-hidden>{LETTERS[i]}</kbd>
                  <span className="flex-1">{o.label}</span>
                  {on && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
          {step.kind === "multi" && <p className="mt-3 text-sm text-muted">Pode marcar mais de uma.</p>}
          {step.notesKey && (
            <input
              className="field mt-8 !text-[1.15rem]"
              placeholder={step.notesPlaceholder}
              maxLength={300}
              value={(values[step.notesKey] as string) || ""}
              onChange={(e) => set(step.notesKey!, e.target.value)}
              aria-label={step.notesPlaceholder}
            />
          )}
        </div>
      );
    }
    case "scale":
      return (
        <div className="max-w-[560px]">
          <div role="radiogroup" aria-labelledby={`q-${step.id}`} className="grid grid-cols-5 gap-2.5">
            {["1", "2", "3", "4", "5"].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={v === n} className="choice !justify-center !px-0 !py-5 display !text-[1.8rem]" onClick={() => pick({ value: n, label: n })}>
                {n}
              </button>
            ))}
          </div>
          {step.scaleLabels && (
            <div className="mt-2 flex justify-between text-sm text-muted"><span>{step.scaleLabels[0]}</span><span>{step.scaleLabels[1]}</span></div>
          )}
        </div>
      );
    case "consent":
      return (
        <div className="grid gap-3 max-w-[600px]">
          {(step.boxes || []).filter((b) => !b.when || b.when(values)).map((b) => (
            <label key={b.key} className="choice !items-start !font-normal" aria-checked={!!values[b.key]}>
              <input type="checkbox" className="mt-1 w-5 h-5 accent-black shrink-0" checked={!!values[b.key]} onChange={(e) => set(b.key, e.target.checked)} />
              <span>{b.label}</span>
            </label>
          ))}
        </div>
      );
  }
}

function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.startsWith("55") && d.length > 11) {
    const r = d.slice(2);
    return "+55 " + maskLocal(r);
  }
  return maskLocal(d);
}
function maskLocal(d: string) {
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

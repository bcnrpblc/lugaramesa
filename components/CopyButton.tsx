"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copiar", className = "pill pill-line" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { window.prompt("Copie:", text); return; }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? "Copiado ✓" : label}
    </button>
  );
}

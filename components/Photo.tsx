"use client";
import { useEffect, useRef, useState } from "react";

/** Photo slot: shows the image if the file exists in /public, otherwise the labelled placeholder (same as LP v8). */
export function Photo({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const [ok, setOk] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const im = ref.current;
    if (im && im.complete && im.naturalWidth > 0) setOk(true);
  }, []);
  return (
    <figure className={`ph${ok ? " has-img" : ""}`}>
      <figcaption>{caption}</figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} src={src} alt={alt} loading="lazy" onLoad={() => setOk(true)} onError={() => setOk(false)} style={ok ? undefined : { opacity: 0 }} />
    </figure>
  );
}

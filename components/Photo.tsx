"use client";
import { useEffect, useRef, useState } from "react";

/** Photo slot: the image is visible from the server render (works without JS); the labelled placeholder shows only if the file is missing. `priority` = above-the-fold / LCP image. */
export function Photo({ src, alt, caption, priority = false }: { src: string; alt: string; caption: string; priority?: boolean }) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const im = ref.current; // an error before hydration never reaches onError
    if (im && im.complete && im.naturalWidth === 0) setMissing(true);
  }, []);
  return (
    <figure className={`ph${missing ? " missing" : ""}`}>
      <figcaption>{caption}</figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ref} src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} onError={() => setMissing(true)} />
    </figure>
  );
}

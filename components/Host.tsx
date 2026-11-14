import Link from "next/link";
import { Photo } from "@/components/Photo";
import { HOST } from "@/lib/host";

/** Full section (Por quê). */
export function HostSection() {
  return (
    <section className="statement" id="anfitriao"><div className="wrap" style={{ alignItems: "start" }}>
      <div className="grid gap-4">
        <span className="eyebrow">Quem é o anfitrião</span>
        <div style={{ aspectRatio: "4 / 5", display: "grid" }}><Photo src={HOST.photo} alt={`${HOST.name}, o anfitrião`} caption={`Foto: ${HOST.name} na cozinha`} /></div>
      </div>
      <div className="grid gap-5 content-start">
        <h2>{HOST.intro} <span className="soft">{HOST.why}</span></h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {HOST.facts.filter(([, v]) => !v.includes("{")).map(([k, v]) => (
            <div key={k} className="rounded-card p-4" style={{ background: "var(--cyan)" }}>
              <p className="eyebrow mb-2">{k}</p>
              <p className="font-semibold leading-snug">{v}</p>
            </div>
          ))}
        </div>
        <p className="rounded-card p-4 font-semibold" style={{ background: "var(--lime)" }}>{HOST.trust}</p>
      </div>
    </div></section>
  );
}

/** Compact block (LP). */
export function HostTeaser() {
  return (
    <section className="statement" id="anfitriao"><div className="wrap" style={{ alignItems: "center" }}>
      <div style={{ aspectRatio: "1 / 1", maxWidth: 360, width: "100%", display: "grid" }}><Photo src={HOST.photo} alt={`${HOST.name}, o anfitrião`} caption={`Foto: ${HOST.name}`} /></div>
      <div className="grid gap-4">
        <span className="eyebrow">Quem recebe</span>
        <h2>Oi, eu sou o {HOST.name}. <span className="soft">{HOST.short}</span></h2>
        <div><Link className="btn btn-line" href="/por-que#anfitriao">Conhecer o anfitrião</Link></div>
      </div>
    </div></section>
  );
}

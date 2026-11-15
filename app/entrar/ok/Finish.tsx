"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { finishLogin } from "../actions";

/** Supabase sends the session in the URL fragment (#access_token=…), which only the browser sees. */
export function Finish() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    history.replaceState(null, "", window.location.pathname); // don't leave the token in the address bar
    const token = h.get("access_token");
    if (!token) { setError(h.get("error_description")?.replace(/\+/g, " ") ? "Esse link expirou ou já foi usado. Peça outro." : "Link incompleto. Peça outro."); return; }
    finishLogin(token).then((r) => ("to" in r ? router.replace(r.to) : setError(r.error)));
  }, [router]);
  if (!error) return <p>Abrindo seu espaço…</p>;
  return (<><p role="alert" className="text-pink font-semibold">{error}</p><div><Link className="pill pill-hot" href="/entrar">Pedir outro link</Link></div></>);
}

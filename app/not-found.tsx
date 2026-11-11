import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-[100svh] bg-black text-white flex items-center px-4">
      <div className="max-w-[720px] mx-auto grid gap-5">
        <span className="eyebrow text-pink">404</span>
        <h1 className="display uppercase text-[clamp(2.6rem,8vw,5rem)]">Essa cadeira não existe.</h1>
        <p className="text-[#c9c9cf]">Confere o link que você recebeu. Se ainda não funcionar, fala com quem te convidou.</p>
        <div><Link className="pill pill-hot" href="/">Ir para o início</Link></div>
      </div>
    </div>
  );
}

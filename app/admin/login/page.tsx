import { login } from "../actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4">
      <form action={login} className="w-full max-w-sm rounded-card bg-white p-6">
        <p className="eyebrow mb-2">Um Lugar à Mesa</p>
        <h1 className="display mb-5 text-3xl">Admin</h1>
        {erro && <p role="alert" className="mb-3 rounded-lg bg-pink px-3 py-2 text-sm font-semibold">{erro}</p>}
        <label className="mb-1 block text-sm font-semibold" htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required className="mb-4 w-full rounded-lg border border-line bg-field px-3 py-2" />
        <button className="pill pill-ink w-full">Entrar</button>
      </form>
    </main>
  );
}

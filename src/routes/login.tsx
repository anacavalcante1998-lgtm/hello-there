import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { getLibraryIdentity, signInWithPassword } from "../lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — Entre Páginas" }] }),
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getLibraryIdentity()
      .then((identity) => {
        if (active && identity) window.location.replace(identity.profile.role === "admin" ? "/admin" : "/");
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Não foi possível verificar a sessão.");
      });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { user } = await signInWithPassword(email.trim(), password);
      if (!user) throw new Error("Não foi possível iniciar a sessão.");
      const identity = await getLibraryIdentity();
      window.location.assign(identity?.profile.role === "admin" ? "/admin" : "/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao entrar. Confira seus dados e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9F6] px-5 py-12 text-[#4A1727]">
      <div className="w-full max-w-md rounded-3xl border border-[#F0789D]/35 bg-white p-7 shadow-[0_16px_48px_rgba(153,11,48,0.09)] sm:p-10">
        <a href="/" className="inline-flex items-center gap-3 font-serif text-2xl font-bold text-[#990B30]">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#F8C9D5]"><BookOpen aria-hidden="true" className="size-5" /></span>
          Entre Páginas
        </a>
        <h1 className="mt-8 font-serif text-3xl font-bold text-[#990B30]">Acesse sua conta</h1>
        <p className="mt-2 text-sm leading-6 text-[#633848]">Entre para gerenciar a biblioteca ou acessar sua conta de leitor.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#4A1727]">E-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#F0789D]/50 bg-[#FFF9F6] px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#4A1727]">Senha</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#F0789D]/50 bg-[#FFF9F6] px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" />
          </div>
          {message && <p role="alert" className="rounded-xl border border-[#E9437A]/30 bg-[#FFF2EB] px-4 py-3 text-sm text-[#7D0928]">{message}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#990B30] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#7D0928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30] disabled:cursor-wait disabled:opacity-60">
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <a href="/" className="mt-6 inline-block text-sm font-semibold text-[#990B30] hover:text-[#7D0928]">Voltar à biblioteca</a>
      </div>
    </main>
  );
}

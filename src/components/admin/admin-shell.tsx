import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, LayoutDashboard, LogOut, Tags, Upload } from "lucide-react";
import { getLibraryIdentity, signOut, type LibraryIdentity } from "../../lib/auth";

export function AdminShell({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<LibraryIdentity | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getLibraryIdentity()
      .then((result) => {
        if (!active) return;
        if (!result) {
          window.location.replace("/login");
          return;
        }
        if (result.profile.role !== "admin") {
          setStatus("denied");
          return;
        }
        setIdentity(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Não foi possível verificar suas permissões.");
        setStatus("error");
      });
    return () => { active = false; };
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
      window.location.assign("/login");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível sair da conta.");
    }
  }

  if (status === "loading") return <main className="grid min-h-screen place-items-center bg-[#FFF9F6] text-[#633848]">Verificando acesso…</main>;
  if (status === "denied") return <main className="grid min-h-screen place-items-center bg-[#FFF9F6] px-5 text-center"><div><h1 className="font-serif text-3xl font-bold text-[#990B30]">Acesso restrito</h1><p className="mt-3 text-[#633848]">Esta área está disponível somente para administradores.</p><a href="/" className="mt-5 inline-block font-bold text-[#990B30]">Voltar à biblioteca</a></div></main>;
  if (status === "error") return <main className="grid min-h-screen place-items-center bg-[#FFF9F6] px-5 text-center"><div><h1 className="font-serif text-2xl font-bold text-[#990B30]">Não foi possível abrir o painel</h1><p role="alert" className="mt-3 text-[#633848]">{message}</p><a href="/login" className="mt-5 inline-block font-bold text-[#990B30]">Ir para o login</a></div></main>;

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-[#4A1727]">
      <header className="border-b border-[#F0789D]/30 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <a href="/admin" className="flex items-center gap-3 font-serif text-xl font-bold text-[#990B30]"><span className="flex size-10 items-center justify-center rounded-full bg-[#F8C9D5]"><BookOpen aria-hidden="true" className="size-5" /></span>Entre Páginas <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#633848]">Admin</span></a>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-[#633848] sm:inline">{identity?.profile.full_name || identity?.email}</span><button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-full border border-[#F0789D]/40 px-4 py-2 text-sm font-bold text-[#990B30] transition-colors hover:bg-[#FFF2EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]"><LogOut aria-hidden="true" className="size-4" />Sair</button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-12 lg:py-10">
        <nav aria-label="Navegação administrativa" className="flex gap-2 overflow-x-auto lg:flex-col">
          <a href="/admin" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#633848] hover:bg-[#F8C9D5]/50"><LayoutDashboard aria-hidden="true" className="size-4" />Visão geral</a>
          <a href="/admin/books" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#633848] hover:bg-[#F8C9D5]/50"><BookOpen aria-hidden="true" className="size-4" />Livros</a>
          <a href="/admin/categories" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#633848] hover:bg-[#F8C9D5]/50"><Tags aria-hidden="true" className="size-4" />Categorias</a>
          <a href="/admin/import" className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#633848] hover:bg-[#F8C9D5]/50"><Upload aria-hidden="true" className="size-4" />Importar PDFs</a>
        </nav>
        <main className="min-w-0">{message && <p role="alert" className="mb-5 rounded-xl border border-[#E9437A]/30 bg-[#FFF2EB] p-4 text-sm text-[#7D0928]">{message}</p>}{children}</main>
      </div>
    </div>
  );
}

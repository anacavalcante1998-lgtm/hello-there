import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Tags, CheckCircle2, FilePenLine } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });
type Metrics = { books: number; categories: number; published: number; drafts: number };

function AdminOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const client = getSupabaseClient();
      const [books, categories, published, drafts] = await Promise.all([
        client.from("books").select("id", { count: "exact", head: true }),
        client.from("categories").select("id", { count: "exact", head: true }),
        client.from("books").select("id", { count: "exact", head: true }).eq("status", "published"),
        client.from("books").select("id", { count: "exact", head: true }).eq("status", "draft"),
      ]);
      const failed = [books, categories, published, drafts].find((result) => result.error);
      if (failed?.error) throw new Error(failed.error.message);
      if (active) setMetrics({ books: books.count ?? 0, categories: categories.count ?? 0, published: published.count ?? 0, drafts: drafts.count ?? 0 });
    }
    load().catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Falha ao carregar os indicadores."); });
    return () => { active = false; };
  }, []);

  const cards = [
    { label: "Total de livros", value: metrics?.books, icon: BookOpen },
    { label: "Categorias", value: metrics?.categories, icon: Tags },
    { label: "Publicados", value: metrics?.published, icon: CheckCircle2 },
    { label: "Rascunhos", value: metrics?.drafts, icon: FilePenLine },
  ];

  return <section><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Biblioteca</p><h1 className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Visão geral</h1><p className="mt-2 text-sm text-[#633848]">Acompanhe os conteúdos cadastrados na biblioteca.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-[#FFF2EB] p-4 text-sm text-[#7D0928]">{error}</p>}<div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-[#F0789D]/30 bg-white p-5"><span className="flex size-10 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]"><Icon aria-hidden="true" className="size-5" /></span><p className="mt-4 text-sm font-semibold text-[#633848]">{label}</p><p className="mt-1 font-serif text-3xl font-bold text-[#990B30]">{value ?? "…"}</p></article>)}</div><div className="mt-7 rounded-2xl border border-dashed border-[#E9437A]/45 bg-[#FFF2EB] p-6"><h2 className="font-serif text-xl font-bold text-[#990B30]">Comece a organizar sua biblioteca</h2><p className="mt-2 text-sm leading-6 text-[#633848]">Cadastre categorias e informações dos livros. O envio de arquivos PDF será disponibilizado em uma etapa posterior.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/admin/categories" className="rounded-full bg-[#990B30] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#7D0928]">Gerenciar categorias</a><a href="/admin/books" className="rounded-full border border-[#990B30] px-5 py-2.5 text-sm font-bold text-[#990B30] hover:bg-white">Gerenciar livros</a></div></div></section>;
}

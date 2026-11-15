import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, BookOpen, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Entre Páginas — Biblioteca digital" },
      {
        name: "description",
        content: "Explore a biblioteca digital Entre Páginas.",
      },
    ],
  }),
});

function Index() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
    document.getElementById("colecao")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF9F6] text-[#4A1727]">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
        <a href="#inicio" className="flex items-center gap-3" aria-label="Entre Páginas, início">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          <span className="font-serif text-xl font-bold tracking-tight text-[#990B30] sm:text-2xl">
            Entre Páginas
          </span>
        </a>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 text-sm font-semibold sm:flex">
          <a className="transition-colors hover:text-[#E9437A] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30]" href="#inicio">Início</a>
          <a className="transition-colors hover:text-[#E9437A] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30]" href="#colecao">Biblioteca</a>
          <a className="transition-colors hover:text-[#E9437A] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30]" href="#sobre">Sobre</a>
        </nav>

        <a href="#colecao" className="rounded-full bg-[#990B30] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7D0928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]">
          Explorar biblioteca
        </a>
      </header>

      <section id="inicio" className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F0789D]/40 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#990B30] sm:text-sm">
            <Sparkles aria-hidden="true" className="size-4 text-[#F45116]" />
            Um cantinho feito de histórias
          </p>
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#990B30] sm:text-6xl lg:text-7xl">
            Toda leitura abre uma <span className="italic text-[#E9437A]">nova página.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#633848] sm:text-lg sm:leading-8">
            Uma biblioteca digital para descobrir histórias, encontrar novos temas e guardar espaço para a próxima leitura.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-[#F0789D]/30 bg-white p-2 shadow-[0_12px_36px_rgba(153,11,48,0.08)] sm:flex-row sm:items-center">
            <label htmlFor="book-search" className="sr-only">Pesquisar livros por título, autor ou categoria</label>
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Search aria-hidden="true" className="size-5 shrink-0 text-[#990B30]" />
              <input
                id="book-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Título, autor ou categoria"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#4A1727] outline-none placeholder:text-[#765563] focus-visible:ring-2 focus-visible:ring-[#E9437A]"
              />
            </div>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E9437A] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#C92E62] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]">
              Buscar livros
            </button>
          </form>
          <a href="#colecao" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#990B30] transition-colors hover:text-[#E9437A] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30]">
            Conheça a biblioteca <ArrowDown aria-hidden="true" className="size-4" />
          </a>
        </div>

        <div aria-hidden="true" className="relative mx-auto flex min-h-64 w-full max-w-lg items-center justify-center sm:min-h-80 lg:min-h-[26rem]">
          <div className="absolute inset-x-8 inset-y-5 rotate-[-7deg] rounded-[45%] bg-[#F8C9D5] sm:inset-x-12" />
          <div className="absolute inset-x-12 inset-y-9 rotate-[6deg] rounded-[43%] border-2 border-[#F0789D] sm:inset-x-16" />
          <div className="relative flex h-52 w-40 rotate-[5deg] flex-col items-center justify-between rounded-r-2xl rounded-l-md border-l-[10px] border-[#F45116] bg-[#990B30] px-5 py-6 text-center text-[#FFF9F6] shadow-[12px_16px_0_rgba(153,11,48,0.16)] sm:h-64 sm:w-48 sm:px-6 sm:py-8">
            <span className="font-serif text-xs italic text-[#F8C9D5] sm:text-sm">uma biblioteca</span>
            <span className="font-serif text-3xl font-bold leading-tight sm:text-4xl">de boas histórias</span>
            <span className="h-1 w-12 rounded-full bg-[#F0789D]" />
          </div>
          <span className="absolute right-5 top-5 rotate-12 font-serif text-5xl text-[#F45116] sm:right-9 sm:top-8" aria-hidden="true">✿</span>
          <span className="absolute bottom-2 left-4 -rotate-12 font-serif text-5xl text-[#E9437A] sm:bottom-5 sm:left-8" aria-hidden="true">✿</span>
        </div>
      </section>

      <section id="colecao" aria-labelledby="collection-title" className="relative border-t border-[#F0789D]/25 bg-[#FFF2EB] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B4234D]">Nossa coleção</p>
              <h2 id="collection-title" className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Um mundo de leituras</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#633848]">Livros e categorias cadastrados pela biblioteca aparecerão neste espaço.</p>
          </div>

          <div className="mt-8 rounded-3xl border border-dashed border-[#E9437A]/50 bg-[#FFF9F6] px-5 py-12 text-center sm:px-10 sm:py-16">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]">
              <BookOpen aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-5 font-serif text-2xl font-bold text-[#990B30]">A coleção está começando</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#633848]">
              {submittedSearch
                ? `Ainda não há livros cadastrados para pesquisar por “${submittedSearch}”.`
                : "Assim que os livros forem adicionados, você poderá explorar títulos, autores e categorias por aqui."}
            </p>
            {submittedSearch && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSubmittedSearch("");
                }}
                className="mt-5 rounded-full border border-[#990B30] px-5 py-2.5 text-sm font-bold text-[#990B30] transition-colors hover:bg-[#F8C9D5]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]"
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        </div>
      </section>

      <footer id="sobre" className="border-t border-[#F0789D]/25 bg-[#FFF9F6] px-5 py-8 text-center text-sm text-[#633848] sm:px-8">
        <p><span className="font-serif font-bold text-[#990B30]">Entre Páginas</span> · Um espaço para boas histórias.</p>
      </footer>
    </main>
  );
}

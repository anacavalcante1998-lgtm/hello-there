import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { BookCard } from "../components/book-card";
import { CategoryCard } from "../components/category-card";
import { LibrarySiteHeader } from "../components/library-site-header";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Entre Páginas — Biblioteca digital" },
      {
        name: "description",
        content: "Explore a biblioteca digital Entre Páginas e encontre sua próxima leitura.",
      },
    ],
  }),
});

type LibraryBook = {
  id: string;
  title: string;
  author?: string;
  category?: string;
  description?: string;
  coverUrl?: string;
  href: string;
};

type LibraryCategory = {
  id: string;
  name: string;
  description?: string;
  href: string;
};

function EmptyShelf({
  title,
  message,
  icon = false,
}: {
  title: string;
  message: string;
  icon?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#E9437A]/45 bg-[#FFF9F6] px-5 py-10 text-center sm:px-8 sm:py-12">
      {icon && (
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]">
          <BookOpen aria-hidden="true" className="size-5" />
        </span>
      )}
      <h3 className={`font-serif text-xl font-bold text-[#990B30] ${icon ? "mt-4" : ""}`}>{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#633848]">{message}</p>
    </div>
  );
}

function Index() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  // These collections stay empty until real library records are connected.
  const categories: LibraryCategory[] = [];
  const recentBooks: LibraryBook[] = [];
  const popularBooks: LibraryBook[] = [];
  const featuredBooks: LibraryBook[] = [];

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
    document.getElementById("colecao")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF9F6] text-[#4A1727]">
      <LibrarySiteHeader />

      <section id="inicio" className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:gap-12 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:pb-24 lg:pt-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-6 top-8 hidden h-52 w-5 bg-[repeating-linear-gradient(180deg,#F0789D_0px,#F0789D_10px,#990B30_10px,#990B30_20px)] opacity-70 sm:block" />
        <div className="relative z-10 max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F0789D]/40 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#990B30] sm:text-sm">
            <Sparkles aria-hidden="true" className="size-4 text-[#F45116]" />
            Um cantinho feito de histórias
          </p>
          <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#990B30] sm:text-6xl lg:text-7xl">
            Toda leitura abre uma <span className="italic text-[#B4234D]">nova página.</span>
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
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#4A1727] outline-none placeholder:text-[#765563] focus-visible:ring-2 focus-visible:ring-[#990B30]"
              />
            </div>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#990B30] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#7D0928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]">
              Buscar livros
            </button>
          </form>
          <a href="#categorias" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#990B30] transition-colors hover:text-[#7D0928] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30]">
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
          <span className="absolute right-5 top-5 rotate-12 font-serif text-5xl text-[#F45116] sm:right-9 sm:top-8">✿</span>
          <span className="absolute bottom-2 left-4 -rotate-12 font-serif text-5xl text-[#B4234D] sm:bottom-5 sm:left-8">✿</span>
        </div>
      </section>

      <section id="categorias" aria-labelledby="categories-title" className="border-t border-[#F0789D]/25 bg-[#FFF2EB] px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Encontre seu próximo tema</p>
              <h2 id="categories-title" className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Explore por categoria</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#633848]">Uma estante para cada assunto, organizada para você descobrir novas leituras.</p>
          </div>
          {categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => <CategoryCard key={category.id} name={category.name} description={category.description} href={category.href} />)}
            </div>
          ) : (
            <EmptyShelf title="As categorias estão a caminho" message="As categorias cadastradas pela biblioteca aparecerão aqui para ajudar você a encontrar sua próxima leitura." />
          )}
        </div>
      </section>

      <section id="colecao" aria-labelledby="collection-title" className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Nossa coleção</p>
              <h2 id="collection-title" className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Recém-chegados</h2>
            </div>
            <a href="#destaques" className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#990B30] transition-colors hover:text-[#7D0928] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30] sm:self-auto">
              Ver destaques <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
          <div className="mt-7">
            {recentBooks.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {recentBooks.map((book) => <BookCard key={book.id} title={book.title} author={book.author} category={book.category} description={book.description} coverUrl={book.coverUrl} href={book.href} />)}
              </div>
            ) : (
              <EmptyShelf title={submittedSearch ? "Nenhum livro encontrado" : "A coleção está começando"} message={submittedSearch ? `Ainda não há livros cadastrados para pesquisar por “${submittedSearch}”.` : "Assim que os primeiros livros forem cadastrados, eles aparecerão por aqui para você explorar."} icon />
            )}
            {submittedSearch && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSubmittedSearch(""); }}
                className="mx-auto mt-5 block rounded-full border border-[#990B30] px-5 py-2.5 text-sm font-bold text-[#990B30] transition-colors hover:bg-[#F8C9D5]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]"
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="popular-title" className="border-t border-[#F0789D]/25 bg-[#FFF2EB] px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Queridinhos da comunidade</p>
          <h2 id="popular-title" className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Livros populares</h2>
          <div className="mt-7">
            {popularBooks.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {popularBooks.map((book) => <BookCard key={book.id} title={book.title} author={book.author} category={book.category} description={book.description} coverUrl={book.coverUrl} href={book.href} />)}
              </div>
            ) : (
              <EmptyShelf title="Em breve, os mais lidos" message="Quando houver livros publicados e leituras registradas, os títulos populares vão aparecer aqui." />
            )}
          </div>
        </div>
      </section>

      <section id="destaques" aria-labelledby="featured-title" className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]"><Sparkles aria-hidden="true" className="size-5" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Escolhas especiais</p>
              <h2 id="featured-title" className="mt-1 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Em destaque</h2>
            </div>
          </div>
          <div className="mt-7">
            {featuredBooks.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredBooks.map((book) => <BookCard key={book.id} title={book.title} author={book.author} category={book.category} description={book.description} coverUrl={book.coverUrl} href={book.href} />)}
              </div>
            ) : (
              <EmptyShelf title="Os destaques vêm aí" message="Os livros escolhidos pela biblioteca para ganhar destaque serão apresentados neste espaço." />
            )}
          </div>
        </div>
      </section>

      <footer id="sobre" className="border-t border-[#F0789D]/25 bg-[#FFF2EB] px-5 py-8 text-center text-sm text-[#633848] sm:px-8">
        <p><span className="font-serif font-bold text-[#990B30]">Entre Páginas</span> · Um espaço para boas histórias.</p>
      </footer>
    </main>
  );
}

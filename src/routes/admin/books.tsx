import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { BookForm } from "../../components/admin/book-form";
import { getSupabaseClient } from "../../lib/supabase";
import type { Book, Category } from "../../lib/library-types";

export const Route = createFileRoute("/admin/books")({ component: BooksPage });
type BookRow = Book & { categoryNames: string[] };

function BooksPage() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Book | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const client = getSupabaseClient();
      const [bookResult, categoryResult, relationResult] = await Promise.all([
        client.from("books").select("*").order("created_at", { ascending: false }),
        client.from("categories").select("*").order("sort_order"),
        client.from("book_categories").select("book_id, category_id"),
      ]);
      const failed = [bookResult, categoryResult, relationResult].find((result) => result.error);
      if (failed?.error) throw new Error(failed.error.message);
      const categoryById = new Map((categoryResult.data ?? []).map((category) => [category.id, category.name]));
      const namesByBook = new Map<string, string[]>();
      for (const relation of relationResult.data ?? []) {
        const name = categoryById.get(relation.category_id);
        if (name) namesByBook.set(relation.book_id, [...(namesByBook.get(relation.book_id) ?? []), name]);
      }
      setBooks((bookResult.data ?? []).map((book) => ({ ...book, categoryNames: namesByBook.get(book.id) ?? [] })));
      setCategories(categoryResult.data ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar livros."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filteredBooks = useMemo(() => books.filter((book) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch = !query || [book.title, book.author ?? "", ...book.categoryNames].some((value) => value.toLocaleLowerCase().includes(query));
    const matchesCategory = !categoryFilter || book.categoryNames.includes(categories.find((category) => category.id === categoryFilter)?.name ?? "");
    const matchesStatus = !statusFilter || book.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }), [books, categories, search, categoryFilter, statusFilter]);

  async function deleteBook(book: Book) {
    if (!window.confirm(`Excluir o livro “${book.title}”?`)) return;
    const { error: deleteError } = await getSupabaseClient().from("books").delete().eq("id", book.id);
    if (deleteError) { setError(deleteError.message); return; }
    setBooks((current) => current.filter((item) => item.id !== book.id));
  }

  function closeForm() { setShowForm(false); setEditing(undefined); }
  function saved() { closeForm(); void load(); }

  return <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Acervo</p><h1 className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Livros</h1><p className="mt-2 text-sm text-[#633848]">{books.length} {books.length === 1 ? "livro cadastrado" : "livros cadastrados"}</p></div>{!showForm && <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full bg-[#990B30] px-5 py-3 text-sm font-bold text-white hover:bg-[#7D0928]"><Plus aria-hidden="true" className="size-4" />Cadastrar livro</button>}</div>{error && <p role="alert" className="mt-5 rounded-xl bg-[#FFF2EB] p-3 text-sm text-[#7D0928]">{error}</p>}{showForm ? <div className="mt-6"><BookForm book={editing} onSaved={saved} onCancel={closeForm} /></div> : <><div className="mt-6 grid gap-3 rounded-2xl border border-[#F0789D]/30 bg-white p-4 sm:grid-cols-[minmax(180px,1fr)_200px_160px]"><label className="relative"><span className="sr-only">Pesquisar livros</span><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#990B30]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, autor ou categoria" className="w-full rounded-xl border border-[#F0789D]/40 py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><select aria-label="Filtrar por categoria" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-[#F0789D]/40 bg-white px-3 py-2.5 text-sm"><option value="">Todas as categorias</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Filtrar por status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#F0789D]/40 bg-white px-3 py-2.5 text-sm"><option value="">Todos os status</option><option value="published">Publicado</option><option value="draft">Rascunho</option></select></div><div className="mt-5 overflow-hidden rounded-2xl border border-[#F0789D]/30 bg-white">{loading ? <p className="p-6 text-sm text-[#633848]">Carregando livros…</p> : filteredBooks.length === 0 ? <p className="p-6 text-sm text-[#633848]">Nenhum livro corresponde aos filtros.</p> : <ul className="divide-y divide-[#F0789D]/20">{filteredBooks.map((book) => <li key={book.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"><div className="min-w-0"><h2 className="truncate font-serif text-lg font-bold text-[#990B30]">{book.title}</h2><p className="mt-1 text-sm text-[#633848]">{book.author || "Autor não informado"}{book.categoryNames.length ? ` · ${book.categoryNames.join(", ")}` : " · Sem categoria"}</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-[#FFF2EB] px-3 py-1 text-xs font-semibold text-[#7D0928]">{book.status === "published" ? "Publicado" : "Rascunho"}</span>{book.is_featured && <span className="rounded-full bg-[#F8C9D5] px-3 py-1 text-xs font-semibold text-[#4A1727]">Destaque</span>}</div></div><div className="flex shrink-0 gap-2"><button onClick={() => { setEditing(book); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full border border-[#990B30]/40 px-3 py-2 text-sm font-bold text-[#990B30] hover:bg-[#FFF2EB]"><Pencil aria-hidden="true" className="size-4" /><span className="sr-only sm:not-sr-only">Editar</span></button><button aria-label={`Excluir ${book.title}`} onClick={() => deleteBook(book)} className="rounded-full border border-[#990B30]/40 p-2 text-[#990B30] hover:bg-[#FFF2EB]"><Trash2 aria-hidden="true" className="size-4" /></button></div></li>)}</ul>}</div></>}</section>;
}

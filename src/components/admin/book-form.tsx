import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import type { Book, Category } from "../../lib/library-types";

type BookFormProps = { book?: Book | undefined; onSaved: () => void; onCancel: () => void };
type FormState = { title: string; author: string; description: string; cover_path: string; allow_download: boolean; is_featured: boolean; status: "draft" | "published"; categoryIds: string[] };
const initial: FormState = { title: "", author: "", description: "", cover_path: "", allow_download: false, is_featured: false, status: "draft", categoryIds: [] };

export function BookForm({ book, onSaved, onCancel }: BookFormProps) {
  const [form, setForm] = useState<FormState>(initial);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const client = getSupabaseClient();
      const [categoryResult, relationResult] = await Promise.all([
        client.from("categories").select("*").order("sort_order").order("name"),
        book ? client.from("book_categories").select("category_id").eq("book_id", book.id) : Promise.resolve({ data: [], error: null }),
      ]);
      if (categoryResult.error) throw new Error(categoryResult.error.message);
      if (relationResult.error) throw new Error(relationResult.error.message);
      if (!active) return;
      setCategories(categoryResult.data ?? []);
      setForm(book ? { title: book.title, author: book.author ?? "", description: book.description ?? "", cover_path: book.cover_path ?? "", allow_download: book.allow_download, is_featured: book.is_featured, status: book.status, categoryIds: (relationResult.data ?? []).map((relation) => relation.category_id) } : initial);
    }
    load().catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Falha ao carregar os dados do formulário."); });
    return () => { active = false; };
  }, [book]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const client = getSupabaseClient();
      const payload = { title: form.title.trim(), author: form.author.trim() || null, description: form.description.trim() || null, cover_path: form.cover_path.trim() || null, allow_download: form.allow_download, is_featured: form.is_featured, status: form.status, published_at: form.status === "published" ? book?.published_at ?? new Date().toISOString() : null };
      const saved = book
        ? await client.from("books").update(payload).eq("id", book.id).select("id").single()
        : await client.from("books").insert(payload).select("id").single();
      if (saved.error) throw new Error(saved.error.message);
      const { error: clearError } = await client.from("book_categories").delete().eq("book_id", saved.data.id);
      if (clearError) throw new Error(clearError.message);
      if (form.categoryIds.length) {
        const { error: relationError } = await client.from("book_categories").insert(form.categoryIds.map((category_id) => ({ book_id: saved.data.id, category_id })));
        if (relationError) throw new Error(relationError.message);
      }
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar o livro."); }
    finally { setBusy(false); }
  }

  function toggleCategory(id: string) {
    setForm((current) => ({ ...current, categoryIds: current.categoryIds.includes(id) ? current.categoryIds.filter((item) => item !== id) : [...current.categoryIds, id] }));
  }

  return <form onSubmit={handleSubmit} className="rounded-2xl border border-[#F0789D]/30 bg-white p-5 sm:p-6"><h2 className="font-serif text-xl font-bold text-[#990B30]">{book ? "Editar livro" : "Cadastrar livro"}</h2><p className="mt-1 text-sm text-[#633848]">Cadastre os metadados. O arquivo PDF poderá ser enviado em uma etapa posterior.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-[#FFF2EB] p-3 text-sm text-[#7D0928]">{error}</p>}<label className="mt-5 block text-sm font-semibold">Título<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Autor<input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Descrição<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Caminho da capa (opcional)<input value={form.cover_path} onChange={(event) => setForm({ ...form, cover_path: event.target.value })} placeholder="Caminho no Storage" className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><fieldset className="mt-5"><legend className="text-sm font-semibold">Categorias</legend>{categories.length ? <div className="mt-2 grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.id} className="flex items-center gap-2 rounded-xl bg-[#FFF9F6] px-3 py-2 text-sm"><input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} className="size-4 accent-[#990B30]" />{category.name}</label>)}</div> : <p className="mt-2 text-sm text-[#633848]">Cadastre categorias para associá-las aos livros.</p>}</fieldset><label className="mt-5 block text-sm font-semibold">Publicação<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FormState["status"] })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 bg-white px-3 py-2.5"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><div className="mt-5 space-y-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} className="size-4 accent-[#990B30]" />Marcar como destaque</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allow_download} onChange={(event) => setForm({ ...form, allow_download: event.target.checked })} className="size-4 accent-[#990B30]" />Permitir download quando o PDF estiver disponível</label></div><div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} className="rounded-full bg-[#990B30] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#7D0928] disabled:opacity-60">{busy ? "Salvando…" : "Salvar livro"}</button><button type="button" onClick={onCancel} className="rounded-full border border-[#990B30] px-5 py-2.5 text-sm font-bold text-[#990B30]">Cancelar</button></div></form>;
}

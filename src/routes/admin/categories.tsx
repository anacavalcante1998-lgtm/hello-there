import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";
import type { Category } from "../../lib/library-types";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesPage });
const emptyForm = { name: "", slug: "", description: "", icon_name: "", parent_id: "", sort_order: "0" };

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    const { data, error: queryError } = await getSupabaseClient().from("categories").select("*").order("sort_order").order("name");
    if (queryError) throw new Error(queryError.message);
    setCategories(data ?? []);
  }

  useEffect(() => { loadCategories().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Falha ao carregar categorias.")); }, []);

  function editCategory(category: Category) {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description ?? "", icon_name: category.icon_name ?? "", parent_id: category.parent_id ?? "", sort_order: String(category.sort_order) });
    setMessage(""); setError("");
  }

  function resetForm() { setEditingId(null); setForm(emptyForm); }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const slug = slugify(form.slug || form.name);
    if (!slug) { setError("Informe um nome válido para gerar o endereço da categoria."); setBusy(false); return; }
    const payload = { name: form.name.trim(), slug, description: form.description.trim() || null, icon_name: form.icon_name.trim() || null, parent_id: form.parent_id || null, sort_order: Number(form.sort_order) || 0 };
    try {
      const client = getSupabaseClient();
      const result = editingId ? await client.from("categories").update(payload).eq("id", editingId) : await client.from("categories").insert(payload);
      if (result.error) throw new Error(result.error.message);
      await loadCategories(); resetForm(); setMessage(editingId ? "Categoria atualizada." : "Categoria criada.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar a categoria."); }
    finally { setBusy(false); }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setError(""); setMessage("");
    const { error: deleteError } = await getSupabaseClient().from("categories").delete().eq("id", category.id);
    if (deleteError) { setError(deleteError.message); return; }
    setCategories((current) => current.filter((item) => item.id !== category.id));
    if (editingId === category.id) resetForm();
    setMessage("Categoria excluída.");
  }

  return <section><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Organização</p><h1 className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Categorias</h1><p className="mt-2 text-sm text-[#633848]">Crie categorias e subcategorias para organizar os livros.</p>{message && <p role="status" className="mt-5 rounded-xl bg-[#F8C9D5]/50 p-3 text-sm text-[#4A1727]">{message}</p>}{error && <p role="alert" className="mt-5 rounded-xl bg-[#FFF2EB] p-3 text-sm text-[#7D0928]">{error}</p>}
    <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
      <div className="overflow-hidden rounded-2xl border border-[#F0789D]/30 bg-white"><div className="border-b border-[#F0789D]/20 px-5 py-4"><h2 className="font-serif text-xl font-bold text-[#990B30]">Categorias cadastradas</h2></div>{categories.length === 0 ? <p className="p-6 text-sm text-[#633848]">Nenhuma categoria cadastrada ainda.</p> : <ul className="divide-y divide-[#F0789D]/20">{categories.map((category) => <li key={category.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="font-semibold text-[#4A1727]">{category.name}</p><p className="mt-1 truncate text-xs text-[#633848]">/{category.slug}{category.parent_id ? " · Subcategoria" : ""}</p>{category.description && <p className="mt-1 text-sm text-[#633848]">{category.description}</p>}</div><div className="flex shrink-0 gap-1"><button aria-label={`Editar ${category.name}`} onClick={() => editCategory(category)} className="rounded-full p-2 text-[#990B30] hover:bg-[#FFF2EB]"><Pencil aria-hidden="true" className="size-4" /></button><button aria-label={`Excluir ${category.name}`} onClick={() => deleteCategory(category)} className="rounded-full p-2 text-[#990B30] hover:bg-[#FFF2EB]"><Trash2 aria-hidden="true" className="size-4" /></button></div></li>)}</ul>}</div>
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#F0789D]/30 bg-white p-5 sm:p-6"><h2 className="font-serif text-xl font-bold text-[#990B30]">{editingId ? "Editar categoria" : "Nova categoria"}</h2><label className="mt-5 block text-sm font-semibold">Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, ...(editingId ? {} : { slug: slugify(event.target.value) }) })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Descrição<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Categoria principal<select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 bg-white px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]"><option value="">Nenhuma (categoria principal)</option>{categories.filter((category) => category.id !== editingId && !category.parent_id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="mt-4 block text-sm font-semibold">Ícone (identificador opcional)<input value={form.icon_name} onChange={(event) => setForm({ ...form, icon_name: event.target.value })} placeholder="Ex.: book-open" className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><label className="mt-4 block text-sm font-semibold">Ordem de exibição<input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]" /></label><div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#990B30] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#7D0928] disabled:opacity-60"><Plus aria-hidden="true" className="size-4" />{busy ? "Salvando…" : editingId ? "Salvar alterações" : "Criar categoria"}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-full border border-[#990B30] px-5 py-2.5 text-sm font-bold text-[#990B30]">Cancelar</button>}</div></form>
    </div></section>;
}

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileUp, LoaderCircle, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase";
import type { Category } from "../../lib/library-types";

export const Route = createFileRoute("/admin/import")({ component: BulkImportPage });

type UploadStatus = "queued" | "uploading" | "success" | "error" | "cancelled";
type UploadItem = {
  id: string;
  file: File;
  title: string;
  author: string;
  description: string;
  categoryIds: string[];
  status: UploadStatus;
  progress: number;
  error?: string;
};

type CsvMetadata = { filename: string; title?: string; author?: string; category?: string; description?: string };

function parseCsv(text: string): CsvMetadata[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (rows.length < 2) return [];

  const normalize = (value: string) => value.trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ _-]+/g, "");
  const header = rows[0].map(normalize);
  const column = (...names: string[]) => header.findIndex((name) => names.includes(name));
  const filenameIndex = column("arquivo", "nomearquivo", "filename", "pdf", "nomepdf");
  if (filenameIndex < 0) throw new Error("A planilha precisa ter uma coluna de arquivo, filename ou nome do PDF.");
  const titleIndex = column("titulo", "title");
  const authorIndex = column("autor", "author");
  const categoryIndex = column("categoria", "category");
  const descriptionIndex = column("descricao", "description");
  const value = (cells: string[], index: number) => index < 0 ? "" : (cells[index] ?? "").trim();
  return rows.slice(1).filter((cells) => value(cells, filenameIndex)).map((cells) => ({
    filename: value(cells, filenameIndex).split(/[\\/]/).pop() ?? "",
    title: value(cells, titleIndex),
    author: value(cells, authorIndex),
    category: value(cells, categoryIndex),
    description: value(cells, descriptionIndex),
  }));
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "livro.pdf";
}

function BulkImportPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<XMLHttpRequest | null>(null);
  const cancelledRef = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useState(() => {
    let active = true;
    getSupabaseClient().from("categories").select("*").order("sort_order").order("name")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setCategories(data ?? []);
      });
    return () => { active = false; };
  });

  function addFiles(fileList: FileList | File[]) {
    const chosen = Array.from(fileList);
    const invalid = chosen.filter((file) => file.type !== "application/pdf" && !file.name.toLocaleLowerCase().endsWith(".pdf"));
    if (invalid.length) setError(`${invalid.length} arquivo(s) ignorado(s): somente PDFs são aceitos.`);
    const accepted = chosen.filter((file) => file.type === "application/pdf" || file.name.toLocaleLowerCase().endsWith(".pdf"));
    if (!accepted.length) return;
    setError(""); setMessage("");
    setItems((current) => {
      const existing = new Set(current.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
      const additions = accepted.filter((file) => !existing.has(`${file.name}:${file.size}:${file.lastModified}`)).map((file) => ({
        id: makeId(), file, title: file.name.replace(/\.pdf$/i, ""), author: "", description: "",
        categoryIds: defaultCategory ? [defaultCategory] : [], status: "queued" as const, progress: 0,
      }));
      return [...current, ...additions];
    });
  }

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function applyCsv(event: ChangeEvent<HTMLInputElement>) {
    const csvFile = event.target.files?.[0];
    event.target.value = "";
    if (!csvFile) return;
    void csvFile.text().then((text) => {
      const metadata = parseCsv(text);
      if (!metadata.length) { setError("A planilha não contém linhas de metadados válidas."); return; }
      let matched = 0;
      setItems((current) => current.map((item) => {
        const record = metadata.find((entry) => entry.filename.toLocaleLowerCase() === item.file.name.toLocaleLowerCase());
        if (!record) return item;
        matched += 1;
        const category = categories.find((candidate) => candidate.name.toLocaleLowerCase() === record.category?.toLocaleLowerCase() || candidate.slug.toLocaleLowerCase() === record.category?.toLocaleLowerCase());
        return { ...item, title: record.title || item.title, author: record.author || item.author, description: record.description || item.description, categoryIds: category ? [category.id] : item.categoryIds };
      }));
      setError("");
      setMessage(`${matched} de ${metadata.length} linha(s) associada(s) aos PDFs selecionados.${matched < metadata.length ? " Confira se os nomes dos arquivos coincidem." : ""}`);
    }).catch(() => setError("Não foi possível ler o arquivo CSV."));
  }

  function uploadWithProgress(path: string, file: File, accessToken: string, onProgress: (progress: number) => void) {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!url) return Promise.reject(new Error("Configure VITE_SUPABASE_URL para enviar arquivos."));
    return new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      cancelRef.current = request;
      request.open("POST", `${url.replace(/\/$/, "")}/storage/v1/object/library-pdfs/${path.split("/").map(encodeURIComponent).join("/")}`);
      request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      request.setRequestHeader("Content-Type", "application/pdf");
      request.setRequestHeader("x-upsert", "false");
      request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
      request.onerror = () => reject(new Error("Falha de rede durante o envio."));
      request.onabort = () => reject(new Error("Envio cancelado."));
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) { onProgress(100); resolve(); }
        else {
          let detail = "";
          try { detail = JSON.parse(request.responseText).message ?? ""; } catch { /* resposta não JSON */ }
          reject(new Error(detail || `O Storage respondeu com status ${request.status}.`));
        }
      };
      request.send(file);
    });
  }

  async function processItem(item: UploadItem) {
    updateItem(item.id, { status: "uploading", progress: 0, error: undefined });
    const client = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) throw new Error("Entre novamente para continuar o envio.");
    const path = `${sessionData.session.user.id}/${makeId()}-${safeFileName(item.file.name)}`;
    await uploadWithProgress(path, item.file, sessionData.session.access_token, (progress) => updateItem(item.id, { progress }));
    const bookResult = await client.from("books").insert({
      title: item.title.trim() || item.file.name.replace(/\.pdf$/i, ""),
      author: item.author.trim() || null,
      description: item.description.trim() || null,
      status: "draft",
      allow_download: false,
      is_featured: false,
    }).select("id").single();
    if (bookResult.error) {
      await client.storage.from("library-pdfs").remove([path]);
      throw new Error(`PDF enviado, mas não foi possível salvar os metadados: ${bookResult.error.message}`);
    }
    const fileResult = await client.from("book_files").insert({
      book_id: bookResult.data.id, bucket_id: "library-pdfs", object_path: path,
      original_filename: item.file.name, mime_type: "application/pdf", size_bytes: item.file.size, is_current: true,
    });
    if (fileResult.error) {
      await client.from("books").delete().eq("id", bookResult.data.id);
      await client.storage.from("library-pdfs").remove([path]);
      throw new Error(`Não foi possível registrar o PDF: ${fileResult.error.message}`);
    }
    if (item.categoryIds.length) {
      const relationResult = await client.from("book_categories").insert(item.categoryIds.map((category_id) => ({ book_id: bookResult.data.id, category_id })));
      if (relationResult.error) {
        await client.from("books").delete().eq("id", bookResult.data.id);
        await client.storage.from("library-pdfs").remove([path]);
        throw new Error(`Livro salvo, mas não foi possível associar a categoria: ${relationResult.error.message}`);
      }
    }
    updateItem(item.id, { status: "success", progress: 100 });
  }

  async function startUploads() {
    if (busy) return;
    setBusy(true); cancelledRef.current = false; setError(""); setMessage("");
    for (const initial of itemsRef.current) {
      if (cancelledRef.current) break;
      const item = itemsRef.current.find((entry) => entry.id === initial.id);
      if (!item || (item.status !== "queued" && item.status !== "error" && item.status !== "cancelled")) continue;
      try { await processItem(item); }
      catch (cause) {
        const messageText = cause instanceof Error ? cause.message : "Falha ao enviar o arquivo.";
        updateItem(item.id, { status: cancelledRef.current ? "cancelled" : "error", error: messageText });
        if (!cancelledRef.current) setError(`${item.file.name}: ${messageText}`);
      }
    }
    setBusy(false);
    const finished = itemsRef.current.filter((item) => item.status === "success").length;
    if (!cancelledRef.current) setMessage(`${finished} arquivo(s) enviado(s) com sucesso. Os novos livros foram salvos como rascunhos.`);
  }

  function cancelUploads() {
    cancelledRef.current = true;
    cancelRef.current?.abort();
    setBusy(false);
  }

  function toggleCategory(item: UploadItem, categoryId: string) {
    updateItem(item.id, { categoryIds: item.categoryIds.includes(categoryId) ? item.categoryIds.filter((id) => id !== categoryId) : [...item.categoryIds, categoryId] });
  }

  const pendingCount = items.filter((item) => item.status === "queued" || item.status === "error" || item.status === "cancelled").length;
  const successCount = items.filter((item) => item.status === "success").length;
  const overallProgress = items.length ? Math.round(items.reduce((total, item) => total + (item.status === "success" ? 100 : item.progress), 0) / items.length) : 0;

  return <section>
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#990B30]">Acervo</p>
    <h1 className="mt-2 font-serif text-3xl font-bold text-[#990B30] sm:text-4xl">Importação em massa</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#633848]">Envie vários PDFs, organize os metadados e salve os livros como rascunhos para revisão antes da publicação.</p>
    {message && <p role="status" className="mt-5 rounded-xl bg-[#F8C9D5]/50 p-3 text-sm text-[#4A1727]">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-[#FFF2EB] p-3 text-sm text-[#7D0928]">{error}</p>}

    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
      <div className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-[#990B30] bg-[#F8C9D5]/40" : "border-[#F0789D]/50 bg-white"}`}
        onDragOver={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]"><FileUp aria-hidden="true" className="size-6" /></span>
        <h2 className="mt-4 font-serif text-xl font-bold text-[#990B30]">Solte seus PDFs aqui</h2>
        <p className="mt-2 text-sm text-[#633848]">ou selecione vários arquivos do seu dispositivo.</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-full bg-[#990B30] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7D0928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]">Selecionar PDFs</button>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
      </div>

      <div className="rounded-2xl border border-[#F0789D]/30 bg-white p-5">
        <h2 className="font-serif text-lg font-bold text-[#990B30]">Importar metadados CSV</h2>
        <p className="mt-2 text-sm leading-6 text-[#633848]">Use colunas como arquivo, título, autor, categoria e descrição. Os nomes dos PDFs devem coincidir.</p>
        <button type="button" onClick={() => csvRef.current?.click()} className="mt-4 rounded-full border border-[#990B30] px-4 py-2 text-sm font-bold text-[#990B30] transition-colors hover:bg-[#FFF2EB]">Selecionar CSV</button>
        <input ref={csvRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={applyCsv} />
        <label className="mt-5 block text-sm font-semibold text-[#4A1727]">Categoria padrão para novos arquivos
          <select value={defaultCategory} onChange={(event) => { setDefaultCategory(event.target.value); if (event.target.value) setItems((current) => current.map((item) => item.status === "queued" ? { ...item, categoryIds: [event.target.value] } : item)); }} className="mt-2 w-full rounded-xl border border-[#F0789D]/40 bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#990B30]">
            <option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <p className="mt-3 text-xs leading-5 text-[#633848]">A categoria padrão também pode ser alterada individualmente na fila. Os uploads são processados um por vez para reduzir a carga do navegador.</p>
      </div>
    </div>

    {items.length > 0 && <div className="mt-7 rounded-2xl border border-[#F0789D]/30 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0789D]/20 p-5">
        <div><h2 className="font-serif text-xl font-bold text-[#990B30]">Fila de arquivos</h2><p className="mt-1 text-sm text-[#633848]">{items.length} selecionados · {successCount} concluídos · {pendingCount} pendentes</p></div>
        <div className="flex flex-wrap gap-2">
          {busy ? <button type="button" onClick={cancelUploads} className="inline-flex items-center gap-2 rounded-full border border-[#990B30] px-4 py-2 text-sm font-bold text-[#990B30] hover:bg-[#FFF2EB]"><X aria-hidden="true" className="size-4" />Cancelar envios</button> : <button type="button" disabled={!pendingCount} onClick={() => void startUploads()} className="inline-flex items-center gap-2 rounded-full bg-[#990B30] px-4 py-2 text-sm font-bold text-white hover:bg-[#7D0928] disabled:cursor-not-allowed disabled:opacity-50"><Upload aria-hidden="true" className="size-4" />Enviar {pendingCount} PDF(s)</button>}
          <button type="button" disabled={busy} onClick={() => setItems((current) => current.filter((item) => item.status !== "success"))} className="rounded-full border border-[#F0789D]/50 px-4 py-2 text-sm font-semibold text-[#633848] hover:bg-[#FFF2EB] disabled:opacity-50">Limpar concluídos</button>
        </div>
      </div>
      <div className="px-5 pt-4"><div className="flex justify-between text-xs font-semibold text-[#633848]"><span>Progresso geral</span><span>{overallProgress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#FFF2EB]"><div className="h-full rounded-full bg-[#990B30] transition-all" style={{ width: `${overallProgress}%` }} /></div></div>
      <ul className="divide-y divide-[#F0789D]/20">
        {items.map((item) => <li key={item.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3"><span className="mt-1 text-[#990B30]">{item.status === "uploading" ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : <FileUp aria-hidden="true" className="size-5" />}</span><div className="min-w-0"><p className="break-all text-sm font-bold text-[#4A1727]">{item.file.name}</p><p className="mt-1 text-xs text-[#633848]">{(item.file.size / (1024 * 1024)).toFixed(2)} MB · {item.status === "success" ? "Enviado" : item.status === "uploading" ? `Enviando ${item.progress}%` : item.status === "error" ? "Falha" : item.status === "cancelled" ? "Cancelado" : "Na fila"}</p>{item.error && <p role="alert" className="mt-1 text-xs text-[#7D0928]">{item.error}</p>}</div></div>
            <div className="flex gap-2">{(item.status === "error" || item.status === "cancelled") && <button type="button" aria-label={`Tentar novamente ${item.file.name}`} disabled={busy} onClick={() => updateItem(item.id, { status: "queued", progress: 0, error: undefined })} className="rounded-full p-2 text-[#990B30] hover:bg-[#FFF2EB] disabled:opacity-40"><RotateCcw aria-hidden="true" className="size-4" /></button>}<button type="button" aria-label={`Remover ${item.file.name}`} disabled={busy || item.status === "uploading"} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="rounded-full p-2 text-[#990B30] hover:bg-[#FFF2EB] disabled:opacity-40"><Trash2 aria-hidden="true" className="size-4" /></button></div>
          </div>
          {item.status === "uploading" && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#FFF2EB]"><div className="h-full rounded-full bg-[#E9437A] transition-all" style={{ width: `${item.progress}%` }} /></div>}
          {item.status !== "success" && <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[#633848]">Título<input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} disabled={busy} className="mt-1 w-full rounded-lg border border-[#F0789D]/40 px-3 py-2 text-sm text-[#4A1727] outline-none focus-visible:ring-2 focus-visible:ring-[#990B30] disabled:bg-[#FFF9F6]" /></label>
            <label className="text-xs font-semibold text-[#633848]">Autor<input value={item.author} onChange={(event) => updateItem(item.id, { author: event.target.value })} disabled={busy} className="mt-1 w-full rounded-lg border border-[#F0789D]/40 px-3 py-2 text-sm text-[#4A1727] outline-none focus-visible:ring-2 focus-visible:ring-[#990B30] disabled:bg-[#FFF9F6]" /></label>
            <label className="text-xs font-semibold text-[#633848] sm:col-span-2">Descrição<textarea rows={2} value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} disabled={busy} className="mt-1 w-full rounded-lg border border-[#F0789D]/40 px-3 py-2 text-sm text-[#4A1727] outline-none focus-visible:ring-2 focus-visible:ring-[#990B30] disabled:bg-[#FFF9F6]" /></label>
            <fieldset className="sm:col-span-2"><legend className="text-xs font-semibold text-[#633848]">Categorias</legend><div className="mt-2 flex flex-wrap gap-2">{categories.length ? categories.map((category) => <label key={category.id} className="inline-flex items-center gap-2 rounded-full bg-[#FFF2EB] px-3 py-2 text-xs font-medium text-[#4A1727]"><input type="checkbox" checked={item.categoryIds.includes(category.id)} onChange={() => toggleCategory(item, category.id)} disabled={busy} className="size-4 accent-[#990B30]" />{category.name}</label>) : <span className="text-xs text-[#633848]">Nenhuma categoria cadastrada.</span>}</div></fieldset>
          </div>}
        </li>)}
      </ul>
    </div>}
  </section>;
}

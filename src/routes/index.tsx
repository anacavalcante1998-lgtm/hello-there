import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minha Biblioteca — Leia. Inspire-se. Sonhe." },
      { name: "description", content: "Sua biblioteca digital de livros por categoria, com leitor de PDF e área administrativa." },
      { property: "og:title", content: "Minha Biblioteca" },
      { property: "og:description", content: "Leia. Inspire-se. Sonhe. Sua biblioteca digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/biblioteca.html"
      title="Minha Biblioteca"
      className="fixed inset-0 h-screen w-screen border-0"
    />
  );
}

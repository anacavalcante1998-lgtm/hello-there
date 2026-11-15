import { useState } from "react";
import { BookOpen, Menu, X } from "lucide-react";

type LibrarySiteHeaderProps = {
  activeSection?: "inicio" | "categorias" | "colecao" | "sobre";
};

const navigation = [
  { label: "Início", href: "#inicio", id: "inicio" },
  { label: "Categorias", href: "#categorias", id: "categorias" },
  { label: "Biblioteca", href: "#colecao", id: "colecao" },
  { label: "Sobre", href: "#sobre", id: "sobre" },
] as const;

export function LibrarySiteHeader({ activeSection = "inicio" }: LibrarySiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
      <a href="#inicio" className="flex shrink-0 items-center gap-3" aria-label="Entre Páginas, início">
        <span className="flex size-11 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30]">
          <BookOpen aria-hidden="true" className="size-5" />
        </span>
        <span className="font-serif text-xl font-bold tracking-tight text-[#990B30] sm:text-2xl">
          Entre Páginas
        </span>
      </a>

      <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-semibold md:flex lg:gap-8">
        {navigation.map((item) => (
          <a
            key={item.id}
            className={`rounded-sm transition-colors hover:text-[#B4234D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#990B30] ${activeSection === item.id ? "text-[#990B30]" : "text-[#633848]"}`}
            href={item.href}
            aria-current={activeSection === item.id ? "location" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <a
          href="#colecao"
          className="hidden rounded-full bg-[#990B30] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7D0928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30] sm:inline-flex"
        >
          Explorar biblioteca
        </a>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-[#F0789D]/50 bg-white text-[#990B30] transition-colors hover:bg-[#FFF2EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30] md:hidden"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-library-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-library-navigation"
          aria-label="Navegação principal"
          className="absolute inset-x-5 top-[calc(100%-0.25rem)] flex flex-col gap-1 rounded-2xl border border-[#F0789D]/35 bg-[#FFF9F6] p-3 shadow-[0_12px_36px_rgba(153,11,48,0.12)] sm:inset-x-8 md:hidden"
        >
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-[#F8C9D5]/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#990B30] ${activeSection === item.id ? "text-[#990B30]" : "text-[#633848]"}`}
              aria-current={activeSection === item.id ? "location" : undefined}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#colecao"
            onClick={() => setMenuOpen(false)}
            className="mt-1 rounded-xl bg-[#990B30] px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#7D0928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30]"
          >
            Explorar biblioteca
          </a>
        </nav>
      )}
    </header>
  );
}

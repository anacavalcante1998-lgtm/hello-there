import { ArrowUpRight, BookOpen } from "lucide-react";

type BookCardProps = {
  title: string;
  author?: string;
  category?: string;
  description?: string;
  coverUrl?: string;
  href: string;
};

export function BookCard({ title, author, category, description, coverUrl, href }: BookCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-[#F0789D]/30 bg-white shadow-[0_8px_24px_rgba(153,11,48,0.05)] transition-transform hover:-translate-y-1">
      <a href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#990B30]" aria-label={`Ver detalhes de ${title}`}>
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#FFF2EB]">
          {coverUrl ? (
            <img src={coverUrl} alt={`Capa de ${title}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="relative flex size-full items-center justify-center bg-[#F8C9D5]">
              <span aria-hidden="true" className="absolute inset-y-0 left-1/4 w-4 bg-[#990B30]/10" />
              <span aria-hidden="true" className="absolute inset-y-0 left-[38%] w-4 bg-[#F45116]/15" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-[#FFF9F6] text-[#990B30]">
                <BookOpen aria-hidden="true" className="size-7" />
              </span>
            </div>
          )}
          {category && <span className="absolute left-3 top-3 rounded-full bg-[#FFF9F6]/95 px-3 py-1 text-xs font-bold text-[#990B30]">{category}</span>}
        </div>
        <div className="p-5">
          <h3 className="font-serif text-xl font-bold leading-tight text-[#990B30]">{title}</h3>
          {author && <p className="mt-1 text-sm text-[#633848]">{author}</p>}
          {description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#633848]">{description}</p>}
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#990B30]">
            Acessar livro <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </a>
    </article>
  );
}

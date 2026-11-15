import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen } from "lucide-react";

type CategoryCardProps = {
  name: string;
  description?: string;
  href: string;
  icon?: ReactNode;
};

export function CategoryCard({ name, description, href, icon }: CategoryCardProps) {
  return (
    <a
      href={href}
      className="group flex min-h-40 flex-col justify-between rounded-3xl border border-[#F0789D]/35 bg-white p-5 transition-transform hover:-translate-y-1 hover:border-[#B4234D]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#990B30] sm:p-6"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-[#F8C9D5] text-[#990B30] transition-colors group-hover:bg-[#F0789D]/35">
        {icon ?? <BookOpen aria-hidden="true" className="size-5" />}
      </span>
      <span className="mt-5 flex items-end justify-between gap-3">
        <span>
          <span className="block font-serif text-xl font-bold text-[#990B30]">{name}</span>
          {description && <span className="mt-1 block text-sm leading-5 text-[#633848]">{description}</span>}
        </span>
        <ArrowUpRight aria-hidden="true" className="mb-1 size-5 shrink-0 text-[#B4234D] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </a>
  );
}

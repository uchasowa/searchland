import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { BRAND_NAME, PRODUCT_LINE } from '../lib/brand';

export function BrandBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/85 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-lg outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-[1.02]">
            <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[0.9375rem] font-semibold tracking-tight text-slate-900">
              {BRAND_NAME}
            </span>
            <span className="text-xs font-medium text-slate-500">{PRODUCT_LINE}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}

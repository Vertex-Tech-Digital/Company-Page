import { siteConfig } from "@/lib/site-config";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <a
          href="#inicio"
          className="text-lg font-bold"
          style={{ color: "var(--brand)" }}
        >
          {siteConfig.brandName}
        </a>
        <nav className="hidden gap-6 sm:flex">
          {siteConfig.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-slate-600 transition-colors hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

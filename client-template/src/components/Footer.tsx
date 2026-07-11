import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <span>
          © {new Date().getFullYear()} {siteConfig.brandName}
        </span>
        <span>
          Desarrollado por{" "}
          <a
            href="https://vertextechdigital.com"
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            Vertex Tech Digital
          </a>
        </span>
      </div>
    </footer>
  );
}

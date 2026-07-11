import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section id="inicio" className="mx-auto max-w-5xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        {siteConfig.tagline}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
        {siteConfig.description}
      </p>
      <div className="mt-10">
        <a
          href="#contacto"
          className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand)" }}
        >
          Contáctanos
        </a>
      </div>
    </section>
  );
}

import { siteConfig } from "@/lib/site-config";

export function Features() {
  return (
    <section id="servicios" className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Servicios</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div
                className="mb-4 h-10 w-10 rounded-lg"
                style={{ backgroundColor: "var(--brand)", opacity: 0.15 }}
              />
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

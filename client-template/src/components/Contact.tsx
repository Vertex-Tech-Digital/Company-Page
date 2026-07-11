import { siteConfig } from "@/lib/site-config";

export function Contact() {
  return (
    <section id="contacto" className="mx-auto max-w-5xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold">Contacto</h2>
      <p className="mt-4 text-slate-600">
        ¿Hablamos? Escríbenos y te respondemos lo antes posible.
      </p>
      <a
        href={`mailto:${siteConfig.contact.email}`}
        className="mt-6 inline-block text-lg font-semibold"
        style={{ color: "var(--brand)" }}
      >
        {siteConfig.contact.email}
      </a>
      {siteConfig.contact.phone && (
        <p className="mt-2 text-slate-600">{siteConfig.contact.phone}</p>
      )}
    </section>
  );
}

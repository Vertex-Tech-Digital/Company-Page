/**
 * Plugin de Vite SOLO para `vite build`.
 *
 * Mete el CSS de entrada (src/index.css) dentro de index.html como <style>
 * en vez de enlazarlo con <link rel="stylesheet">, para que el primer pintado
 * no espere a una segunda petición bloqueante (VTD-38). La CSP de vercel.json
 * ya permite estilos inline (style-src 'unsafe-inline').
 *
 * Además de reescribir el HTML, borra el .css del bundle y lo quita de
 * viteMetadata.importedCss del chunk de entrada. Sin esto último, Vite lo
 * seguiría listando como dependencia de precarga de las rutas lazy: al
 * navegar a ellas inyectaría un <link> a un archivo que ya no existe, la
 * precarga fallaría y la ruta no cargaría.
 *
 * Depende del orden de plugins de Vite: con enforce "post", generateBundle
 * corre después de vite:build-html (que ya generó index.html) y antes de
 * vite:build-import-analysis (que escribe las listas de precarga).
 *
 * Si no encuentra el <link> esperado, avisa y deja el CSS como archivo
 * aparte: el build sigue siendo válido, solo que sin la optimización.
 */
export function inlineCssPlugin() {
  return {
    name: "inline-entry-css",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const files = Object.values(bundle);
      const chunks = files.filter((file) => file.type === "chunk");
      const htmlFiles = files.filter(
        (file) => file.type === "asset" && file.fileName.endsWith(".html"),
      );

      const entryCss = new Set(
        chunks
          .filter((chunk) => chunk.isEntry)
          .flatMap((chunk) => [...(chunk.viteMetadata?.importedCss ?? [])]),
      );

      for (const cssFile of entryCss) {
        const asset = bundle[cssFile];
        if (!asset || asset.type !== "asset") continue;

        const css =
          typeof asset.source === "string"
            ? asset.source
            : new TextDecoder().decode(asset.source);

        // Un "</style" dentro del CSS cerraría la etiqueta antes de tiempo.
        if (/<\/style/i.test(css)) {
          this.warn(`${cssFile} contiene "</style": se deja sin inlinear.`);
          continue;
        }

        let inlined = false;
        for (const html of htmlFiles) {
          // Replacer con función: el CSS puede llevar "$" y un string de
          // reemplazo lo interpretaría como patrón ($&, $1...). Los atributos
          // se buscan con comillas dobles, que es como los escribe Vite.
          html.source = String(html.source).replace(
            /<link\b[^>]*>/gi,
            (tag) => {
              const isStylesheet = /\brel="stylesheet"/i.test(tag);
              const href = /\bhref="([^"]*)"/i.exec(tag)?.[1];
              if (!isStylesheet || !href?.endsWith(cssFile)) return tag;
              inlined = true;
              return `<style>${css}</style>`;
            },
          );
        }

        if (!inlined) {
          this.warn(`No se encontró el <link> de ${cssFile} en el HTML.`);
          continue;
        }

        delete bundle[cssFile];
        for (const chunk of chunks) {
          chunk.viteMetadata?.importedCss.delete(cssFile);
        }
      }
    },
  };
}

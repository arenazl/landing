// La landing es UNA sola y se sirve en varios hostnames. En el de QA
// (qa.munify.com.ar) los botones "Probar demo" no pueden mandar a la app de
// PRODUCCION: tienen que llevar a la app de QA.
//
// Los 59 links repartidos en 7 paginas apuntan a app.munify.com.ar. En vez de
// editarlos uno por uno (y tener que acordarse en cada pagina nueva), se
// reescriben al vuelo con HTMLRewriter, que es streaming y no cuesta nada.
//
// Cualquier otro hostname (munify.com.ar, www) pasa sin tocar.

const POR_HOSTNAME = {
  "qa.munify.com.ar": "qa-app.munify.com.ar",
};

export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const destino = POR_HOSTNAME[url.hostname];
  const res = await ctx.next();

  if (!destino) return res;
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;

  const reescribir = (v) =>
    v && v.includes("//app.munify.com.ar")
      ? v.replace(/\/\/app\.munify\.com\.ar/g, "//" + destino)
      : null;

  return new HTMLRewriter()
    .on("a[href]", {
      element(el) {
        const nuevo = reescribir(el.getAttribute("href"));
        if (nuevo) el.setAttribute("href", nuevo);
      },
    })
    .on("form[action]", {
      element(el) {
        const nuevo = reescribir(el.getAttribute("action"));
        if (nuevo) el.setAttribute("action", nuevo);
      },
    })
    .transform(res);
}

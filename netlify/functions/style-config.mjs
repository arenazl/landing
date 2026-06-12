import { getStore } from "@netlify/blobs";

// Guarda/lee la config de estilo de las fotos elegida desde el panel del sitio.
// GET  /api/style-config        -> devuelve la config guardada (o null)
// POST /api/style-config        -> guarda la config (requiere header x-style-key correcto)
export default async (req) => {
  const store = getStore({ name: "munify-style", consistency: "strong" });
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-style-key",
  };

  if (req.method === "OPTIONS") return new Response("", { headers: cors });

  if (req.method === "POST") {
    const key = req.headers.get("x-style-key") || "";
    const expected = process.env.STYLE_KEY || "";
    if (!expected || key !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...cors, "content-type": "application/json" },
      });
    }
    let body;
    try { body = await req.json(); } catch (e) {
      return new Response(JSON.stringify({ error: "bad json" }), {
        status: 400, headers: { ...cors, "content-type": "application/json" },
      });
    }
    await store.setJSON("config", body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  // GET
  const cfg = await store.get("config", { type: "json" });
  return new Response(JSON.stringify(cfg || null), {
    headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
  });
};

export const config = { path: "/api/style-config" };

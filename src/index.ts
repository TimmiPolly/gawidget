export interface Env {
  MY_KV: KVNamespace;
  // Добавляй сюда другие bindings при необходимости
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);
      const key = url.pathname.slice(1) || "default";

      if (request.method === "GET") {
        const value = await env.MY_KV.get(key);
        return value 
          ? new Response(value) 
          : new Response("Not found", { status: 404 });
      }

      if (["POST", "PUT"].includes(request.method)) {
        const value = await request.text();
        await env.MY_KV.put(key, value, { expirationTtl: 3600 });
        return new Response(`Saved: ${key}`);
      }

      if (request.method === "DELETE") {
        await env.MY_KV.delete(key);
        return new Response(`Deleted: ${key}`);
      }

      return new Response("Method not allowed", { status: 405 });

    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

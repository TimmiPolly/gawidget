import { helloHandler } from './handlers/hello';

export const router = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    // === Маршруты ===
    if (path === "/hello") {
      return helloHandler(request, env, ctx);
    }

    if (path === "/" || path === "") {
      return new Response("Worker is running ✅", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 404 для всех остальных путей
    return new Response("Not found", { 
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  },
};

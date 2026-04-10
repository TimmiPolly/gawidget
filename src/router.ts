import { helloHandler } from './handlers/hello';
import { googleAuthenticatorHandler } from './handlers/google-auth';

export const router = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();

    if (path === "/hello") {
      return helloHandler(request, env, ctx);
    }

    if (path === "/googleauthenticator" || path === "/google-authenticator") {
      return googleAuthenticatorHandler(request, env, ctx);
    }

    if (path === "/" || path === "") {
      return new Response("Worker is running ✅", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new Response("Not found", { 
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  },
};

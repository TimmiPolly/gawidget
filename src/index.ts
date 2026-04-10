import { router } from './router';

export interface Env {
  MY_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

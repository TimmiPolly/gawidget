export async function helloHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  return new Response("Hello from separate handler! 👋", {
    headers: { 
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*"   // если будешь делать запросы с фронта
    },
  });
}

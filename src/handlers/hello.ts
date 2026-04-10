import helloTemplate from '../templates/hello.html?raw';   // ← важно !?raw

export async function helloHandler(): Promise<Response> {
  return new Response(helloTemplate, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

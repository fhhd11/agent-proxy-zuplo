import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface AuthHeadersOptions {
  lettaApiKey: string;
  agentManagementKey: string;
}

export default async function addAuthHeaders(
  request: ZuploRequest,
  context: ZuploContext,
  options: AuthHeadersOptions,
  policyName: string,
): Promise<ZuploRequest | Response> {
  try {
    const newHeaders = new Headers(request.headers);
    const pathname = new URL(request.url).pathname;

    // Определяем к какому сервису идет запрос и добавляем соответствующий ключ
    if (pathname.startsWith("/api/v1/letta/")) {
      // Запрос к Letta Server
      if (options.lettaApiKey) {
        newHeaders.set("Authorization", `Bearer ${options.lettaApiKey}`);
        context.log.info("Added Letta API key to request");
      }
    } else if (pathname.startsWith("/api/v1/agents/")) {
      // Запросы к Agent Management Service (кроме уже существующего прокси)
      if (pathname.includes("/create") || pathname.includes("/manage")) {
        if (options.agentManagementKey) {
          newHeaders.set("Authorization", `Bearer ${options.agentManagementKey}`);
          context.log.info("Added Agent Management API key to request");
        }
      }
    }

    // Добавляем метаданные для трассировки
    newHeaders.set("X-Forwarded-By", "zuplo-proxy");
    newHeaders.set("X-User-ID", request.user?.sub || "anonymous");
    
    if (request.user?.data) {
      const userData = JSON.stringify(request.user.data);
      newHeaders.set("X-User-Data", userData);
    }

    const newRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });

    return newRequest as ZuploRequest;

  } catch (error) {
    context.log.error("Error adding auth headers:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to process auth headers"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

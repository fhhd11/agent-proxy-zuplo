import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface AuthHeadersOptions {
  lettaApiKey: string;
  amsApiKey: string;
  supabaseAnonKey?: string;
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

    // Логируем маршрутизацию для отладки
    context.log.info(`Processing request for path: ${pathname}`);

    // Определяем к какому сервису идет запрос и добавляем соответствующий ключ
    if (pathname.startsWith("/api/v1/letta/") || 
        (pathname.startsWith("/api/v1/agents/") && pathname.includes("/messages"))) {
      // Запросы к Letta Server - все эндпоинты под /api/v1/letta/ и legacy эндпоинт для сообщений
      if (options.lettaApiKey) {
        newHeaders.set("Authorization", `Bearer ${options.lettaApiKey}`);
        context.log.info("Added Letta API key for Letta Server request");
      } else {
        context.log.error("Missing Letta API key for Letta Server request");
        return new Response(JSON.stringify({
          error: "Configuration Error",
          message: "Letta API key not configured"
        }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    } 
    else if (
      pathname.startsWith("/api/v1/templates/") ||
      pathname.startsWith("/api/v1/agents/create") ||
      (pathname.startsWith("/api/v1/agents/") && pathname.includes("/upgrade")) ||
      pathname.startsWith("/api/v1/ams/")
    ) {
      // Запросы к Agent Management Service (AMS)
      if (options.amsApiKey) {
        newHeaders.set("Authorization", `Bearer ${options.amsApiKey}`);
        context.log.info("Added AMS API key for agent management request");
      } else {
        context.log.error("Missing AMS API key for agent management request");
        return new Response(JSON.stringify({
          error: "Configuration Error", 
          message: "AMS API key not configured"
        }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Добавляем User ID из JWT для всех запросов, требующих аутентификации
    if (request.user?.sub) {
      newHeaders.set("X-User-Id", request.user.sub);
      context.log.info(`Added X-User-Id header: ${request.user.sub}`);
    }

    // Добавляем метаданные для трассировки
    newHeaders.set("X-Forwarded-By", "zuplo-proxy-v3");
    newHeaders.set("X-Request-ID", crypto.randomUUID());
    
    // Добавляем информацию о пользователе, если доступна
    if (request.user?.data) {
      try {
        const userData = JSON.stringify(request.user.data);
        newHeaders.set("X-User-Data", userData);
      } catch (error) {
        context.log.warn("Failed to serialize user data:", error);
      }
    }

    // Добавляем временную метку для отладки
    newHeaders.set("X-Proxy-Timestamp", new Date().toISOString());

    const newRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });

    // Сохраняем пользователя в новом запросе
    (newRequest as ZuploRequest).user = request.user;

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
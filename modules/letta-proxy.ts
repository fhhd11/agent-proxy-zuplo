import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface LettaProxyOptions {
  lettaBaseUrl: string;
  targetPath?: string;
  allowedMethods?: string[];
}

// Запрещенные пути - создание и управление агентами должно идти через AMS
const FORBIDDEN_PATHS = [
  '/agents', // POST - создание агента
  '/agents/create', // альтернативный путь создания
];

// Запрещенные операции для конкретных агентов
const FORBIDDEN_AGENT_OPERATIONS = [
  'DELETE', // удаление агента целиком
];

export default async function lettaProxy(
  request: ZuploRequest,
  context: ZuploContext,
  options: LettaProxyOptions,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Извлекаем оригинальный путь после /api/v1/letta
    const lettaPath = pathname.replace(/^\/api\/v1\/letta/, '');
    
    context.log.info(`Letta proxy request: ${request.method} ${lettaPath}`);

    // Проверяем запрещенные пути
    if (isForbiddenPath(lettaPath, request.method, context)) {
      return new Response(JSON.stringify({
        error: "Forbidden",
        message: "Agent creation and deletion must be done through AMS endpoints",
        hint: "Use /api/v1/agents/create for agent creation"
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Строим целевой URL для Letta
    const targetUrl = `${options.lettaBaseUrl}/v1${lettaPath}${url.search}`;
    
    context.log.info(`Proxying to Letta: ${request.method} ${targetUrl}`);

    // Проксируем запрос к Letta
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    // Копируем все заголовки ответа
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // Добавляем заголовки для отладки
    responseHeaders.set("X-Proxied-From", "zuplo-letta-proxy");
    responseHeaders.set("X-Letta-Status", response.status.toString());

    // Возвращаем ответ от Letta
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    context.log.error("Error in Letta proxy:", error);
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to proxy request to Letta",
      details: error.message
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

function isForbiddenPath(path: string, method: string, context: ZuploContext): boolean {
  // Проверка запрещенных путей для создания агентов
  if (method === 'POST' && FORBIDDEN_PATHS.some(forbidden => path === forbidden || path.startsWith(forbidden + '/'))) {
    context.log.warn(`Blocked forbidden path: ${method} ${path}`);
    return true;
  }

  // Проверка запрещенных операций с агентами
  if (FORBIDDEN_AGENT_OPERATIONS.includes(method) && path.startsWith('/agents/') && path.split('/').length === 3) {
    // Путь вида /agents/{agent_id} с запрещенным методом
    context.log.warn(`Blocked forbidden operation: ${method} ${path}`);
    return true;
  }

  return false;
}
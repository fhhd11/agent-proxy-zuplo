import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface UserProfile {
  litellm_key_id: string;
  allowed_models?: string[];
  monthly_limit?: number;
}

interface PolicyOptions {
  agentSecretKey: string;
}

export default async function agentAuthProxy(
  request: ZuploRequest,
  context: ZuploContext,
  options: PolicyOptions,
  policyName: string,
): Promise<ZuploRequest | Response> {
  try {
    // 1. Проверка секретного ключа агента
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      context.log.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({
        error: "Unauthorized",
        message: "Missing Authorization header"
      }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const agentKey = authHeader.replace("Bearer ", "");
    if (agentKey !== options.agentSecretKey) {
      context.log.error("Invalid agent secret key");
      return new Response(JSON.stringify({
        error: "Unauthorized", 
        message: "Invalid agent key"
      }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. Извлечение userid из URL параметров
    const userId = request.params.userid;
    if (!userId) {
      context.log.error("Missing userid parameter");
      return new Response(JSON.stringify({
        error: "Bad Request",
        message: "Missing userid parameter"
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    context.log.info(`Processing request for user: ${userId}`);

    // 3. Получение LiteLLM ключа пользователя из Supabase
    const userProfile = await fetchUserProfile(userId, context);
    if (!userProfile?.litellm_key_id) {
      context.log.error(`No LiteLLM key found for user: ${userId}`);
      return new Response(JSON.stringify({
        error: "Forbidden",
        message: "User has no LiteLLM access"
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Валидация запроса (опционально)
    await validateRequest(request, userProfile, context);

    // 5. Создание нового запроса с замененным Authorization header
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Authorization", `Bearer ${userProfile.litellm_key_id}`);
    
    // Добавляем метаданные для трекинга
    newHeaders.set("X-User-ID", userId);
    newHeaders.set("X-Proxy-Source", "zuplo-agent-proxy");

    // Создаем новый запрос
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });

    // Устанавливаем user для rate limiting
    (newRequest as ZuploRequest).user = {
      sub: userId,
      data: { userId, source: "agent" }
    };

    context.log.info(`Successfully authenticated user ${userId} for LiteLLM proxy`);
    return newRequest as ZuploRequest;

  } catch (error) {
    context.log.error("Error in agent auth proxy:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Proxy authentication failed"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function fetchUserProfile(userId: string, context: ZuploContext): Promise<UserProfile | null> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      context.log.error("Missing Supabase configuration");
      return null;
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=litellm_key_id,allowed_models,monthly_limit`,
      {
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        }
      }
    );

    if (!response.ok) {
      context.log.error(`Supabase error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;

  } catch (error) {
    context.log.error("Error fetching user profile:", error);
    return null;
  }
}

async function validateRequest(
  request: ZuploRequest, 
  userProfile: UserProfile, 
  context: ZuploContext
): Promise<void> {
  try {
    // Парсим тело запроса для валидации
    const body = await request.clone().json();
    
    // Проверяем обязательные поля
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error("Invalid request format: messages array required");
    }

    if (!body.model) {
      throw new Error("Invalid request format: model field required");
    }

    // Проверяем разрешенные модели (если настроено)
    if (userProfile.allowed_models && userProfile.allowed_models.length > 0) {
      if (!userProfile.allowed_models.includes(body.model)) {
        throw new Error(`Model ${body.model} not allowed for user`);
      }
    }

    context.log.info(`Request validation passed for model: ${body.model}`);
    
  } catch (error) {
    context.log.error("Request validation failed:", error);
    throw error;
  }
}

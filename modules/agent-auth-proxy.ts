import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface UserProfile {
  litellm_key: string;
}

interface PolicyOptions {
  agentSecretKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export default async function agentAuthProxy(
  request: ZuploRequest,
  context: ZuploContext,
  options: PolicyOptions,
  policyName: string,
): Promise<ZuploRequest | Response> {
  try {
    // Логируем наличие конфигурации
    context.log.info(`Configuration check - URL: ${options.supabaseUrl ? 'set' : 'missing'}, Key: ${options.supabaseServiceRoleKey ? 'set' : 'missing'}, Agent Key: ${options.agentSecretKey ? 'set' : 'missing'}`);

    // 1. Проверка секретного ключа агента
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
    const userProfile = await fetchUserProfile(userId, context, options);
    if (!userProfile?.litellm_key) {
      context.log.error(`No LiteLLM key found for user: ${userId}`);
      return new Response(JSON.stringify({
        error: "Forbidden",
        message: "User has no LiteLLM access"
      }), { 
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Создание нового запроса с замененным Authorization header
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Authorization", `Bearer ${userProfile.litellm_key}`);
    newHeaders.set("X-User-ID", userId);
    newHeaders.set("X-Proxy-Source", "zuplo-agent-proxy");

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

    context.log.info(`Successfully authenticated user ${userId} with LiteLLM key`);
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

async function fetchUserProfile(
  userId: string, 
  context: ZuploContext, 
  options: PolicyOptions
): Promise<UserProfile | null> {
  try {
    if (!options.supabaseUrl || !options.supabaseServiceRoleKey) {
      context.log.error("Missing Supabase configuration");
      context.log.error(`SUPABASE_URL: ${options.supabaseUrl ? 'set' : 'missing'}`);
      context.log.error(`SUPABASE_SERVICE_ROLE_KEY: ${options.supabaseServiceRoleKey ? 'set' : 'missing'}`);
      return null;
    }

    context.log.info(`Fetching profile for user: ${userId} from ${options.supabaseUrl}`);

    // Исправлен SQL запрос - убрана несуществующая колонка allowed_models
    const response = await fetch(
      `${options.supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=litellm_key`,
      {
        headers: {
          "apikey": options.supabaseServiceRoleKey,
          "Authorization": `Bearer ${options.supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
        }
      }
    );

    context.log.info(`Supabase response status: ${response.status}`);

    if (!response.ok) {
      context.log.error(`Supabase error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      context.log.error(`Error details: ${errorText}`);
      return null;
    }

    const data = await response.json();
    context.log.info(`Supabase response: ${JSON.stringify(data)}`);
    
    if (!data || data.length === 0) {
      context.log.error(`User ${userId} not found in database`);
      return null;
    }

    const userProfile = data[0];
    if (!userProfile.litellm_key) {
      context.log.error(`User ${userId} has no litellm_key in database`);
      return null;
    }

    context.log.info(`Found LiteLLM key for user ${userId}: ${userProfile.litellm_key.substring(0, 10)}...`);
    return userProfile;

  } catch (error) {
    context.log.error("Error fetching user profile:", error);
    return null;
  }
}
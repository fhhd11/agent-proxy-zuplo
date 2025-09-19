import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface ServiceAuthOptions {
  serviceKey: string;
}

export default async function serviceAuth(
  request: ZuploRequest,
  context: ZuploContext,
  options: ServiceAuthOptions,
  policyName: string,
): Promise<ZuploRequest | Response> {
  try {
    // Проверяем наличие заголовка авторизации
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

    const token = authHeader.replace("Bearer ", "");
    
    // Проверяем service key
    if (token !== options.serviceKey) {
      context.log.error("Invalid service key provided");
      return new Response(JSON.stringify({
        error: "Unauthorized",
        message: "Invalid service key"
      }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Устанавливаем user для внутреннего сервиса
    (request as ZuploRequest).user = {
      sub: "internal-service",
      data: { type: "service", authenticated: true }
    };

    context.log.info("Service authenticated successfully");
    return request;

  } catch (error) {
    context.log.error("Error in service auth:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Authentication failed"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

interface HealthOptions {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  litellmBaseUrl?: string;
}

export default async function healthCheck(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "agent-proxy",
    version: "1.0.0",
    checks: {
      supabase: await checkSupabase(context),
      litellm: await checkLiteLLM(context)
    }
  };

  const allHealthy = Object.values(health.checks).every(check => check === "ok");
  const status = allHealthy ? 200 : 503;

  return new Response(JSON.stringify(health, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    }
  });
}

async function checkSupabase(context: ZuploContext): Promise<string> {
  try {
    // Для health check используем заглушку, так как здесь нет options
    // В production это можно улучшить, передавая конфигурацию через context
    context.log.info("Supabase health check - configuration check needed");
    return "not_configured";
  } catch (error) {
    context.log.error("Supabase health check failed:", error);
    return "error";
  }
}

async function checkLiteLLM(context: ZuploContext): Promise<string> {
  try {
    // Аналогично для LiteLLM
    context.log.info("LiteLLM health check - configuration check needed");
    return "not_configured";
  } catch (error) {
    context.log.error("LiteLLM health check failed:", error);
    return "error";
  }
}
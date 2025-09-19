import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export async function functionHandler(
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
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) return "not_configured";

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      }
    });

    return response.ok ? "ok" : "error";
  } catch (error) {
    context.log.error("Supabase health check failed:", error);
    return "error";
  }
}

async function checkLiteLLM(context: ZuploContext): Promise<string> {
  try {
    const litellmUrl = process.env.LITELLM_BASE_URL;
    if (!litellmUrl) return "not_configured";

    const response = await fetch(`${litellmUrl}/health`);
    return response.ok ? "ok" : "error";
  } catch (error) {
    context.log.error("LiteLLM health check failed:", error);
    return "error";
  }
}

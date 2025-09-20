import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function healthCheck(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "agent-proxy",
    version: "3.0.0",
    checks: {
      supabase: await checkSupabase(context),
      litellm: await checkLiteLLM(context),
      ams: await checkAMS(context),
      letta: await checkLetta(context)
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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      context.log.warn("Supabase configuration missing");
      return "not_configured";
    }

    // Простая проверка доступности Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "HEAD",
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`
      }
    });

    if (response.ok) {
      context.log.info("Supabase health check passed");
      return "ok";
    } else {
      context.log.error(`Supabase health check failed: ${response.status}`);
      return "error";
    }
  } catch (error) {
    context.log.error("Supabase health check error:", error);
    return "error";
  }
}

async function checkLiteLLM(context: ZuploContext): Promise<string> {
  try {
    const litellmUrl = process.env.LITELLM_BASE_URL;
    
    if (!litellmUrl) {
      context.log.warn("LiteLLM configuration missing");
      return "not_configured";
    }

    // Проверяем health endpoint LiteLLM
    const response = await fetch(`${litellmUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      context.log.info("LiteLLM health check passed");
      return "ok";
    } else {
      context.log.error(`LiteLLM health check failed: ${response.status}`);
      return "error";
    }
  } catch (error) {
    context.log.error("LiteLLM health check error:", error);
    return "error";
  }
}

async function checkAMS(context: ZuploContext): Promise<string> {
  try {
    const amsUrl = process.env.AMS_BASE_URL;
    
    if (!amsUrl) {
      context.log.warn("AMS configuration missing");
      return "not_configured";
    }

    // Проверяем health endpoint AMS
    const response = await fetch(`${amsUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      const healthData = await response.json();
      if (healthData.status === "ok") {
        context.log.info("AMS health check passed");
        return "ok";
      } else {
        context.log.error("AMS reported unhealthy status:", healthData);
        return "error";
      }
    } else {
      context.log.error(`AMS health check failed: ${response.status}`);
      return "error";
    }
  } catch (error) {
    context.log.error("AMS health check error:", error);
    return "error";
  }
}

async function checkLetta(context: ZuploContext): Promise<string> {
  try {
    const lettaUrl = process.env.LETTA_BASE_URL;
    const lettaApiKey = process.env.LETTA_API_KEY;
    
    if (!lettaUrl || !lettaApiKey) {
      context.log.warn("Letta configuration missing");
      return "not_configured";
    }

    // Проверяем доступность Letta API
    const response = await fetch(`${lettaUrl}/v1/agents`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${lettaApiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      context.log.info("Letta health check passed");
      return "ok";
    } else if (response.status === 401) {
      context.log.error("Letta authentication failed");
      return "error";
    } else {
      context.log.error(`Letta health check failed: ${response.status}`);
      return "error";
    }
  } catch (error) {
    context.log.error("Letta health check error:", error);
    return "error";
  }
}
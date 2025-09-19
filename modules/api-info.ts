import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function apiInfo(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  const apiInfo = {
    name: "Agent to LiteLLM Proxy",
    version: "1.0.0",
    description: "Proxy service for AI agents to LiteLLM with user-specific authentication",
    docs: `${request.url}docs`,
    health: `${request.url}health`,
    endpoints: {
      agent_proxy: {
        method: "POST",
        path: "/api/v1/agents/{userid}/messages",
        description: "Proxy agent requests to LiteLLM with user-specific billing"
      },
      health_check: {
        method: "GET", 
        path: "/health",
        description: "Health check endpoint"
      }
    },
    usage: {
      agent_proxy: {
        example: {
          url: `${request.url}api/v1/agents/USER_ID/messages`,
          method: "POST",
          headers: {
            "Authorization": "Bearer YOUR_AGENT_SECRET_KEY",
            "Content-Type": "application/json"
          },
          body: {
            model: "gpt-4o",
            messages: [
              { role: "user", content: "Hello!" }
            ]
          }
        }
      }
    }
  };

  return new Response(JSON.stringify(apiInfo, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    }
  });
}
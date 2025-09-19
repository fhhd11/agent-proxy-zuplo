import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function apiInfo(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  
  const baseUrl = new URL(request.url).origin;
  
  const apiInfo = {
    name: "AI Agent Platform API Gateway",
    version: "2.0.0",
    description: "Unified API Gateway for AI agents with LiteLLM billing integration, Letta Server proxy, and Agent Management Service",
    docs: `${baseUrl}/docs`,
    health: `${baseUrl}/health`,
    openapi: `${baseUrl}/api.json`,
    endpoints: {
      system: {
        health: `${baseUrl}/health`,
        docs: `${baseUrl}/docs`,
        info: `${baseUrl}/`
      },
      agents: {
        proxy: `${baseUrl}/api/v1/agents/{userid}/messages`,
        create: `${baseUrl}/api/v1/agents/create`,
        status: `${baseUrl}/api/v1/agents/status`
      },
      letta: {
        agents: `${baseUrl}/api/v1/letta/agents`,
        agent_detail: `${baseUrl}/api/v1/letta/agents/{agent_id}`,
        messages: `${baseUrl}/api/v1/letta/agents/{agent_id}/messages`
      }
    },
    authentication: {
      user_jwt: "Use Supabase JWT token for user endpoints",
      agent_secret: "Use AGENT_SECRET_KEY for agent proxy endpoints",
      service_key: "Use SERVICE_SECRET_KEY for internal service endpoints"
    },
    features: [
      "Agent-to-LiteLLM proxy with per-user billing",
      "Letta Server proxy for chat management", 
      "Agent Management Service integration",
      "JWT-based user authentication",
      "Rate limiting per user",
      "Health monitoring",
      "Structured logging",
      "OpenAPI documentation"
    ],
    links: {
      repository: "https://github.com/fhhd11/agent-proxy-zuplo",
      issues: "https://github.com/fhhd11/agent-proxy-zuplo/issues",
      documentation: "https://github.com/fhhd11/agent-proxy-zuplo#readme"
    }
  };

  return new Response(JSON.stringify(apiInfo, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300' // 5 minutes
    }
  });
}

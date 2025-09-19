import { ZuploContext, ZuploRequest } from "@zuplo/runtime";
import * as fs from 'fs';
import * as path from 'path';

export default async function openApiSpec(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  try {
    // В Zuplo runtime мы можем получить OpenAPI спецификацию напрямую из конфигурации
    // Но сначала попробуем прочитать файл routes.oas.json
    
    // Создаем OpenAPI спецификацию из routes.oas.json
    const openApiSpec = {
      "openapi": "3.0.3",
      "info": {
        "title": "AI Agent Platform API",
        "description": "Unified API for agent management and chat interactions with LiteLLM billing integration",
        "version": "2.0.0",
        "contact": {
          "name": "API Support"
        }
      },
      "servers": [
        {
          "url": new URL(request.url).origin,
          "description": "Current environment"
        }
      ],
      "components": {
        "securitySchemes": {
          "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "Agent Secret Key",
            "description": "Use your agent secret key as Bearer token"
          },
          "UserJWT": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "User JWT token from Supabase authentication"
          }
        },
        "schemas": {
          "ApiInfo": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "example": "AI Agent Platform API Gateway"
              },
              "version": {
                "type": "string",
                "example": "2.0.0"
              },
              "description": {
                "type": "string"
              }
            }
          },
          "HealthResponse": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "example": "ok"
              },
              "timestamp": {
                "type": "string",
                "format": "date-time"
              },
              "service": {
                "type": "string",
                "example": "agent-proxy"
              },
              "checks": {
                "type": "object",
                "properties": {
                  "supabase": {"type": "string"},
                  "litellm": {"type": "string"}
                }
              }
            }
          },
          "ErrorResponse": {
            "type": "object",
            "properties": {
              "error": {
                "type": "string"
              },
              "message": {
                "type": "string"
              }
            }
          },
          "LLMRequest": {
            "type": "object",
            "required": ["model", "messages"],
            "properties": {
              "model": {
                "type": "string",
                "description": "The model to use for completion",
                "example": "gpt-4o"
              },
              "messages": {
                "type": "array",
                "description": "Array of message objects",
                "items": {
                  "$ref": "#/components/schemas/Message"
                }
              },
              "max_tokens": {
                "type": "integer",
                "description": "Maximum number of tokens to generate"
              },
              "temperature": {
                "type": "number",
                "description": "Sampling temperature"
              },
              "stream": {
                "type": "boolean",
                "description": "Whether to stream the response"
              }
            }
          },
          "Message": {
            "type": "object",
            "required": ["role", "content"],
            "properties": {
              "role": {
                "type": "string",
                "enum": ["system", "user", "assistant"],
                "description": "The role of the message author"
              },
              "content": {
                "type": "string",
                "description": "The content of the message"
              }
            }
          }
        }
      },
      "paths": {
        "/": {
          "get": {
            "operationId": "api-info",
            "summary": "API Information",
            "description": "Returns basic information about the Agent Proxy API",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "API information",
                "content": {
                  "application/json": {
                    "schema": {"$ref": "#/components/schemas/ApiInfo"}
                  }
                }
              }
            }
          }
        },
        "/health": {
          "get": {
            "operationId": "health-check",
            "summary": "Health check endpoint",
            "description": "Returns the health status of the API",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "Service is healthy",
                "content": {
                  "application/json": {
                    "schema": {"$ref": "#/components/schemas/HealthResponse"}
                  }
                }
              }
            }
          }
        },
        "/docs": {
          "get": {
            "operationId": "swagger-docs",
            "summary": "API Documentation",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "Swagger UI documentation",
                "content": {
                  "text/html": {"schema": {"type": "string"}}
                }
              }
            }
          }
        },
        "/api/v1/agents/{userid}/messages": {
          "post": {
            "operationId": "proxy-agent-to-litellm",
            "summary": "Proxy agent requests to LiteLLM",
            "description": "Accepts agent requests with secret key and forwards to LiteLLM with user-specific key for proper billing",
            "tags": ["Agent Proxy"],
            "security": [{"BearerAuth": []}],
            "parameters": [
              {
                "name": "userid",
                "in": "path",
                "required": true,
                "schema": {"type": "string"},
                "description": "User ID for LiteLLM key lookup"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {"$ref": "#/components/schemas/LLMRequest"}
                }
              }
            },
            "responses": {
              "200": {"description": "Successful LLM response"},
              "401": {"description": "Invalid agent secret key"},
              "403": {"description": "User has no LiteLLM access"}
            }
          }
        },
        "/api/v1/letta/agents": {
          "get": {
            "operationId": "letta-list-agents",
            "summary": "List Letta agents",
            "description": "Get all Letta agents for authenticated user",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "responses": {
              "200": {"description": "List of Letta agents"},
              "401": {"description": "Unauthorized"}
            }
          }
        },
        "/api/v1/letta/agents/{agent_id}/messages": {
          "post": {
            "operationId": "letta-send-message",
            "summary": "Send message to Letta agent",
            "description": "Send a message to Letta agent and get response",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {"type": "string"}
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "required": ["message"],
                    "properties": {
                      "message": {"type": "string"},
                      "stream": {"type": "boolean", "default": false}
                    }
                  }
                }
              }
            },
            "responses": {
              "200": {"description": "Agent response"},
              "400": {"description": "Invalid request"}
            }
          }
        },
        "/api/v1/agents/create": {
          "post": {
            "operationId": "create-personalized-agent",
            "summary": "Create personalized agent",
            "description": "Create a personalized Letta agent via Agent Management Service",
            "tags": ["Agent Management"],
            "security": [{"UserJWT": []}],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "personalInfo": {
                        "type": "object",
                        "properties": {
                          "name": {"type": "string", "example": "Иван Петров"},
                          "interests": {"type": "array", "items": {"type": "string"}},
                          "communicationStyle": {"type": "string"},
                          "background": {"type": "string"},
                          "goals": {"type": "array", "items": {"type": "string"}}
                        }
                      }
                    }
                  }
                }
              }
            },
            "responses": {
              "201": {
                "description": "Agent created successfully",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "success": {"type": "boolean"},
                        "agent_id": {"type": "string"},
                        "chat_endpoint": {"type": "string"}
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/agents/status": {
          "get": {
            "operationId": "get-user-agent-status",
            "summary": "Get user agent status",
            "description": "Check if user has an agent and get its status",
            "tags": ["Agent Management"],
            "security": [{"UserJWT": []}],
            "responses": {
              "200": {
                "description": "Agent status",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "hasAgent": {"type": "boolean"},
                        "agent_id": {"type": "string"},
                        "status": {"type": "string"}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "tags": [
        {"name": "System", "description": "System endpoints"},
        {"name": "Agent Proxy", "description": "Agent to LiteLLM proxy"},
        {"name": "Letta Server", "description": "Letta Server endpoints"},
        {"name": "Agent Management", "description": "Agent Management Service"}
      ]
    };

    return new Response(JSON.stringify(openApiSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });

  } catch (error) {
    context.log.error("Error generating OpenAPI spec:", error);
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to generate OpenAPI specification"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

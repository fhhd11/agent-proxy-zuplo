import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function swaggerDocs(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  
  const openApiSpec = {
    "openapi": "3.0.3",
    "info": {
      "title": "Agent to LiteLLM Proxy",
      "description": "Proxy service for AI agents to LiteLLM with user-specific authentication for proper billing",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": "https://maroon-koi-main-714e1e1.d2.zuplo.dev",
        "description": "Production"
      }
    ],
    "paths": {
      "/health": {
        "get": {
          "summary": "Health check endpoint",
          "description": "Returns the health status of the API",
          "tags": ["System"],
          "responses": {
            "200": {
              "description": "Service is healthy",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "status": {"type": "string", "example": "ok"},
                      "timestamp": {"type": "string", "format": "date-time"},
                      "service": {"type": "string", "example": "agent-proxy"},
                      "version": {"type": "string", "example": "1.0.0"}
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/api/v1/agents/{userid}/messages": {
        "post": {
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
              "description": "User ID for LiteLLM key lookup",
              "example": "user123"
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "required": ["model", "messages"],
                  "properties": {
                    "model": {
                      "type": "string",
                      "description": "The model to use for completion",
                      "example": "gpt-4o",
                      "enum": ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"]
                    },
                    "messages": {
                      "type": "array",
                      "description": "Array of message objects",
                      "items": {
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
                    },
                    "max_tokens": {
                      "type": "integer",
                      "description": "Maximum number of tokens to generate",
                      "minimum": 1,
                      "maximum": 4096,
                      "example": 100
                    },
                    "temperature": {
                      "type": "number",
                      "description": "Sampling temperature (0-2)",
                      "minimum": 0,
                      "maximum": 2,
                      "example": 0.7
                    }
                  }
                },
                "examples": {
                  "basic_request": {
                    "summary": "Basic chat request",
                    "value": {
                      "model": "gpt-4o",
                      "messages": [
                        {"role": "user", "content": "Hello, how are you?"}
                      ],
                      "max_tokens": 100,
                      "temperature": 0.7
                    }
                  },
                  "conversation": {
                    "summary": "Multi-turn conversation",
                    "value": {
                      "model": "gpt-4o",
                      "messages": [
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": "What is the capital of France?"},
                        {"role": "assistant", "content": "The capital of France is Paris."},
                        {"role": "user", "content": "What is its population?"}
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successful LLM response",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "id": {"type": "string", "example": "chatcmpl-123"},
                      "object": {"type": "string", "example": "chat.completion"},
                      "created": {"type": "integer", "example": 1677652288},
                      "model": {"type": "string", "example": "gpt-4o"},
                      "choices": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "index": {"type": "integer"},
                            "message": {
                              "type": "object",
                              "properties": {
                                "role": {"type": "string"},
                                "content": {"type": "string"}
                              }
                            },
                            "finish_reason": {"type": "string", "example": "stop"}
                          }
                        }
                      },
                      "usage": {
                        "type": "object",
                        "properties": {
                          "prompt_tokens": {"type": "integer", "example": 9},
                          "completion_tokens": {"type": "integer", "example": 12},
                          "total_tokens": {"type": "integer", "example": 21}
                        }
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Invalid agent secret key",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "error": {"type": "string", "example": "Unauthorized"},
                      "message": {"type": "string", "example": "Invalid agent key"}
                    }
                  }
                }
              }
            },
            "403": {
              "description": "User has no LiteLLM access",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "error": {"type": "string", "example": "Forbidden"},
                      "message": {"type": "string", "example": "User has no LiteLLM access"}
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "components": {
      "securitySchemes": {
        "BearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "description": "Use your agent secret key as Bearer token"
        }
      }
    }
  };

  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent to LiteLLM Proxy - API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        const ui = SwaggerUIBundle({
            url: 'data:application/json;base64,' + btoa(JSON.stringify(${JSON.stringify(openApiSpec)})),
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            requestInterceptor: (request) => {
                // Add default authorization header hint
                if (!request.headers.Authorization && request.url.includes('/api/v1/agents/')) {
                    request.headers.Authorization = 'Bearer YOUR_AGENT_SECRET_KEY';
                }
                return request;
            }
        });
    </script>
</body>
</html>`;

  return new Response(swaggerHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=300"
    }
  });
}
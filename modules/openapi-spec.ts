import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function openApiSpec(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  try {
    // Получаем базовый URL для серверов
    const baseUrl = new URL(request.url).origin;
    
    // Создаем OpenAPI спецификацию на основе актуальной routes.oas.json
    const openApiSpec = {
      "info": {
        "title": "AI Agent Platform API",
        "description": "Unified API for agent management and chat interactions with full Letta integration",
        "version": "3.1.0",
        "contact": {
          "name": "API Support"
        }
      },
      "openapi": "3.0.3",
      "servers": [
        {
          "url": baseUrl,
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
                "example": "Agent Platform API"
              },
              "version": {
                "type": "string",
                "example": "3.1.0"
              },
              "description": {
                "type": "string"
              },
              "docs": {
                "type": "string",
                "format": "uri"
              },
              "health": {
                "type": "string",
                "format": "uri"
              },
              "endpoints": {
                "type": "object"
              }
            }
          },
          "HealthResponse": {
            "type": "object",
            "properties": {
              "status": {
                "type": "string",
                "enum": ["ok", "error"],
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
              "version": {
                "type": "string",
                "example": "3.1.0"
              },
              "checks": {
                "type": "object",
                "properties": {
                  "supabase": {
                    "type": "string",
                    "enum": ["ok", "error", "not_configured"]
                  },
                  "litellm": {
                    "type": "string",
                    "enum": ["ok", "error", "not_configured"]
                  },
                  "ams": {
                    "type": "string",
                    "enum": ["ok", "error", "not_configured"]
                  },
                  "letta": {
                    "type": "string",
                    "enum": ["ok", "error", "not_configured"]
                  }
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
              },
              "details": {
                "type": "object"
              }
            }
          },
          "LettaAgent": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "example": "agent-12345"
              },
              "user_id": {
                "type": "string",
                "example": "user-67890"
              },
              "name": {
                "type": "string",
                "example": "My Personal Assistant"
              },
              "created_at": {
                "type": "string",
                "format": "date-time"
              },
              "last_updated_at": {
                "type": "string",
                "format": "date-time"
              },
              "system": {
                "type": "string",
                "description": "System prompt/personality"
              },
              "persona": {
                "type": "string",
                "description": "Agent persona"
              },
              "human": {
                "type": "string",
                "description": "Human description"
              }
            }
          },
          "LettaMessage": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "role": {
                "type": "string",
                "enum": ["user", "assistant", "system"]
              },
              "text": {
                "type": "string"
              },
              "user_id": {
                "type": "string"
              },
              "agent_id": {
                "type": "string"
              },
              "created_at": {
                "type": "string",
                "format": "date-time"
              }
            }
          },
          "SendMessageRequest": {
            "type": "object",
            "required": ["message"],
            "properties": {
              "message": {
                "type": "string",
                "description": "Message text to send to the agent",
                "example": "Привет! Как дела?"
              },
              "role": {
                "type": "string",
                "enum": ["user", "system"],
                "default": "user",
                "description": "Role of the message sender"
              },
              "stream": {
                "type": "boolean",
                "default": false,
                "description": "Whether to stream the response"
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
                "example": "gpt-4o",
                "enum": ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"]
              },
              "messages": {
                "type": "array",
                "description": "Array of message objects",
                "items": {
                  "$ref": "#/components/schemas/Message"
                },
                "minItems": 1
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
              },
              "stream": {
                "type": "boolean",
                "description": "Whether to stream the response",
                "default": false
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
                "description": "The content of the message",
                "example": "Hello, how are you?"
              }
            }
          },
          "CreateAgentRequest": {
            "type": "object",
            "required": ["template_id"],
            "properties": {
              "template_id": {
                "type": "string",
                "description": "ID of the agent template to use",
                "example": "support-agent"
              },
              "version": {
                "type": "string",
                "description": "Specific version of the template",
                "example": "1.0.0"
              },
              "use_latest": {
                "type": "boolean",
                "description": "Use the latest version of the template",
                "default": false
              },
              "agent_name": {
                "type": "string",
                "description": "Name for the created agent",
                "example": "My Support Agent"
              },
              "variables": {
                "type": "object",
                "description": "Template variables",
                "additionalProperties": true,
                "example": {
                  "company_name": "Test Company",
                  "support_level": "premium"
                }
              }
            }
          },
          "AgentResponse": {
            "type": "object",
            "properties": {
              "agent": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "example": "agent-9dab0385-77fc-40ec-a22a-2197011994ee"
                  },
                  "name": {
                    "type": "string",
                    "example": "My Support Agent"
                  },
                  "llm_config": {
                    "type": "object"
                  },
                  "embedding_config": {
                    "type": "object"
                  },
                  "memory": {
                    "type": "object"
                  }
                }
              },
              "template_checksum": {
                "type": "string",
                "description": "SHA256 checksum of the template used"
              }
            }
          },
          "TemplateValidationRequest": {
            "type": "string",
            "description": "YAML or JSON content of the agent template",
            "example": "af_version: \"1.0\"\ntemplate:\n  id: \"test-agent\"\n  name: \"Test Agent\"\n  version: \"1.0.0\""
          },
          "ValidationResponse": {
            "type": "object",
            "properties": {
              "format": {
                "type": "string",
                "enum": ["yaml", "json"]
              },
              "validation": {
                "type": "object",
                "properties": {
                  "valid": {
                    "type": "boolean"
                  },
                  "errors": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "PublishResponse": {
            "type": "object",
            "properties": {
              "template_id": {
                "type": "string",
                "example": "support-agent"
              },
              "version": {
                "type": "string",
                "example": "1.0.0"
              },
              "checksum": {
                "type": "string",
                "description": "SHA256 checksum of the published template"
              },
              "is_latest": {
                "type": "boolean",
                "example": true
              }
            }
          },
          "UpgradeAgentRequest": {
            "type": "object",
            "properties": {
              "target_version": {
                "type": "string",
                "description": "Target version to upgrade to",
                "example": "1.1.0"
              },
              "use_latest": {
                "type": "boolean",
                "description": "Upgrade to the latest version",
                "default": false
              },
              "dry_run": {
                "type": "boolean",
                "description": "Only return the upgrade plan without applying",
                "default": false
              },
              "variables": {
                "type": "object",
                "description": "Updated template variables"
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
            "description": "Returns basic information about the API",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "API information",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ApiInfo"
                    }
                  }
                }
              }
            }
          }
        },
        "/health": {
          "get": {
            "operationId": "health-check",
            "summary": "Health Check",
            "description": "Returns the health status of the API and connected services",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "Service health status",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/HealthResponse"
                    }
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
            "description": "Interactive Swagger documentation",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "HTML documentation page",
                "content": {
                  "text/html": {
                    "schema": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        },
        "/api.json": {
          "get": {
            "operationId": "openapi-spec",
            "summary": "OpenAPI Specification",
            "description": "Returns the OpenAPI 3.0 specification for this API",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "OpenAPI specification in JSON format",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "description": "OpenAPI 3.0 specification"
                    }
                  }
                }
              }
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
              "200": {
                "description": "List of agents",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/LettaAgent"
                      }
                    }
                  }
                }
              },
              "401": {
                "description": "Unauthorized",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/letta/agents/{agent_id}": {
          "get": {
            "operationId": "letta-get-agent",
            "summary": "Get agent details",
            "description": "Get details of a specific Letta agent",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              }
            ],
            "responses": {
              "200": {
                "description": "Agent details",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/LettaAgent"
                    }
                  }
                }
              },
              "404": {
                "description": "Agent not found",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/letta/agents/{agent_id}/messages": {
          "get": {
            "operationId": "letta-get-messages",
            "summary": "Get agent message history",
            "description": "Get message history for a specific agent",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              },
              {
                "name": "limit",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 100,
                  "default": 50
                },
                "description": "Maximum number of messages to return"
              },
              {
                "name": "before",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string"
                },
                "description": "Get messages before this message ID"
              }
            ],
            "responses": {
              "200": {
                "description": "Message history",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/LettaMessage"
                      }
                    }
                  }
                }
              }
            }
          },
          "post": {
            "operationId": "letta-send-message",
            "summary": "Send message to agent",
            "description": "Send a message to a Letta agent and get response",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SendMessageRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Agent response",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/LettaMessage"
                    }
                  }
                }
              },
              "400": {
                "description": "Bad request",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/letta/agents/{agent_id}/memory": {
          "get": {
            "operationId": "letta-get-memory",
            "summary": "Get agent memory",
            "description": "Get current memory state of the agent (core memory, persona, human description)",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              }
            ],
            "responses": {
              "200": {
                "description": "Agent memory state",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "core_memory": {
                          "type": "object",
                          "description": "Core memory sections"
                        },
                        "persona": {
                          "type": "string",
                          "description": "Agent's persona"
                        },
                        "human": {
                          "type": "string", 
                          "description": "Description of the human user"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "post": {
            "operationId": "letta-update-memory",
            "summary": "Update agent memory",
            "description": "Update the memory state of the agent",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "persona": {
                        "type": "string",
                        "description": "Updated agent persona",
                        "example": "Дружелюбный AI-ассистент с экспертизой в программировании"
                      },
                      "human": {
                        "type": "string",
                        "description": "Updated human description",
                        "example": "Опытный разработчик, работающий над AI-проектами"
                      }
                    }
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Memory updated successfully",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "message": {
                          "type": "string",
                          "example": "Memory updated successfully"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/letta/agents/{agent_id}/archival": {
          "get": {
            "operationId": "letta-get-archival",
            "summary": "Get archival memory",
            "description": "Get archival memory entries for the agent",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              },
              {
                "name": "query",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string"
                },
                "description": "Search query for archival memory"
              },
              {
                "name": "limit",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 100,
                  "default": 20
                },
                "description": "Maximum number of entries to return"
              }
            ],
            "responses": {
              "200": {
                "description": "Archival memory entries",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string"
                          },
                          "content": {
                            "type": "string"
                          },
                          "timestamp": {
                            "type": "string",
                            "format": "date-time"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "post": {
            "operationId": "letta-add-archival",
            "summary": "Add to archival memory",
            "description": "Add new entries to agent's archival memory",
            "tags": ["Letta Server"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent",
                "example": "agent-12345"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "required": ["content"],
                    "properties": {
                      "content": {
                        "type": "string",
                        "description": "Content to add to archival memory",
                        "example": "Важная информация о предпочтениях пользователя"
                      }
                    }
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Content added to archival memory",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "description": "ID of the created archival entry"
                        },
                        "message": {
                          "type": "string",
                          "example": "Content added to archival memory"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/agents/{userId}/messages": {
          "post": {
            "operationId": "send-message-legacy",
            "summary": "Send message to agent (Legacy)",
            "description": "⚠️ DEPRECATED: Legacy endpoint for sending messages to Letta agent. Use /api/v1/letta/agents/{id}/messages instead.",
            "tags": ["Letta Server (Legacy)"],
            "security": [{"UserJWT": []}],
            "deprecated": true,
            "parameters": [
              {
                "name": "userId",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "User ID (for legacy compatibility)"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/SendMessageRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Agent response"
              }
            }
          }
        },
        "/api/v1/agents/{userId}/proxy": {
          "post": {
            "operationId": "proxy-agent-to-litellm",
            "summary": "Proxy agent requests to LiteLLM",
            "description": "Proxy agent requests with secret key to LiteLLM with user-specific billing",
            "tags": ["Agent Proxy"],
            "security": [{"BearerAuth": []}],
            "parameters": [
              {
                "name": "userId",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "User ID for LiteLLM key lookup"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/LLMRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Successful LLM response"
              },
              "401": {
                "description": "Invalid agent secret key"
              },
              "403": {
                "description": "User has no LiteLLM access"
              }
            }
          }
        },
        "/api/v1/templates/validate": {
          "post": {
            "operationId": "validate-template",
            "summary": "Validate agent template",
            "description": "Validate an agent template format and structure",
            "tags": ["Template Management"],
            "security": [{"UserJWT": []}],
            "requestBody": {
              "required": true,
              "content": {
                "application/x-yaml": {
                  "schema": {
                    "$ref": "#/components/schemas/TemplateValidationRequest"
                  }
                },
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/TemplateValidationRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Validation result",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ValidationResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/templates/publish": {
          "post": {
            "operationId": "publish-template",
            "summary": "Publish agent template",
            "description": "Publish a validated agent template to the template repository",
            "tags": ["Template Management"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "Idempotency-Key",
                "in": "header",
                "required": false,
                "schema": {
                  "type": "string"
                },
                "description": "Unique key to prevent duplicate requests"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/x-yaml": {
                  "schema": {
                    "$ref": "#/components/schemas/TemplateValidationRequest"
                  }
                },
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/TemplateValidationRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Template published successfully",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/PublishResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/agents/create": {
          "post": {
            "operationId": "create-agent",
            "summary": "Create new agent",
            "description": "Create a new Letta agent from a template via AMS",
            "tags": ["Agent Management"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "Idempotency-Key",
                "in": "header",
                "required": false,
                "schema": {
                  "type": "string"
                },
                "description": "Unique key to prevent duplicate requests"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CreateAgentRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Agent created successfully",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/AgentResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/agents/{agent_id}/upgrade": {
          "post": {
            "operationId": "upgrade-agent",
            "summary": "Upgrade agent to new template version",
            "description": "Upgrade an existing agent to a newer template version",
            "tags": ["Agent Management"],
            "security": [{"UserJWT": []}],
            "parameters": [
              {
                "name": "agent_id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "string"
                },
                "description": "ID of the agent to upgrade"
              }
            ],
            "requestBody": {
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UpgradeAgentRequest"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "Upgrade completed or dry run result"
              }
            }
          }
        },
        "/api/v1/ams/health": {
          "get": {
            "operationId": "ams-health-check",
            "summary": "AMS Health Check",
            "description": "Check the health status of the Agent Management Service",
            "tags": ["System"],
            "responses": {
              "200": {
                "description": "AMS is healthy"
              }
            }
          }
        }
      },
      "tags": [
        {
          "name": "System",
          "description": "System endpoints for health checks and documentation"
        },
        {
          "name": "Letta Server",
          "description": "🤖 Direct Letta Server communication - full agent interaction capabilities"
        },
        {
          "name": "Letta Server (Legacy)",
          "description": "⚠️ Deprecated legacy endpoints - use Letta Server endpoints instead"
        },
        {
          "name": "Agent Management", 
          "description": "🔧 Agent creation and lifecycle management via AMS"
        },
        {
          "name": "Template Management",
          "description": "📝 Agent template validation and publishing"
        },
        {
          "name": "Agent Proxy",
          "description": "🔀 Agent to LiteLLM proxy for billing management"
        }
      ]
    };

    return new Response(JSON.stringify(openApiSpec, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    context.log.error("Error generating OpenAPI spec:", error);
    
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to generate OpenAPI specification",
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
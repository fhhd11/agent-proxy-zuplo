# AI Agent Platform API - Zuplo Integration

> Unified API gateway for agent management and chat interactions with new Agent Management Service (AMS) integration

## Overview

This Zuplo project serves as an API gateway that provides:

- **Agent Communication**: Proxy to Letta server for agent messaging
- **Template Management**: Validation and publishing of agent templates via AMS
- **Agent Lifecycle**: Creation and upgrade of agents through AMS
- **Authentication**: JWT-based user authentication and service-to-service auth
- **Monitoring**: Health checks for all integrated services

## Architecture

```
Client App -> Zuplo Gateway -> [AMS | Letta Server | LiteLLM]
                   |
                   v
            Supabase (Auth & Data)
```

## New Features (v3.0.0)

- ✅ **Template Management**: Validate and publish agent templates
- ✅ **New Agent Creation**: Create agents from templates with variables
- ✅ **Agent Upgrades**: Migrate agents to newer template versions
- ✅ **Enhanced Health Monitoring**: Check all service dependencies
- ✅ **Improved Authentication**: Better header management for different services

## API Endpoints

### System
- `GET /` - API information
- `GET /health` - Health status of all services
- `GET /docs` - Interactive Swagger documentation

### Template Management
- `POST /api/v1/templates/validate` - Validate agent template
- `POST /api/v1/templates/publish` - Publish agent template

### Agent Management  
- `POST /api/v1/agents/create` - Create new agent from template
- `POST /api/v1/agents/{agent_id}/upgrade` - Upgrade agent to new version

### Agent Communication
- `POST /api/v1/agents/{userId}/messages` - Send message to agent
- `GET /api/v1/agents/{userId}/messages` - Get agent message history

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_ANON_KEY=your-anon-key

# AMS Configuration (NEW)
AMS_BASE_URL=https://your-project.supabase.co/functions/v1/ams
AMS_API_KEY=your-supabase-anon-key

# Letta Configuration  
LETTA_BASE_URL=https://your-letta-server.com
LETTA_API_KEY=your-letta-api-key

# LiteLLM Configuration
LITELLM_BASE_URL=https://your-litellm-server.com

# Security
AGENT_SECRET_KEY=your-agent-secret-key
SERVICE_SECRET_KEY=your-service-secret-key
```

### Setting Up Environment Variables

1. **In Zuplo Dashboard**:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all required variables for your environment

2. **For Development**:
   - Create `.env` file (not committed to git)
   - Use `zuplo dev` for local testing

## Setup Instructions

### 1. Clone and Configure

```bash
# Clone the repository  
git clone https://github.com/fhhd11/agent-proxy-zuplo.git
cd agent-proxy-zuplo

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your actual values
```

### 2. Update Project Files

Replace the following files with the new versions:

- `config/routes.oas.json` - Updated API routes
- `config/policies.json` - Updated authentication policies  
- `modules/add-auth-headers.ts` - Enhanced header management
- `modules/health-check.ts` - Multi-service health monitoring

### 3. Deploy to Zuplo

#### Option A: Zuplo Dashboard
1. Open Zuplo dashboard
2. Import/update your project files
3. Configure environment variables
4. Deploy to your environment

#### Option B: CLI Deployment
```bash
# Install Zuplo CLI
npm install -g @zuplo/cli

# Login to Zuplo
zuplo login

# Deploy to staging
zuplo deploy --environment staging

# Deploy to production
zuplo deploy --environment production
```

### 4. Test the Integration

```bash
# Health check
curl https://your-zuplo-url.com/health

# Validate template
curl -X POST https://your-zuplo-url.com/api/v1/templates/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/x-yaml" \
  -d 'af_version: "1.0"
template:
  id: "test-agent"
  name: "Test Agent"  
  version: "1.0.0"'

# Create agent
curl -X POST https://your-zuplo-url.com/api/v1/agents/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "test-agent",
    "version": "1.0.0",
    "agent_name": "My Test Agent"
  }'
```

## Breaking Changes from v2.0.0

### URL Changes
- ❌ **Old**: `/api/v1/agents/create` (old personalized agent endpoint)
- ✅ **New**: `/api/v1/agents/create` (template-based agent creation)

### Environment Variables
- ❌ **Removed**: `AGENT_MANAGEMENT_URL`, `AGENT_MANAGEMENT_API_KEY`
- ✅ **Added**: `AMS_BASE_URL`, `AMS_API_KEY`

### Request Formats
- **Agent Creation**: Now uses template-based approach instead of personalized info
- **Authentication**: Enhanced header management for different services

## Migration Guide

### From v2.0.0 to v3.0.0

1. **Update Environment Variables**:
   ```bash
   # Remove old variables
   unset AGENT_MANAGEMENT_URL
   unset AGENT_MANAGEMENT_API_KEY
   
   # Add new variables
   export AMS_BASE_URL=https://your-project.supabase.co/functions/v1/ams
   export AMS_API_KEY=your-supabase-anon-key
   ```

2. **Update Client Code**:
   ```javascript
   // Old format
   const response = await fetch('/api/v1/agents/create', {
     body: JSON.stringify({
       personalInfo: { name: "John", interests: ["AI"] }
     })
   });

   // New format  
   const response = await fetch('/api/v1/agents/create', {
     body: JSON.stringify({
       template_id: "support-agent",
       version: "1.0.0",
       variables: { company_name: "My Company" }
     })
   });
   ```

3. **Test New Endpoints**:
   - Validate that template endpoints work
   - Test agent creation with templates
   - Verify health checks pass for all services

## Monitoring and Troubleshooting

### Health Check Details

The `/health` endpoint now checks:
- **Supabase**: Database connectivity and authentication
- **LiteLLM**: Model proxy availability  
- **AMS**: Agent Management Service health
- **Letta**: Agent server connectivity

### Common Issues

1. **AMS Health Check Fails**:
   ```bash
   # Check AMS deployment
   curl https://your-project.supabase.co/functions/v1/ams/health
   
   # Verify environment variables
   echo $AMS_BASE_URL
   echo $AMS_API_KEY
   ```

2. **Authentication Errors**:
   - Verify JWT tokens are valid
   - Check Supabase JWT secret configuration
   - Ensure API keys are correctly set

3. **Template Validation Fails**:
   - Check YAML/JSON syntax
   - Verify required template fields
   - Review AMS logs in Supabase Functions

## Development

### Local Development

```bash
# Start local development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check
```

### Project Structure

```
/
├── config/
│   ├── routes.oas.json      # API routes and schemas
│   └── policies.json        # Authentication policies
├── modules/
│   ├── add-auth-headers.ts  # Authentication header management
│   ├── health-check.ts      # Health monitoring
│   ├── agent-auth-proxy.ts  # Agent authentication (legacy)
│   └── api-info.ts          # API information endpoint
├── tests/
│   └── *.test.ts           # Test files
└── package.json
```

## Support

- **Documentation**: [Zuplo Docs](https://zuplo.com/docs)
- **Issues**: Create GitHub issue in the repository
- **AMS Issues**: Check Supabase Functions logs

## Changelog

### v3.0.0 (Latest)
- ✅ Added template management endpoints
- ✅ Updated agent creation to use templates
- ✅ Enhanced health monitoring
- ✅ Improved authentication flow
- ✅ Added agent upgrade functionality

### v2.0.0 (Deprecated)
- Legacy personalized agent creation
- Basic health checks
- Simple authentication flow

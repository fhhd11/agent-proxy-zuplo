import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function swaggerDocs(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<Response> {
  
  const baseUrl = new URL(request.url).origin;
  
  const swaggerUI = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Agent Platform API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title {
      color: #3b4151;
      font-family: sans-serif;
      font-size: 36px;
      font-weight: bold;
    }
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 28px;
    }
    .custom-header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🤖 AI Agent Platform API</h1>
    <p>Unified Gateway for Agent Management, Letta Server & LiteLLM Integration</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${baseUrl}/api.json',
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
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        persistAuthorization: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: function(error) {
          console.error('Swagger UI failed to load:', error);
          document.getElementById('swagger-ui').innerHTML = 
            '<div style="padding: 20px; color: red; text-align: center;">' +
            '<h3>❌ Failed to load API documentation</h3>' +
            '<p>Error: ' + error.message + '</p>' +
            '<p>Please check the console for more details.</p>' +
            '</div>';
        }
      });

      // Add custom styling after load
      setTimeout(() => {
        const style = document.createElement('style');
        style.textContent = \`
          .swagger-ui .scheme-container {
            background: #f7f7f7;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 20px;
          }
        \`;
        document.head.appendChild(style);
      }, 1000);
    };
  </script>
</body>
</html>`;

  return new Response(swaggerUI, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

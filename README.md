# Agent to LiteLLM Proxy

Zuplo API Gateway прокси для перенаправления запросов от AI агентов к LiteLLM с правильной аутентификацией для биллинга по пользователям.

## Архитектура

```
Letta Agents → Zuplo Proxy → LiteLLM Server
     ↓              ↓             ↓
Agent Secret → User LiteLLM → Per-user 
    Key         Key         Billing
```

## Функции

- ✅ Единый секретный ключ для всех агентов
- ✅ Автоматическая подмена токенов на пользовательские LiteLLM ключи
- ✅ Корректный биллинг по пользователям
- ✅ Rate limiting по пользователям
- ✅ Health checks для мониторинга
- ✅ Валидация запросов
- ✅ Структурированное логирование

## Установка

### 1. Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск локально
npm run dev

# Сборка
npm run build
```

### 2. Deploy в Zuplo

```bash
# Авторизация в Zuplo
zuplo link

# Деплой проекта
npm run deploy
```

## Конфигурация

### Environment Variables

Скопируйте `.env.example` в `.env` и настройте:

```env
AGENT_SECRET_KEY=your-super-secret-agent-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LITELLM_BASE_URL=https://your-litellm-instance.com
```

### Supabase Schema

Убедитесь что в Supabase есть таблица `user_profiles`:

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  litellm_key_id TEXT NOT NULL,
  allowed_models TEXT[] DEFAULT NULL,
  monthly_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### POST /api/v1/agents/{userid}/messages

Основной эндпоинт для агентов.

**Request:**
```bash
curl -X POST "https://your-gateway.zuplo.app/api/v1/agents/user123/messages" \
  -H "Authorization: Bearer your-agent-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Response:** Стандартный OpenAI-совместимый ответ

### GET /health

Health check эндпоинт для мониторинга.

## Использование в Agent Management Service

```typescript
// При создании агента устанавливайте кастомный endpoint
const agentConfig = {
  model_endpoint: `${ZUPLO_BASE_URL}/api/v1/agents/${userId}/messages`,
  model_endpoint_type: "openai",
  openai_key: process.env.AGENT_SECRET_KEY, // Единый ключ
  model: "gpt-4o"
};
```

## Мониторинг

- **Health checks:** `GET /health` 
- **Logs:** Доступны в Zuplo dashboard
- **Metrics:** LiteLLM dashboard покажет usage по пользователям

## Безопасность

- Секретный ключ агента должен быть надежно защищен
- Пользовательские LiteLLM ключи никогда не передаются агентам
- Rate limiting предотвращает злоупотребления
- Все запросы логируются для аудита

## Development

### Локальное тестирование

```bash
# Запуск в dev режиме
zuplo dev

# Тестирование endpoint
curl -X POST "http://localhost:9000/api/v1/agents/test-user/messages" \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "test"}]}'
```

### Структура проекта

```
agent-proxy-project/
├── config/
│   ├── routes.oas.json     # API routes definition
│   └── policies.json       # Security policies
├── modules/
│   ├── agent-auth-proxy.ts # Main proxy logic
│   └── health-check.ts     # Health endpoint
├── schemas/                # JSON schemas
├── docs/                   # Documentation
├── tests/                  # Test files
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies
└── .env.example           # Environment template
```

## Troubleshooting

### Частые проблемы

1. **401 Unauthorized** - проверьте AGENT_SECRET_KEY
2. **403 Forbidden** - пользователь не найден в Supabase или нет LiteLLM ключа
3. **500 Internal Error** - проверьте конфигурацию Supabase/LiteLLM

### Логи

Все ошибки логируются с контекстом. Проверьте Zuplo dashboard для детальной информации.

## Contributing

1. Fork проект
2. Создайте feature branch
3. Commit изменения  
4. Push в branch
5. Создайте Pull Request

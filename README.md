# TokenRouter Node.js/TypeScript SDK

Official Node.js/TypeScript SDK for TokenRouter - an intelligent LLM routing service that automatically selects the most cost-effective model for your AI requests.

## Features

- 🚀 **OpenAI-Compatible Interface**: Drop-in replacement for OpenAI SDK
- 🎯 **Intelligent Routing**: Automatically routes to the best model based on your prompt
- 💰 **Cost Optimization**: Save up to 70% on LLM costs
- 🔄 **Multiple Providers**: Unified interface for OpenAI, Anthropic, Mistral, Together AI
- ⚡ **Streaming Support**: Real-time streaming responses
- 🔒 **Built-in Authentication**: Secure API key management
- 🔁 **Automatic Retries**: Resilient error handling
- 📊 **Analytics**: Track usage, costs, and performance
- 📝 **TypeScript Support**: Full type definitions included

## Installation

```bash
npm install @tokenrouter/sdk
# or
yarn add @tokenrouter/sdk
# or
pnpm add @tokenrouter/sdk
```

For development/local testing:
```bash
cd TokenRouterSDK/node
npm install
npm run build
npm link

# In your project
npm link @tokenrouter/sdk
```

## Quick Start

### Basic Usage

```javascript
import { TokenRouterClient } from '@tokenrouter/sdk';

// Initialize client
const client = new TokenRouterClient({
  apiKey: 'tr_your-api-key-here',
  baseUrl: 'https://api.tokenrouter.io' // or http://localhost:8000 for local
});

// Simple completion
const response = await client.chat.completions.create({
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
  model: 'auto', // Let TokenRouter choose the best model
  temperature: 0.7
});

console.log(response.choices[0].message.content);
console.log(`Cost: $${response.cost_usd}`);
console.log(`Model used: ${response.model}`);
```

### TypeScript Usage

```typescript
import { TokenRouterClient, ChatCompletionRequest, ChatCompletionResponse } from '@tokenrouter/sdk';

const client = new TokenRouterClient({
  apiKey: process.env.TOKENROUTER_API_KEY!,
  baseUrl: 'https://api.tokenrouter.io'
});

async function generateResponse(prompt: string): Promise<string> {
  const request: ChatCompletionRequest = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: prompt }
    ],
    model: 'auto',
    temperature: 0.7,
    max_tokens: 500
  };

  const response: ChatCompletionResponse = await client.chat.completions.create(request);
  return response.choices[0].message.content;
}
```

## Authentication

Get your API key from TokenRouter:

1. Sign up at [tokenrouter.io](https://tokenrouter.io)
2. Navigate to API Keys section
3. Create a new API key
4. Add to your environment:

```bash
export TOKENROUTER_API_KEY=tr_your-api-key-here
```

Then in your code:
```javascript
const client = new TokenRouterClient({
  apiKey: process.env.TOKENROUTER_API_KEY
});
```

## Core Features

### Automatic Model Selection

Let TokenRouter choose the best model for your use case:

```javascript
// TokenRouter analyzes your prompt and selects the optimal model
const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Write a haiku about coding' }],
  model: 'auto' // Automatic selection
});
```

### Model Preferences

Specify preferred models while still benefiting from fallback:

```javascript
const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Explain quantum computing' }],
  modelPreferences: ['gpt-4', 'claude-3-opus'], // Preference order
  maxTokens: 1000
});
```

### Streaming Responses

Stream responses for real-time output:

```javascript
const stream = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Tell me a story' }],
  model: 'auto',
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0]?.delta?.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

### Function Calling / Tools

Use OpenAI-compatible function calling:

```javascript
const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
  model: 'auto',
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    }
  }],
  tool_choice: 'auto'
});

// Handle tool calls in response
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    console.log(`Function: ${toolCall.function.name}`);
    console.log(`Arguments: ${toolCall.function.arguments}`);
  }
}
```

## Advanced Usage

### Custom Headers

Add custom headers to requests:

```javascript
const client = new TokenRouterClient({
  apiKey: 'tr_your-api-key',
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Timeout Configuration

Set custom timeout values:

```javascript
const client = new TokenRouterClient({
  apiKey: 'tr_your-api-key',
  timeout: 30000 // 30 seconds
});
```

### Error Handling

Comprehensive error handling:

```javascript
try {
  const response = await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'auto'
  });
} catch (error) {
  if (error.name === 'AuthenticationError') {
    console.error('Invalid API key');
  } else if (error.name === 'RateLimitError') {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  } else if (error.name === 'InvalidRequestError') {
    console.error('Invalid request:', error.message);
  } else if (error.name === 'APIConnectionError') {
    console.error('Connection error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Analytics & Monitoring

Track usage and costs:

```javascript
// Get usage analytics
const analytics = await client.getAnalytics();
console.log(`Total requests: ${analytics.totalRequests}`);
console.log(`Total cost: $${analytics.totalCostUsd}`);
console.log(`Average latency: ${analytics.averageLatencyMs}ms`);

// List available models
const models = await client.listModels();
models.forEach(model => {
  console.log(`${model.id}: ${model.provider}`);
});

// Get model costs
const costs = await client.getCosts();
console.log('Model pricing:', costs);
```

## API Methods

### Chat Completions

```javascript
client.chat.completions.create(options)
```

**Options:**
- `messages` (required): Array of message objects
- `model`: Model name or 'auto' for automatic selection
- `modelPreferences`: Array of preferred models
- `temperature`: Sampling temperature (0-2)
- `maxTokens`: Maximum tokens to generate
- `topP`: Nucleus sampling parameter
- `frequencyPenalty`: Frequency penalty (-2 to 2)
- `presencePenalty`: Presence penalty (-2 to 2)
- `stop`: Stop sequences
- `stream`: Enable streaming (boolean)
- `tools`: Function/tool definitions
- `toolChoice`: Tool selection strategy
- `responseFormat`: Response format specification
- `seed`: Seed for deterministic output
- `user`: User identifier for tracking

### Completions (Legacy)

```javascript
client.completions.create({
  prompt: 'Once upon a time',
  model: 'auto',
  maxTokens: 100
})
```

### Utility Methods

```javascript
// List available models
const models = await client.listModels();

// Get model pricing
const costs = await client.getCosts();

// Get usage analytics
const analytics = await client.getAnalytics();

// Health check
const health = await client.healthCheck();
```

## Environment Variables

```bash
# Required
TOKENROUTER_API_KEY=tr_your-api-key

# Optional
TOKENROUTER_BASE_URL=https://api.tokenrouter.io
TOKENROUTER_TIMEOUT=30000
TOKENROUTER_MAX_RETRIES=3
```

## Migration from OpenAI

TokenRouter SDK is designed as a drop-in replacement for OpenAI:

```javascript
// Before (OpenAI)
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: 'sk-...' });
const response = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'gpt-3.5-turbo'
});

// After (TokenRouter)
import { TokenRouterClient } from '@tokenrouter/sdk';
const client = new TokenRouterClient({ apiKey: 'tr_...' });
const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'auto' // or keep 'gpt-3.5-turbo'
});
```

## Best Practices

1. **Use 'auto' model**: Let TokenRouter optimize model selection
2. **Set appropriate timeouts**: Adjust based on expected response times
3. **Handle rate limits**: Implement exponential backoff for retries
4. **Monitor costs**: Use analytics to track spending
5. **Cache responses**: Cache frequently requested completions
6. **Use streaming**: For better UX in long responses
7. **Batch requests**: Group similar requests when possible

## Error Codes

| Error | Description | Action |
|-------|-------------|--------|
| `AuthenticationError` | Invalid or missing API key | Check API key |
| `RateLimitError` | Rate limit exceeded | Wait and retry |
| `InvalidRequestError` | Malformed request | Check request format |
| `APIConnectionError` | Network error | Check connection |
| `InternalServerError` | Server error | Retry with backoff |

## Examples

### Example: Content Generation

```javascript
async function generateBlogPost(topic) {
  const response = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a professional blog writer'
      },
      {
        role: 'user',
        content: `Write a 500-word blog post about ${topic}`
      }
    ],
    model: 'auto',
    temperature: 0.8,
    maxTokens: 1000
  });

  return response.choices[0].message.content;
}
```

### Example: Code Generation

```javascript
async function generateCode(description) {
  const response = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert programmer. Return only code without explanations.'
      },
      {
        role: 'user',
        content: description
      }
    ],
    model: 'auto',
    temperature: 0.2, // Lower temperature for code
    maxTokens: 2000
  });

  return response.choices[0].message.content;
}
```

### Example: Streaming Chat

```javascript
async function streamingChat() {
  const messages = [];
  
  while (true) {
    const userInput = await getUserInput();
    messages.push({ role: 'user', content: userInput });
    
    const stream = await client.chat.completions.create({
      messages,
      model: 'auto',
      stream: true
    });
    
    let assistantMessage = '';
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        assistantMessage += content;
        process.stdout.write(content);
      }
    }
    
    messages.push({ role: 'assistant', content: assistantMessage });
  }
}
```

## Support

- **Documentation**: [docs.tokenrouter.io](https://docs.tokenrouter.io)
- **GitHub Issues**: [github.com/tokenrouter/sdk-node/issues](https://github.com/tokenrouter/sdk-node/issues)
- **Email**: support@tokenrouter.io
- **Discord**: [discord.gg/tokenrouter](https://discord.gg/tokenrouter)

## License

MIT License - see [LICENSE](LICENSE) file for details.
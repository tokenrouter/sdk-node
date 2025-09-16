# TokenRouter Node.js SDK

OpenAI Responses API compatible client for TokenRouter - intelligent LLM routing service.

## Installation

```bash
npm install tokenrouter
```

## Quick Start

```javascript
import TokenRouter from "tokenrouter";

const client = new TokenRouter({
  apiKey: process.env['TOKENROUTER_API_KEY'], // This is the default and can be omitted
  baseUrl: process.env['TOKENROUTER_BASE_URL'], // Default: https://api.tokenrouter.io/api
});

const response = await client.responses.create({
    model: "gpt-4.1",
    input: "Tell me a three sentence bedtime story about a unicorn."
});

console.log(response.output_text);
```

## OpenAI Compatibility

This SDK is designed to be a drop-in replacement for OpenAI's SDK when using the Responses API. Simply change your import and API key:

```javascript
// Before (OpenAI)
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// After (TokenRouter)
import TokenRouter from "tokenrouter";
const client = new TokenRouter({ apiKey: process.env.TOKENROUTER_API_KEY });
```

## API Reference

### Create Response

```javascript
const response = await client.responses.create({
  // Required
  input: "Your prompt here", // or array of input items

  // Optional
  model: "gpt-4.1", // Model to use
  instructions: "System instructions",
  max_output_tokens: 1000,
  temperature: 0.7,
  top_p: 0.9,
  stream: false, // Set to true for streaming
  tools: [], // Function calling tools
  tool_choice: "auto",
  text: { format: { type: "text" } }, // Response format
  // ... other OpenAI-compatible parameters
});

// Access the response text directly
console.log(response.output_text);
```

### Streaming Responses

```javascript
const stream = await client.responses.create({
  input: "Write a poem",
  stream: true
});

for await (const event of stream) {
  if (event.type === 'response.delta' && event.delta?.output) {
    for (const item of event.delta.output) {
      if (item.content) {
        for (const content of item.content) {
          if (content.text) {
            process.stdout.write(content.text);
          }
        }
      }
    }
  }
}
```

### Function Calling

```javascript
const response = await client.responses.create({
  input: "What's the weather in San Francisco?",
  tools: [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" }
          },
          required: ["location"]
        }
      }
    }
  ]
});

// Check for function calls in the response
for (const item of response.output) {
  if (item.type === 'tool_call' && item.tool_calls) {
    for (const toolCall of item.tool_calls) {
      if (toolCall.function) {
        console.log(`Function: ${toolCall.function.name}`);
        console.log(`Arguments: ${toolCall.function.arguments}`);
      }
    }
  }
}
```

### Multi-turn Conversations

```javascript
// First message
const response1 = await client.responses.create({
  input: "My name is Alice",
  store: true // Store for later retrieval
});

// Continue conversation
const response2 = await client.responses.create({
  input: "What's my name?",
  previous_response_id: response1.id
});
```

### Other Methods

```javascript
// Get response by ID
const response = await client.responses.get("resp_123");

// Delete response
const result = await client.responses.delete("resp_123");

// Cancel background response
const response = await client.responses.cancel("resp_123");

// List input items
const items = await client.responses.listInputItems("resp_123");
```

## Error Handling

```javascript
import {
  TokenRouterError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError
} from 'tokenrouter';

try {
  const response = await client.responses.create({
    input: "Hello"
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  } else if (error instanceof InvalidRequestError) {
    console.error('Invalid request:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

### Environment Variables

```bash
export TOKENROUTER_API_KEY=tr_your-api-key
export TOKENROUTER_BASE_URL=https://api.tokenrouter.io/api  # Optional
```

### Client Options

```javascript
const client = new TokenRouter({
  apiKey: 'tr_...', // Your API key
  baseUrl: 'https://api.tokenrouter.io/api', // API base URL
  timeout: 60000, // Request timeout in ms (default: 60000)
  maxRetries: 3, // Max retry attempts (default: 3)
  headers: { // Additional headers
    'X-Custom-Header': 'value'
  }
});
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import TokenRouter, {
  ResponsesCreateParams,
  Response,
  ResponseStreamEvent
} from 'tokenrouter';

const params: ResponsesCreateParams = {
  input: "Hello",
  model: "gpt-4.1"
};

const response: Response = await client.responses.create(params);
```

## Examples

See the [examples](./examples) directory for more detailed usage examples:

- [simple.js](./examples/simple.js) - Basic usage
- [responses-example.ts](./examples/responses-example.ts) - Comprehensive examples

## License

MIT

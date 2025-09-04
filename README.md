# TokenRouter Node.js SDK

Official Node.js/TypeScript SDK for TokenRouter routing. This SDK exposes only the routing endpoints:
- client.create(...) → Native routing (/route)
- client.chat.completions.create(...) → OpenAI chat completions (/v1/chat/completions)
- client.completions.create(...) → OpenAI legacy completions (/v1/completions)

All calls are BYOK. Provide your TokenRouter API key; provider keys are configured in TokenRouter.

## Install

```bash
npm install tokenrouter
```

## Quick Start (Native Route)

```ts
import { TokenRouterClient } from 'tokenrouter';

const client = new TokenRouterClient({
  apiKey: process.env.TOKENROUTER_API_KEY!,
  baseUrl: 'https://api.tokenrouter.io',
});

const response = await client.create({
  model: 'auto',
  mode: 'balanced',
  model_preferences: ['gpt-4o', 'gpt-4o-mini'],
  messages: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
  // Optional: select key behavior
  // inline|stored|mixed|auto (default)
  key_mode: 'auto',
});

console.log(response.choices[0].message.content);
```

## Endpoints

### Native Route (/route)

Non‑streaming
```ts
const resp = await client.create({
  model: 'auto',
  mode: 'balanced',
  model_preferences: ['gpt-4o', 'gpt-4o-mini'],
  messages: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});
console.log(resp.choices[0].message.content);
```

Streaming
```ts
const stream = (await client.create({
  model: 'auto',
  stream: true,
  messages: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Stream a short greeting.' },
  ],
})) as AsyncIterable<any>;

for await (const chunk of stream) {
  const delta = chunk?.choices?.[0]?.delta;
  if (delta?.content) process.stdout.write(delta.content);
}
```

### Chat Completions (/v1/chat/completions)

OpenAI‑compatible chat completions.

```ts
const chat = await client.chat.completions.create({
  model: 'auto',
  mode: 'balanced',
  model_preferences: ['gpt-4o', 'gpt-4o-mini'],
  messages: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});
console.log(chat.choices[0].message.content);
```

Streaming
```ts
const chatStream = (await client.chat.completions.create({
  model: 'auto',
  stream: true,
  messages: [
    { role: 'developer', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
})) as AsyncIterable<any>;
for await (const chunk of chatStream) {
  const delta = chunk?.choices?.[0]?.delta;
  if (delta?.content) process.stdout.write(delta.content);
}
```

### Legacy Completions (/v1/completions)

Returns OpenAI legacy text completion JSON (raw dict).

```ts
const tc = await client.completions.create({
  prompt: 'Say this is a test',
  model: 'auto',
  mode: 'balanced',
});
console.log(tc.choices?.[0]?.text);

const tstream = (await client.completions.create({
  prompt: 'Stream text completion please',
  model: 'auto',
  stream: true,
})) as AsyncIterable<any>;
for await (const chunk of tstream) {
  const text = chunk?.choices?.[0]?.text;
  if (text) process.stdout.write(text);
}
```

## Errors

```ts
import { AuthenticationError, RateLimitError, InvalidRequestError, APIConnectionError } from 'tokenrouter';

try {
  const r = await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'auto',
  });
  console.log(r.choices[0].message.content);
} catch (e: any) {
  if (e instanceof RateLimitError) console.log('Retry after', e.retryAfter);
  else if (e instanceof AuthenticationError) console.log('Invalid API key');
  else if (e instanceof InvalidRequestError) console.log('Invalid request');
  else if (e instanceof APIConnectionError) console.log('Connection error');
  else console.log('Unexpected error', e);
}
```

## Environment

```bash
export TOKENROUTER_API_KEY=tr_your-api-key
# Optional
export TOKENROUTER_BASE_URL=https://api.tokenrouter.io

# Optional provider keys (auto-detected for inline encryption on native /route only)
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GEMINI_API_KEY=...
export MISTRAL_API_KEY=...
export DEEPSEEK_API_KEY=...
export META_API_KEY=...

# When `key_mode` is `inline`, `mixed`, or `auto` (native `/route` only), the SDK:
# - Auto-loads provider keys from your environment or local `.env` (dev/CI) with the names above
# - Fetches the API's public key from `/.well-known/tr-public-key`, encrypts keys client-side, and sends them in the `X-TR-Provider-Keys` header (not JSON)
# - Never persists or logs provider secrets

# Note: `key_mode` is not used on the OpenAI-compatible endpoints (`/v1/chat/completions`, `/v1/completions`).
```

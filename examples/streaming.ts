/**
 * Streaming example for TokenRouter SDK (TypeScript)
 */

import { TokenRouterClient, ChatCompletionChunk } from '@tokenrouter/sdk';

async function main() {
  // Initialize client
  const client = new TokenRouterClient({
    apiKey: process.env.TOKENROUTER_API_KEY || 'your-api-key',
    baseUrl: process.env.TOKENROUTER_BASE_URL || 'http://localhost:8000'
  });

  console.log('TokenRouter SDK - Streaming Example');
  console.log('='.repeat(50));
  console.log('\nStreaming a short story...\n');

  try {
    // Create a streaming chat completion
    const stream = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a creative writer' },
        { role: 'user', content: 'Write a very short story (3 sentences) about a robot learning to paint' }
      ],
      model: 'auto',
      stream: true,
      temperature: 0.8,
      max_tokens: 150
    }) as AsyncIterable<ChatCompletionChunk>;

    // Process the stream
    let fullResponse = '';
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        process.stdout.write(content);
        fullResponse += content;
      }
    }

    console.log('\n\n' + '='.repeat(50));
    console.log(`Total characters: ${fullResponse.length}`);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('\n\nStreaming interrupted by user');
    } else {
      console.error(`\nError during streaming: ${error.message}`);
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nInterrupted');
  process.exit(0);
});

main().catch(console.error);

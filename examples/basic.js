/**
 * Basic usage example for TokenRouter SDK (JavaScript)
 */

const { TokenRouterClient } = require('@tokenrouter/sdk');

async function main() {
  // Initialize client (uses TOKENROUTER_API_KEY from environment)
  const client = new TokenRouterClient({
    apiKey: process.env.TOKENROUTER_API_KEY || 'your-api-key',
    baseUrl: process.env.TOKENROUTER_BASE_URL || 'http://localhost:8000'
  });

  console.log('TokenRouter SDK - Basic Usage Examples');
  console.log('='.repeat(50));

  try {
    // Example 1: Native route completion
    console.log('\n1. Native Route Completion:');
    console.log('-'.repeat(30));
    const response1 = await client.create({
      model: 'auto',
      messages: [{ role: 'user', content: 'What is the capital of France?' }],
    });
    console.log(`Response: ${response1.choices[0].message.content}`);
    console.log(`Model used: ${response1.model}`);

    // Example 2: Chat completion
    console.log('\n2. Chat Completion:');
    console.log('-'.repeat(30));
    const response2 = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Explain photosynthesis in 2 sentences' }
      ],
      model: 'auto',
      temperature: 0.7
    });
    console.log(`Response: ${response2.choices[0].message.content}`);
    if (response2.costUsd) {
      console.log(`Cost: $${response2.costUsd.toFixed(6)}`);
    }
    if (response2.latencyMs) {
      console.log(`Latency: ${response2.latencyMs}ms`);
    }

    // Example 3: Legacy text completions
    console.log('\n3. Legacy Completions:');
    console.log('-'.repeat(30));
    const tcomp = await client.completions.create({
      prompt: 'Say this is a test',
      model: 'auto',
    });
    console.log('Text:', tcomp?.choices?.[0]?.text || '');

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Examples completed!');
}

main().catch(console.error);

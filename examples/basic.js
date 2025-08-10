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
    // Example 1: Simple completion
    console.log('\n1. Simple Completion:');
    console.log('-'.repeat(30));
    const response1 = await client.createCompletion('What is the capital of France?');
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

    // Example 3: Model preferences
    console.log('\n3. With Model Preferences:');
    console.log('-'.repeat(30));
    const response3 = await client.chat.completions.create({
      messages: [
        { role: 'user', content: 'Write a haiku about programming' }
      ],
      modelPreferences: ['claude-3-haiku', 'gpt-3.5-turbo'],
      maxTokens: 50
    });
    console.log(`Response: ${response3.choices[0].message.content}`);
    if (response3.routedModel) {
      console.log(`Routed to: ${response3.routedModel}`);
    }

    // Example 4: List available models
    console.log('\n4. Available Models:');
    console.log('-'.repeat(30));
    const models = await client.listModels();
    models.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id} (${model.provider})`);
      if (model.contextWindow) {
        console.log(`    Context: ${model.contextWindow.toLocaleString()} tokens`);
      }
    });

    // Example 5: Get costs
    console.log('\n5. Model Costs:');
    console.log('-'.repeat(30));
    const costs = await client.getCosts();
    Object.entries(costs).slice(0, 5).forEach(([model, cost]) => {
      console.log(`  - ${model}: $${cost.toFixed(6)}/1k tokens`);
    });

    // Example 6: Health check
    console.log('\n6. API Health Check:');
    console.log('-'.repeat(30));
    const health = await client.healthCheck();
    console.log(`  Status: ${health.status || 'Unknown'}`);
    if (health.providers) {
      console.log(`  Available providers: ${health.providers.join(', ')}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Examples completed!');
}

main().catch(console.error);
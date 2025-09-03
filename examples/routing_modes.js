/**
 * Example: Using routing modes with TokenRouter SDK
 * Demonstrates cost, quality, latency, and balanced routing strategies
 */

const { TokenRouterClient } = require('@tokenrouter/sdk');

// Initialize client
const client = new TokenRouterClient({
  apiKey: process.env.TOKENROUTER_API_KEY,
  baseUrl: process.env.TOKENROUTER_BASE_URL || 'http://localhost:8000'
});

async function demonstrateRoutingModes() {
  console.log('TokenRouter Routing Modes Example\n');
  
  const prompt = 'Write a haiku about programming';
  const messages = [{ role: 'user', content: prompt }];

  try {
    // 1. Cost-optimized routing (cheapest models)
    console.log('1. COST MODE - Prioritizes cheaper models:');
    const costResponse = await client.chat.completions.create({
      messages,
      mode: 'cost',
      max_tokens: 50
    });
    console.log(`   Model: ${costResponse.model}`);
    console.log(`   Cost: $${costResponse.costUsd || 0}`);
    console.log(`   Response: ${costResponse.choices[0].message.content}\n`);

    // 2. Quality-optimized routing (best models)
    console.log('2. QUALITY MODE - Prioritizes premium models:');
    const qualityResponse = await client.chat.completions.create({
      messages,
      mode: 'quality',
      max_tokens: 50
    });
    console.log(`   Model: ${qualityResponse.model}`);
    console.log(`   Cost: $${qualityResponse.costUsd || 0}`);
    console.log(`   Response: ${qualityResponse.choices[0].message.content}\n`);

    // 3. Latency-optimized routing (fastest models)
    console.log('3. LATENCY MODE - Prioritizes fast response times:');
    const latencyResponse = await client.chat.completions.create({
      messages,
      mode: 'latency',
      max_tokens: 50
    });
    console.log(`   Model: ${latencyResponse.model}`);
    console.log(`   Latency: ${latencyResponse.latencyMs}ms`);
    console.log(`   Response: ${latencyResponse.choices[0].message.content}\n`);

    // 4. Balanced routing (default - considers all factors)
    console.log('4. BALANCED MODE - Balances cost, quality, and speed:');
    const balancedResponse = await client.chat.completions.create({
      messages,
      mode: 'balanced',  // or omit for default
      max_tokens: 50
    });
    console.log(`   Model: ${balancedResponse.model}`);
    console.log(`   Cost: $${balancedResponse.costUsd || 0}`);
    console.log(`   Latency: ${balancedResponse.latencyMs}ms`);
    console.log(`   Response: ${balancedResponse.choices[0].message.content}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function streamingWithMode() {
  console.log('STREAMING WITH MODE EXAMPLE:\n');
  
  try {
    // Stream with cost mode
    const stream = await client.chat.completions.create({
      messages: [{ role: 'user', content: 'Tell me a joke' }],
      mode: 'cost',
      stream: true
    });

    console.log('Streaming response (cost mode):');
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function complexTaskWithMode() {
  console.log('COMPLEX TASK MODE SELECTION:\n');
  
  const tasks = [
    {
      prompt: 'What is 2+2?',
      suggestedMode: 'cost',
      reason: 'Simple question - use cheapest model'
    },
    {
      prompt: 'Write a detailed implementation of a binary search tree in Python',
      suggestedMode: 'quality',
      reason: 'Complex coding task - use best model'
    },
    {
      prompt: 'Translate "Hello" to French',
      suggestedMode: 'latency',
      reason: 'Quick translation - prioritize speed'
    },
    {
      prompt: 'Analyze the pros and cons of microservices architecture',
      suggestedMode: 'balanced',
      reason: 'Analytical task - balance all factors'
    }
  ];

  for (const task of tasks) {
    console.log(`Task: ${task.prompt}`);
    console.log(`Mode: ${task.suggestedMode} (${task.reason})`);
    
    try {
      const response = await client.chat.completions.create({
        messages: [{ role: 'user', content: task.prompt }],
        mode: task.suggestedMode,
        max_tokens: 100
      });
      
      console.log(`Model selected: ${response.model}`);
      console.log(`Response: ${response.choices[0].message.content.substring(0, 100)}...`);
      console.log(`Cost: $${response.cost_usd || 0} | Latency: ${response.latency_ms}ms\n`);
      
    } catch (error) {
      console.error(`Error: ${error.message}\n`);
    }
  }
}

// Run examples
(async () => {
  await demonstrateRoutingModes();
  await streamingWithMode();
  await complexTaskWithMode();
})();

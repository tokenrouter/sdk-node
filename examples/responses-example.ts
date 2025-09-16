/**
 * TokenRouter SDK - Responses API Example
 *
 * This example demonstrates using the TokenRouter SDK with the OpenAI Responses API format.
 * Just like OpenAI, you can simply change the import and API key to use TokenRouter.
 */

import TokenRouter from 'tokenrouter';

async function main() {
  // Initialize the client exactly like OpenAI
  const client = new TokenRouter({
    apiKey: process.env['TOKENROUTER_API_KEY'], // This is the default and can be omitted
    baseUrl: process.env['TOKENROUTER_BASE_URL'], // This is the default and can be omitted
  });

  // Example 1: Simple text generation
  console.log('Example 1: Simple text generation');
  const response = await client.responses.create({
    model: "gpt-4.1",
    input: "Tell me a three sentence bedtime story about a unicorn."
  });
  console.log(response.output_text);

  // Example 2: With system instructions
  console.log('\nExample 2: With system instructions');
  const response2 = await client.responses.create({
    model: "gpt-4.1",
    instructions: "You are a helpful assistant that always responds in haiku format.",
    input: "What is the meaning of life?"
  });
  console.log(response2.output_text);

  // Example 3: Using structured input with messages
  console.log('\nExample 3: Using structured input');
  const response3 = await client.responses.create({
    model: "gpt-4.1",
    input: [
      {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: "What's the weather like today?"
          }
        ]
      }
    ]
  });
  console.log(response3.output_text);

  // Example 4: Streaming responses
  console.log('\nExample 4: Streaming response');
  const stream = await client.responses.create({
    model: "gpt-4.1",
    input: "Write a short poem about coding",
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
  console.log('\n');

  // Example 5: Function calling
  console.log('\nExample 5: Function calling');
  const response5 = await client.responses.create({
    model: "gpt-4.1",
    input: "What's the weather in San Francisco?",
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather in a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA"
              },
              unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"]
              }
            },
            required: ["location"]
          }
        }
      }
    ]
  });

  // Check if the model called a function
  for (const item of response5.output) {
    if (item.type === 'tool_call' && item.tool_calls) {
      for (const toolCall of item.tool_calls) {
        if (toolCall.type === 'function' && toolCall.function) {
          console.log(`Function called: ${toolCall.function.name}`);
          console.log(`Arguments: ${toolCall.function.arguments}`);
        }
      }
    }
  }

  // Example 6: JSON response format
  console.log('\nExample 6: JSON response format');
  const response6 = await client.responses.create({
    model: "gpt-4.1",
    input: "List three benefits of exercise",
    text: {
      format: {
        type: "json_object"
      }
    }
  });
  console.log(response6.output_text);

  // Example 7: Temperature and sampling control
  console.log('\nExample 7: Temperature control');
  const response7 = await client.responses.create({
    model: "gpt-4.1",
    input: "Generate a creative name for a coffee shop",
    temperature: 0.9,
    top_p: 0.95
  });
  console.log(response7.output_text);

  // Example 8: Conversation state (multi-turn)
  console.log('\nExample 8: Multi-turn conversation');
  const firstResponse = await client.responses.create({
    model: "gpt-4.1",
    input: "My name is Alice and I love hiking.",
    store: true
  });
  console.log('First:', firstResponse.output_text);

  const secondResponse = await client.responses.create({
    model: "gpt-4.1",
    input: "What's my favorite activity?",
    previous_response_id: firstResponse.id
  });
  console.log('Second:', secondResponse.output_text);

  // Example 9: Getting a response by ID
  console.log('\nExample 9: Get response by ID');
  const retrievedResponse = await client.responses.get(firstResponse.id);
  console.log('Retrieved:', retrievedResponse.output_text);

  // Example 10: List input items
  console.log('\nExample 10: List input items');
  const inputItems = await client.responses.listInputItems(firstResponse.id);
  console.log('Input items count:', inputItems.data.length);
}

// Run the examples
main().catch(console.error);
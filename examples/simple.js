/**
 * Simple TokenRouter SDK Example
 *
 * This example shows the basic usage exactly as specified in the requirements.
 * You can run this with: node examples/simple.js
 */

import TokenRouter from "tokenrouter";

const client = new TokenRouter({
  apiKey: process.env['TOKENROUTER_API_KEY'], // This is the default and can be omitted
  baseUrl: process.env['TOKENROUTER_BASE_URL'], // This is the default and can be omitted
});

const response = await client.responses.create({
    model: "gpt-4.1",
    input: "Tell me a three sentence bedtime story about a unicorn."
});

console.log(response.output_text);
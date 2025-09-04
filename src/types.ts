/**
 * TypeScript type definitions for TokenRouter SDK
 */

export interface ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export interface UsageDetails {
  cached_tokens?: number;
  audio_tokens?: number;
  reasoning_tokens?: number;
  accepted_prediction_tokens?: number;
  rejected_prediction_tokens?: number;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: UsageDetails;
  completion_tokens_details?: UsageDetails;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  // content can be string or array of content blocks
  content?: any;
  name?: string;
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string | null;
  logprobs?: any;
}

export interface ChatCompletion {
  id: string;
  object: string; // 'chat.completion'
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: Usage;
  system_fingerprint?: string;
  // TokenRouter specific
  service_tier?: string;
  cost_usd?: number;
  latency_ms?: number;
  routed_model?: string;
  routed_provider?: string;
  prompt_type?: string;
  complexity?: number;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<ChatMessage>;
    finishReason?: string;
  }>;
  usage?: Usage;
}

export type RoutingMode = 'cost' | 'quality' | 'latency' | 'balanced';

export type KeyMode = 'inline' | 'stored' | 'mixed' | 'auto';

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string; // default 'auto'
  mode?: RoutingMode; // TokenRouter-only
  model_preferences?: string[]; // TokenRouter-only
  max_completion_tokens?: number | null;
  max_tokens?: number | null; // deprecated
  response_format?: Record<string, any> | null;
  stream?: boolean | null;
  temperature?: number | null;
  tool_choice?: string | ToolChoice | null;
  tools?: Tool[] | null;
  user?: string | null;
  // Additional OpenAI-compatible optional fields will be accepted and ignored by API
  [key: string]: any;
}

// Native route only
export interface NativeChatCompletionRequest extends ChatCompletionRequest {
  key_mode?: KeyMode | null;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: any;
  };
}

export interface ToolChoice {
  type: 'function';
  function: {
    name: string;
  };
}

export interface ResponseFormat {
  type: 'text' | 'json_object';
}

// Removed non-routing utility types per Request_1

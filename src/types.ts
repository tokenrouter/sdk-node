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

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content?: string;
  name?: string;
  functionCall?: FunctionCall;
  toolCalls?: ToolCall[];
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
  finishReason?: string;
  logprobs?: any;
}

export interface ChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: Usage;
  systemFingerprint?: string;
  costUsd?: number;
  latencyMs?: number;
  routedModel?: string;
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

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  stream?: boolean;
  n?: number;
  logprobs?: boolean;
  echo?: boolean;
  user?: string;
  modelPreferences?: string[];
  tools?: Tool[];
  toolChoice?: string | ToolChoice;
  responseFormat?: ResponseFormat;
  seed?: number;
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

export interface Model {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextWindow?: number;
  maxOutputTokens?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
}

export interface ModelCosts {
  [model: string]: number;
}

export interface Analytics {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  averageLatencyMs: number;
  modelDistribution: Record<string, number>;
  errorRate: number;
  cacheHitRate: number;
}

export interface HealthStatus {
  status: string;
  providers?: string[];
  timestamp?: string;
  [key: string]: any;
}
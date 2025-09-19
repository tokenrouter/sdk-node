/**
 * TypeScript type definitions for TokenRouter SDK
 * OpenAI Responses API compatible
 */

export interface ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

// Input Types
export interface ResponsesCreateParams {
  // Optional text or array of inputs
  input?: string | InputItem[];

  // System message
  instructions?: string;

  // Model configuration
  model?: string;

  // Generation parameters
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_logprobs?: number;

  // Streaming
  stream?: boolean;
  stream_options?: StreamOptions;

  // Tools and functions
  tools?: Tool[];
  tool_choice?: string | ToolChoice;
  parallel_tool_calls?: boolean;
  max_tool_calls?: number;

  // Response format
  text?: TextConfig;

  // Conversation state
  previous_response_id?: string;
  conversation?: string | ConversationRef;

  // Additional parameters
  background?: boolean;
  store?: boolean;
  include?: string[];
  metadata?: Record<string, string>;
  service_tier?: 'auto' | 'default' | 'flex' | 'priority';
  truncation?: 'auto' | 'disabled';
  reasoning?: ReasoningConfig;

  // Deprecated/replaced fields
  user?: string;
  safety_identifier?: string;
  prompt_cache_key?: string;
  prompt?: PromptRef;
}

export interface StreamOptions {
  include_usage?: boolean;
}

export interface InputItem {
  type: 'message' | 'function_result' | 'tool_result';
  id?: string;
  role?: 'system' | 'user' | 'assistant';
  content?: ContentItem[];
  name?: string;
  tool_call_id?: string;
  output?: string;
}

export interface ContentItem {
  type: 'input_text' | 'input_image' | 'input_audio';
  text?: string;
  image_url?: ImageUrl;
  audio?: AudioInput;
}

export interface ImageUrl {
  url: string;
  detail?: 'auto' | 'low' | 'high';
}

export interface AudioInput {
  data: string;
  format: 'mp3' | 'wav' | 'flac' | 'ogg' | 'pcm16';
}

export interface Tool {
  type: 'function' | 'web_search' | 'file_search' | 'code_interpreter' | 'computer';
  function?: FunctionDefinition;
  web_search?: WebSearchTool;
  file_search?: FileSearchTool;
  code_interpreter?: CodeInterpreterTool;
  computer?: ComputerTool;
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: any;
  strict?: boolean;
}

export interface WebSearchTool {
  max_results?: number;
}

export interface FileSearchTool {
  max_num_results?: number;
  ranking_options?: {
    score_threshold?: number;
    ranker?: string;
  };
}

export interface CodeInterpreterTool {
  files?: string[];
  resources?: {
    files?: string[];
  };
}

export interface ComputerTool {
  display_width?: number;
  display_height?: number;
  display_number?: number;
}

export type ToolChoice = 'none' | 'auto' | 'required' | {
  type: 'function';
  function: {
    name: string;
  };
};

export interface TextConfig {
  format?: ResponseFormat;
}

export interface ResponseFormat {
  type: 'text' | 'json_object' | 'json_schema';
  json_schema?: any;
}

export interface ConversationRef {
  id: string;
}

export interface ReasoningConfig {
  effort?: 'low' | 'medium' | 'high' | null;
}

export interface PromptRef {
  id: string;
  variables?: Record<string, any>;
}

// Response Types
export interface Response {
  id: string;
  object: 'response';
  created_at: number;
  status: 'completed' | 'failed' | 'in_progress' | 'cancelled' | 'queued' | 'incomplete';
  error?: ErrorDetail | null;
  incomplete_details?: IncompleteDetails | null;
  instructions?: string | null;
  max_output_tokens?: number | null;
  model: string;
  output: OutputItem[];
  output_text?: string; // SDK convenience property
  parallel_tool_calls: boolean;
  previous_response_id?: string | null;
  reasoning?: ReasoningOutput;
  store: boolean;
  temperature: number;
  text?: TextConfig;
  tool_choice: string | ToolChoice;
  tools: Tool[];
  top_p: number;
  truncation: string;
  usage?: Usage;
  user?: string | null;
  metadata?: Record<string, string>;
  service_tier?: string;
  conversation?: ConversationRef;
  max_tool_calls?: number;
  safety_identifier?: string;
  prompt_cache_key?: string;
}

export interface OutputItem {
  type: 'message' | 'tool_call' | 'reasoning';
  id: string;
  status?: 'completed' | 'failed' | 'incomplete';
  role?: 'assistant' | 'system';
  content?: OutputContent[];
  tool_calls?: ToolCallOutput[];
  encrypted_content?: string;
}

export interface OutputContent {
  type: 'output_text' | 'output_audio';
  text?: string;
  annotations?: any[];
  audio?: AudioOutput;
}

export interface AudioOutput {
  data: string;
  format: string;
  sample_rate: number;
}

export interface ToolCallOutput {
  id: string;
  type: 'function' | 'web_search' | 'file_search' | 'code_interpreter' | 'computer';
  function?: {
    name: string;
    arguments: string;
  };
  web_search?: any;
  file_search?: any;
  code_interpreter?: any;
  computer?: any;
}

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface IncompleteDetails {
  reason: string;
}

export interface ReasoningOutput {
  effort?: string | null;
  summary?: string | null;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_tokens_details?: {
    cached_tokens?: number;
    audio_tokens?: number;
  };
  output_tokens_details?: {
    reasoning_tokens?: number;
    audio_tokens?: number;
  };
}

// Streaming Types
export interface ResponseStreamEvent {
  type: string;
  response?: Response;
  delta?: ResponseDelta;
  error?: ErrorDetail;
  metadata?: Record<string, unknown>;
  event_id?: string;
  rate_limits?: Record<string, unknown>[];
  data?: unknown;
  raw?: unknown;
  timestamp?: number;
}

export interface ResponseDelta {
  id?: string;
  status?: string;
  output?: OutputItemDelta[];
  usage?: Usage;
}

export interface OutputItemDelta {
  index: number;
  type?: string;
  id?: string;
  role?: string;
  content?: OutputContentDelta[];
  tool_calls?: ToolCallDelta[];
}

export interface OutputContentDelta {
  index: number;
  type?: string;
  text?: string;
  audio?: AudioOutputDelta;
}

export interface AudioOutputDelta {
  data?: string;
}

export interface ToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

// List response for input items endpoint
export interface InputItemsList {
  object: 'list';
  data: InputItem[];
  first_id?: string;
  last_id?: string;
  has_more: boolean;
}

/**
 * TokenRouter SDK Client
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import EventSource from 'eventsource';
import {
  ClientOptions,
  ChatCompletionRequest,
  ChatCompletion,
  ChatCompletionChunk,
  Model,
  ModelCosts,
  Analytics,
  HealthStatus,
  ChatMessage,
} from './types';
import {
  TokenRouterError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  APIConnectionError,
  APIStatusError,
  TimeoutError,
  QuotaExceededError,
} from './errors';
import { VERSION } from './version';

export class TokenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private client: AxiosInstance;

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.TOKENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new AuthenticationError(
        'API key is required. Set TOKENROUTER_API_KEY environment variable or pass apiKey parameter.'
      );
    }

    this.baseUrl = (
      options.baseUrl ||
      process.env.TOKENROUTER_BASE_URL ||
      'http://localhost:8000'
    ).replace(/\/$/, '');
    this.timeout = options.timeout || 60000;
    this.maxRetries = options.maxRetries || 3;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `tokenrouter-node/${VERSION}`,
      ...options.headers,
    };

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response) {
          this.handleResponseError(error.response);
        } else if (error.request) {
          throw new APIConnectionError('Connection failed: ' + error.message);
        } else {
          throw new TokenRouterError('Request failed: ' + error.message);
        }
      }
    );
  }

  /**
   * Convert axios headers to Record<string, string>
   */
  private convertHeaders(headers: any): Record<string, string> | undefined {
    if (!headers) return undefined;
    
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        result[key] = value;
      } else if (value != null) {
        result[key] = String(value);
      }
    }
    return result;
  }

  private handleResponseError(response: AxiosResponse): void {
    const status = response.status;
    const data = response.data;
    const message = data?.detail || data?.error || response.statusText;
    const headers = this.convertHeaders(response.headers);

    switch (status) {
      case 401:
        throw new AuthenticationError(message, status, data, headers);
      case 429:
        const retryAfter = response.headers['retry-after'];
        throw new RateLimitError(
          message,
          status,
          data,
          headers,
          retryAfter ? parseInt(retryAfter) : undefined
        );
      case 400:
        throw new InvalidRequestError(message, status, data, headers);
      case 403:
        if (message.toLowerCase().includes('quota')) {
          throw new QuotaExceededError(message, status, data, headers);
        }
        throw new AuthenticationError(message, status, data, headers);
      default:
        if (status >= 500) {
          throw new APIStatusError(message, status, data, headers);
        }
        throw new TokenRouterError(message, status, data, headers);
    }
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any,
    params?: any,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await this.client.request({
        method,
        url: path,
        data,
        params,
      });
      return response.data;
    } catch (error: any) {
      if (
        retryCount < this.maxRetries &&
        error instanceof APIStatusError &&
        error.statusCode &&
        error.statusCode >= 500
      ) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.request(method, path, data, params, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>> {
    if (request.stream) {
      return this.streamChatCompletion(request);
    }

    const payload = {
      ...request,
      model: request.model || 'auto',
    };

    return this.request<ChatCompletion>('POST', '/v1/chat/completions', payload);
  }

  /**
   * Stream a chat completion
   */
  private async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncIterable<ChatCompletionChunk> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIStatusError(error, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new TokenRouterError('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const chunk = JSON.parse(data) as ChatCompletionChunk;
            yield chunk;
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  }

  /**
   * Simple completion interface
   */
  async createCompletion(prompt: string, model = 'auto'): Promise<ChatCompletion> {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    return this.createChatCompletion({ messages, model }) as Promise<ChatCompletion>;
  }

  /**
   * List available models
   */
  async listModels(): Promise<Model[]> {
    const response = await this.request<{ models: Model[] }>('GET', '/models');
    return response.models || [];
  }

  /**
   * Get model costs
   */
  async getCosts(): Promise<ModelCosts> {
    return this.request<ModelCosts>('GET', '/costs');
  }

  /**
   * Get analytics
   */
  async getAnalytics(): Promise<Analytics> {
    return this.request<Analytics>('GET', '/analytics');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthStatus> {
    return this.request<HealthStatus>('GET', '/health');
  }

  /**
   * OpenAI-compatible chat namespace
   */
  chat = {
    completions: {
      create: (request: ChatCompletionRequest) => this.createChatCompletion(request),
    },
  };
}

/**
 * Async client (alias for compatibility)
 */
export class TokenRouterAsyncClient extends TokenRouterClient {
  // All methods are already async in the base class
}
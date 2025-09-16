/**
 * TokenRouter SDK Client
 * OpenAI Responses API Compatible
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import {
  ClientOptions,
  ResponsesCreateParams,
  Response,
  ResponseStreamEvent,
  InputItemsList,
} from './types';
import {
  TokenRouterError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
  APIConnectionError,
  APIStatusError,
  QuotaExceededError,
} from './errors';
import { VERSION } from './version';

export class TokenRouter {
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
      'https://api.tokenrouter.io/api'
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
    retryCount = 0,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    try {
      const response = await this.client.request({
        method,
        url: path,
        data,
        params,
        headers: extraHeaders ? { ...(this.client.defaults.headers.common as any), ...extraHeaders } : undefined,
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
        return this.request(method, path, data, params, retryCount + 1, extraHeaders);
      }
      throw error;
    }
  }

  /**
   * Extract text from response output
   */
  private extractOutputText(response: Response): string {
    const texts: string[] = [];
    for (const item of response.output || []) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text' && content.text) {
            texts.push(content.text);
          }
        }
      }
    }
    return texts.join('');
  }

  /**
   * OpenAI-compatible responses namespace
   */
  responses = {
    /**
     * Create a model response
     */
    create: async (params: ResponsesCreateParams): Promise<Response | AsyncIterable<ResponseStreamEvent>> => {
      if (params.stream) {
        return this.streamResponse(params);
      }

      const response = await this.request<Response>('POST', '/v1/responses', params);

      // Add convenience property output_text
      if (response) {
        response.output_text = this.extractOutputText(response);
      }

      return response;
    },

    /**
     * Get a model response by ID
     */
    get: async (responseId: string, params?: {
      include?: string[];
      include_obfuscation?: boolean;
      starting_after?: number;
      stream?: boolean;
    }): Promise<Response | AsyncIterable<ResponseStreamEvent>> => {
      if (params?.stream) {
        return this.streamResponseGet(responseId, params);
      }

      const response = await this.request<Response>('GET', `/v1/responses/${responseId}`, undefined, params);

      // Add convenience property output_text
      if (response) {
        response.output_text = this.extractOutputText(response);
      }

      return response;
    },

    /**
     * Delete a model response
     */
    delete: async (responseId: string): Promise<{ id: string; object: string; deleted: boolean }> => {
      return this.request('DELETE', `/v1/responses/${responseId}`);
    },

    /**
     * Cancel a background response
     */
    cancel: async (responseId: string): Promise<Response> => {
      const response = await this.request<Response>('POST', `/v1/responses/${responseId}/cancel`);

      // Add convenience property output_text
      if (response) {
        response.output_text = this.extractOutputText(response);
      }

      return response;
    },

    /**
     * List input items for a response
     */
    listInputItems: async (responseId: string, params?: {
      after?: string;
      include?: string[];
      limit?: number;
      order?: 'asc' | 'desc';
    }): Promise<InputItemsList> => {
      return this.request('GET', `/v1/responses/${responseId}/input_items`, undefined, params);
    }
  };

  /**
   * Stream a response creation
   */
  private async *streamResponse(
    params: ResponsesCreateParams
  ): AsyncIterable<ResponseStreamEvent> {
    const url = `${this.baseUrl}/v1/responses`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...params, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIStatusError(error, response.status);
    }

    yield* this.parseSSEStream(response);
  }

  /**
   * Stream a response get
   */
  private async *streamResponseGet(
    responseId: string,
    params?: any
  ): AsyncIterable<ResponseStreamEvent> {
    const url = `${this.baseUrl}/v1/responses/${responseId}`;
    const queryParams = new URLSearchParams({ ...params, stream: 'true' });
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'text/event-stream',
    };

    const response = await fetch(`${url}?${queryParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIStatusError(error, response.status);
    }

    yield* this.parseSSEStream(response);
  }

  /**
   * Parse Server-Sent Events stream
   */
  private async *parseSSEStream(response: globalThis.Response): AsyncIterable<ResponseStreamEvent> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new TokenRouterError('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.startsWith('event: ')) {
            // Handle event type if needed
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const event = JSON.parse(data) as ResponseStreamEvent;

              // Add convenience property output_text for completed responses
              if (event?.type === 'response.completed' && event?.response) {
                event.response.output_text = this.extractOutputText(event.response);
              }

              yield event;
            } catch (e) {
              // Ignore parsing errors
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Default export for OpenAI compatibility
 */
export default TokenRouter;
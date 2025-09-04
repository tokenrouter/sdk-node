/**
 * TokenRouter SDK Client
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import crypto from 'crypto';
import {
  ClientOptions,
  ChatCompletionRequest,
  NativeChatCompletionRequest,
  ChatCompletion,
  ChatCompletionChunk,
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
  private trPublicKeyPem?: string;

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
      'https://api.tokenrouter.io'
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

  /** Load provider keys from env/.env (dev/CI convenience) */
  private loadEnvProviderKeys(): Record<string, string> {
    const keys: Record<string, string> = {};
    // Simple .env loader (non-invasive)
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const l = line.trim();
          if (!l || l.startsWith('#') || !l.includes('=')) continue;
          const [k, ...rest] = l.split('=');
          const v = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[k]) process.env[k] = v;
        }
      }
    } catch (_) {}

    const mapping: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      google: process.env.GEMINI_API_KEY, // gemini -> google
      meta: process.env.META_API_KEY,
    };
    for (const [k, v] of Object.entries(mapping)) {
      if (v) keys[k] = v;
    }
    return keys;
  }

  private async fetchPublicKey(): Promise<string> {
    if (this.trPublicKeyPem) return this.trPublicKeyPem;
    const resp = await this.client.get('/.well-known/tr-public-key');
    const pem = resp.data?.public_key_pem;
    if (!pem) throw new APIConnectionError('Failed to obtain public key');
    this.trPublicKeyPem = pem;
    return pem;
  }

  private b64url(input: Buffer): string {
    return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private buildSecureHeaders(keyMode?: string | null): Record<string, string> {
    const mode = (keyMode || 'auto').toLowerCase();
    if (mode === 'stored') return {};
    const providerKeys = this.loadEnvProviderKeys();
    if (!providerKeys || Object.keys(providerKeys).length === 0) return {};

    // Normalize provider names
    const norm: Record<string, string> = {};
    for (const [k, v] of Object.entries(providerKeys)) {
      if (!v) continue;
      const key = k.toLowerCase() === 'gemini' ? 'google' : k.toLowerCase() === 'llama' ? 'meta' : k.toLowerCase();
      norm[key] = v;
    }

    const plaintext = Buffer.from(JSON.stringify(norm));
    // AES-256-GCM encrypt
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    // RSA-OAEP-256 encrypt AES key
    const pubPem = this.trPublicKeyPem;
    const encryptKey = (buf: Buffer) => {
      return crypto.publicEncrypt(
        {
          key: pubPem!,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        buf
      );
    };

    if (!pubPem) throw new APIConnectionError('Public key unavailable');
    const ek = encryptKey(aesKey);

    const wrapper = {
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      ek: this.b64url(ek),
      iv: this.b64url(iv),
      ct: this.b64url(ct),
      tag: this.b64url(tag),
    };
    const wrapperJson = Buffer.from(JSON.stringify(wrapper));
    const headerValue = this.b64url(wrapperJson);
    // Best-effort zeroize
    aesKey.fill(0);
    plaintext.fill(0);
    return { 'X-TR-Provider-Keys': headerValue };
  }

  /** Create chat completion (POST /v1/chat/completions) */
  async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>> {
    const payload = { ...request, model: request.model || 'auto' };
    if (payload.stream) return this.streamChatCompletion(payload);
    return this.request<ChatCompletion>('POST', '/v1/chat/completions', payload);
  }

  /** Native TokenRouter create (POST /route) */
  async create(
    request: NativeChatCompletionRequest
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>> {
    const payload = { ...request, model: request.model || 'auto' };
    if (!this.trPublicKeyPem) {
      try { await this.fetchPublicKey(); } catch (_) {}
    }
    if (payload.stream) return this.streamCreate(payload);
    const extraHeaders = this.buildSecureHeaders(payload.key_mode);
    return this.request<ChatCompletion>('POST', '/route', payload, undefined, 0, extraHeaders);
  }

  /**
   * Stream a chat completion
   */
  private async *streamChatCompletion(
    request: ChatCompletionRequest
  ): AsyncIterable<ChatCompletionChunk> {
    const url = `${this.baseUrl}/v1/chat/completions`;
    const headers: Record<string, string> = {
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
   * Stream native create (/route)
   */
  private async *streamCreate(
    request: NativeChatCompletionRequest
  ): AsyncIterable<ChatCompletionChunk> {
    const url = `${this.baseUrl}/route`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    try {
      if (!this.trPublicKeyPem) await this.fetchPublicKey();
      Object.assign(headers, this.buildSecureHeaders(request.key_mode));
    } catch (_) {}

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

  // Removed shorthand helpers per Request_1

  /**
   * OpenAI legacy completions: client.completions.create
   */
  private async *streamCompletions(
    payload: any
  ): AsyncIterable<any> {
    const url = `${this.baseUrl}/v1/completions`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, stream: true }),
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
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data);
          } catch (e) {
            // ignore
          }
        }
      }
    }
  }

  // Removed utilities per Request_1

  /**
   * OpenAI-compatible chat namespace
   */
  chat = {
    completions: {
      create: (request: ChatCompletionRequest) => this.createChatCompletion(request),
    },
  };

  completions = {
    create: async (request: { prompt: string; model?: string; mode?: string; model_preferences?: string[]; stream?: boolean; [k: string]: any }) => {
      const payload = {
        model: request.model || 'auto',
        // prompt: request.prompt,
        mode: request.mode,
        model_preferences: request.model_preferences,
        ...request,
      };
      if (payload.stream) return this.streamCompletions(payload);
      return this.request<any>('POST', '/v1/completions', payload);
    },
  };
}

/**
 * Async client (alias for compatibility)
 */
export class TokenRouterAsyncClient extends TokenRouterClient {
  // All methods are already async in the base class
}

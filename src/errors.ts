/**
 * Error classes for TokenRouter SDK
 */

export class TokenRouterError extends Error {
  public statusCode?: number;
  public response?: any;
  public headers?: Record<string, string>;

  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message);
    this.name = 'TokenRouterError';
    this.statusCode = statusCode;
    this.response = response;
    this.headers = headers;
  }
}

export class AuthenticationError extends TokenRouterError {
  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message, statusCode, response, headers);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends TokenRouterError {
  public retryAfter?: number;

  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>,
    retryAfter?: number
  ) {
    super(message, statusCode, response, headers);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class InvalidRequestError extends TokenRouterError {
  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message, statusCode, response, headers);
    this.name = 'InvalidRequestError';
  }
}

export class APIConnectionError extends TokenRouterError {
  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message, statusCode, response, headers);
    this.name = 'APIConnectionError';
  }
}

export class APIStatusError extends TokenRouterError {
  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message, statusCode, response, headers);
    this.name = 'APIStatusError';
  }
}

export class TimeoutError extends TokenRouterError {
  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message, statusCode, response, headers);
    this.name = 'TimeoutError';
  }
}

export class QuotaExceededError extends TokenRouterError {
  constructor(
    message: string,
    statusCode?: number,
    response?: any,
    headers?: Record<string, string>
  ) {
    super(message, statusCode, response, headers);
    this.name = 'QuotaExceededError';
  }
}

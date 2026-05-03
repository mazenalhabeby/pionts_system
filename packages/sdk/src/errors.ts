/**
 * Base error class for Pionts SDK errors.
 */
export class PiontsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: unknown,
  ) {
    super(message);
    this.name = 'PiontsError';
  }
}

/**
 * Thrown when a request times out.
 */
export class PiontsTimeoutError extends PiontsError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, 0);
    this.name = 'PiontsTimeoutError';
  }
}

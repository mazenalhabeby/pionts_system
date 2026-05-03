import * as crypto from 'crypto';

/**
 * Utility for verifying Pionts webhook signatures.
 *
 * @example
 * ```typescript
 * const isValid = PiontsWebhook.verify(rawBody, signature, webhookSecret);
 * if (!isValid) throw new Error('Invalid webhook signature');
 * ```
 */
export class PiontsWebhook {
  /**
   * Verify a webhook signature using HMAC-SHA256.
   *
   * @param rawBody - The raw request body as string or Buffer
   * @param signature - The signature from the `X-Pionts-Signature` header (format: `sha256=<hex>`)
   * @param secret - The webhook secret for this endpoint
   * @returns true if the signature is valid
   */
  static verify(
    rawBody: string | Buffer,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature || !secret) return false;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    // Support both "sha256=<hex>" and raw "<hex>" formats
    const provided = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    if (expected.length !== provided.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(provided, 'hex'),
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { env } from '../config/env';

@Injectable()
export class TurnstileService {
  private readonly log = new Logger('Turnstile');

  /** Verifies a Cloudflare Turnstile token. In development without a secret, verification is skipped. */
  async verify(token: string | null | undefined, ip: string): Promise<boolean> {
    const secret = env().TURNSTILE_SECRET;
    if (!secret) return env().NODE_ENV !== 'production';
    if (!token) return false;
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
        signal: AbortSignal.timeout(6000),
      });
      const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
      if (!data.success) this.log.warn(`Rejected: ${data['error-codes']?.join(',')}`);
      return data.success;
    } catch (e) {
      this.log.error(`Turnstile unreachable: ${String(e)}`);
      return false;
    }
  }
}

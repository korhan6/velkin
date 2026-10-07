import type en from './messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof en;
  }
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

export {};

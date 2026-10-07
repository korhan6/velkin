import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Detects Accept-Language on first visit, then honours the NEXT_LOCALE cookie set by the switcher.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

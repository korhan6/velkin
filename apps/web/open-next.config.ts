import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Pages are re-rendered on demand and cached by fetch() revalidation (CMS data every 5 min).
// For full ISR persistence across deploys, add an R2 incremental cache:
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig();

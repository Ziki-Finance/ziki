import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// CR-002: Workers Free plan. Pages built at build time are served from the static assets.
// No R2 or KV cache, so ISR revalidation does not persist between requests.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});

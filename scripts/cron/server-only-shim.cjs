/**
 * Lets Node scripts import server modules (INF-CR-006). `server-only` throws
 * unless the bundler sets the react-server condition, and setting that
 * condition on plain Node breaks React. Vitest aliases it the same way.
 * Load with: tsx --require ./scripts/cron/server-only-shim.cjs <script>
 */
const id = require.resolve("server-only");
require.cache[id] = { id, filename: id, loaded: true, exports: {} };

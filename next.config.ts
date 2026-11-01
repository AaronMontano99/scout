import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // sql.js loads its .wasm binary via fs at runtime — don't let Next's
  // bundler try to process it. See src/db/client.ts, docs/LOCAL_MODE.md.
  serverExternalPackages: ['sql.js'],
  // Read from disk at runtime, so the hosted demo has to ship them.
  outputFileTracingIncludes: { '/**': ['./db/schema.sql', './node_modules/sql.js/dist/sql-wasm.wasm'] },
};

export default nextConfig;

import type { NextConfig } from 'next';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

function loadBuildId(): string {
  const envFile = path.join(process.cwd(), '.env.build');
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, 'utf8').match(/^NEXT_PUBLIC_BUILD_ID=(.+)$/m);
    if (line?.[1]) return line[1].trim();
  }
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    'development'
  );
}

const buildId = loadBuildId();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;

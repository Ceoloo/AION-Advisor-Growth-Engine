/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TypeScript; let Next transpile them.
  transpilePackages: [
    '@aion/ai',
    '@aion/analytics',
    '@aion/auth',
    '@aion/clients',
    '@aion/compliance',
    '@aion/database',
    '@aion/ghl',
    '@aion/integrations',
    '@aion/observability',
    '@aion/scheduling',
    '@aion/scorecard',
    '@aion/shared',
    '@aion/types',
    '@aion/ui',
    '@aion/workflows',
  ],
  webpack: (config) => {
    // Ensure ESM ".js" specifiers inside our TS packages resolve to ".ts"/".tsx".
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;

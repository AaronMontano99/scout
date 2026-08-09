import nextConfig from 'eslint-config-next';

const restrictedSupabaseImport = {
  rules: {
    // Domain layer must never import a vendor SDK directly — see
    // docs/ARCHITECTURE.md and docs/AI_ARCHITECTURE.md. src/db/client.ts
    // is the one designated place allowed to do this (see below).
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@supabase/supabase-js', '@supabase/ssr'],
            message:
              'Import the Supabase client via src/db or src/auth, not directly — see docs/SECURITY.md and ADR-0002.',
          },
        ],
      },
    ],
  },
};

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'dist/**'] },
  ...nextConfig,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/db/client.ts'],
    ...restrictedSupabaseImport,
  },
];

export default eslintConfig;

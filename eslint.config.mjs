import nextConfig from 'eslint-config-next';

const restrictedDbImport = {
  rules: {
    // Domain layer must never import a DB driver directly — see
    // docs/ARCHITECTURE.md and docs/LOCAL_MODE.md. src/db/client.ts
    // is the one designated place allowed to do this (see below).
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['sql.js'],
            message: 'Import the SQLite connection via src/db (getDb()), not directly — see docs/LOCAL_MODE.md.',
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
    // tests/db-schema.test.ts deliberately opens its own throwaway
    // connection (not via getDb()) so it never touches the real dev
    // database — see that file's header comment.
    ignores: ['src/db/client.ts', 'tests/db-schema.test.ts'],
    ...restrictedDbImport,
  },
];

export default eslintConfig;

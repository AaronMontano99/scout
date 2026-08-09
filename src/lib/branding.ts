/**
 * Single source of truth for user-facing product identity.
 *
 * "Scout" is a working name and will likely change — see
 * docs/PRODUCT_CONSTITUTION.md §Naming. No other file should hardcode
 * a product name string for anything user-facing; import from here.
 * Database schema, routes, env vars, and service names deliberately do
 * NOT reference this name, so a rebrand never touches infrastructure.
 */
export const PRODUCT_NAME = 'Scout';
export const PRODUCT_TAGLINE =
  'Know who to call, why, and what your company already knows.';
export const SUPPORT_EMAIL = 'support@example.com'; // placeholder — replace when domain is chosen

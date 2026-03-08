/**
 * Sigma Config Template
 *
 * This template shows the structure the /converge-test skill generates
 * when setting up tests in a user's project. The skill creates or updates
 * this file in the project root.
 *
 * Usage:
 *   1. Copy this to your project root as `sigma.config.ts`
 *   2. Update the test entries to match your .sigma files
 *   3. Run: npx sigmascript test --plan converge
 */
import type { SigmaConfig } from '@testsigmainc/sigmascript';

const config: SigmaConfig = {
  project: {
    baseDir: '.',
    patterns: ['tests/converge/**/*.sigma'],
    platform: 'web',
  },

  browser: {
    type: 'chromium',
    headless: true,
    timeout: 30000,
  },

  screenshots: {
    dir: 'screenshots',
    onFailure: true,
    onSuccess: false,
  },

  plans: [
    {
      name: 'converge',
      description: 'Converge-generated acceptance tests',
      tests: [
        // Each entry maps to a .sigma file.
        // `id` should match the `main_tree_to_execute` in the .sigma file.
        {
          id: 'LoginFlowTest',
          description: 'Login page renders, validates, and authenticates',
          file: 'tests/converge/login-flow.sigma',
        },
        {
          id: 'ContactFormTest',
          description: 'Contact form validates and submits',
          file: 'tests/converge/contact-form.sigma',
        },
      ],
    },
  ],

  defaultPlan: 'converge',
  timeout: 60000,
  failFast: false,
  retries: 0,
};

export default config;

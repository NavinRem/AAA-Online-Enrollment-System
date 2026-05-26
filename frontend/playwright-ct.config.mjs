import { defineConfig, devices } from '@playwright/experimental-ct-vue';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import process from 'node:process';
import crypto from 'node:crypto';

// Polyfill crypto.hash for Node 18 compatibility with Vite 7 / plugin-vue 6
if (!crypto.hash) {
  crypto.hash = (algorithm, data, outputEncoding) => {
    return crypto.createHash(algorithm).update(data).digest(outputEncoding || 'hex');
  };
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/components',
  testMatch: /.*\.spec\.m?js/,
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    ctViteConfig: {
      plugins: [vue()],
      resolve: {
        alias: {
          '@/firebase': fileURLToPath(new URL('./playwright/mock-firebase.js', import.meta.url)),
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
      define: {
        'import.meta.env.VITE_FIREBASE_API_KEY': '"AIzaSyBabcdefghijklmnopqrstuvwxyz12345"',
        'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': '"mock-domain.firebaseapp.com"',
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': '"mock-project"',
        'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': '"mock-project.appspot.com"',
        'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': '"1234567890"',
        'import.meta.env.VITE_FIREBASE_APP_ID': '"1:1234567890:web:1234567890abcdef"',
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

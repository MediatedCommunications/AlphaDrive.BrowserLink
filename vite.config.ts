import { crx, defineManifest } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

const manifest = defineManifest({
  manifest_version: 3,
  name: 'Faster Suite Browser Link',
  version: '25.01.05.1926',
  description:
    'Open documents straight from Clio, get free PACER looks, and much, much more.',
  permissions: ['storage', 'notifications', 'tabs', 'cookies', 'activeTab'],
  host_permissions: [
    '*://app.clio.com/*',
    '*://au.app.clio.com/*',
    '*://eu.app.clio.com/*',
    '*://*.courtlistener.com/*',
    '*://*.uscourts.gov/*',
  ],
  action: {
    default_popup: 'index.html',
  },
  background: { service_worker: 'src/background/index.ts' },
  content_scripts: [
    {
      matches: [
        'https://app.clio.com/*',
        'https://app.goclio.eu/*',
        'https://*.app.clio.com/*',
        'https://*.app.goclio.eu/*',
      ],
      js: ['src/content/clio.ts'],
      run_at: 'document_end',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/*'],
      matches: [],
    },
  ],
  icons: {
    128: 'src/assets/images/icon-0128-disabled.png',
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

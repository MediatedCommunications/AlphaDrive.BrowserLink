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
    {
      matches: ['https://www.courtlistener.com/*'],
      js: ['src/assets/js/install_notifier.js'],
      run_at: 'document_idle',
    },
    {
      matches: ['*://*.uscourts.gov/*'],
      include_globs: ['*://ecf.*', '*://ecf-train.*', '*://pacer.*'],
      css: ['src/assets/css/style.css', 'src/assets/css/font-awesome.min.css'],
      js: [
        'src/assets/js/jquery-3.2.1.js',
        'src/assets/js/FileSaver.js',
        'src/assets/js/moment.js',
        'src/assets/js/livestamp.js',
        'src/assets/js/utils.js',
        'src/assets/js/notifier.js',
        'src/assets/js/toolbar_button.js',
        'src/assets/js/pacer.js',
        'src/assets/js/recap.js',
        'src/assets/js/content_delegate.js',
        'src/assets/js/content.js',
      ],
      run_at: 'document_end',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['/src/assets/*', '/assets/*'],
      matches: [
        '*://*.uscourts.gov/*',
        'https://app.clio.com/*',
        'https://app.goclio.eu/*',
        'https://*.app.clio.com/*',
        'https://*.app.goclio.eu/*',
        'https://www.courtlistener.com/*',
      ],
    },
  ],
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

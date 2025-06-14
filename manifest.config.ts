import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

const { version, name, description } = packageJson;

export default defineManifest({
  manifest_version: 3,
  name: process.env.NODE_ENV === 'development' ? `[DEV] ${name}` : 'Golden Retabriever',
  version,
  description,
  icons: {
    '16': 'icons/icon16.svg',
    '48': 'icons/icon48.svg',
    '128': 'icons/icon128.svg',
  },
  action: {
    default_popup: 'popup.html',
    default_title: 'Tab Group Collie',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  options_page: 'options.html',
  permissions: [
    'tabs',
    'tabGroups',
    'storage',
    'contextMenus',
    'activeTab',
  ],
  host_permissions: [
    'https://*/*',
    'http://*/*',
  ],
  commands: {
    'group-tabs': {
      suggested_key: {
        default: 'Ctrl+Shift+G',
        mac: 'Command+Shift+G',
      },
      description: 'Group tabs automatically',
    },
  },
});

import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

const { version, name, description } = packageJson;

export default defineManifest({
  manifest_version: 3,
  name: process.env.NODE_ENV === 'development' ? `[DEV] ${name}` : 'Tab Group Collie',
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
    'notifications',
  ],
  host_permissions: [
    'https://*/*',
    'http://*/*',
  ],
  commands: {
    'group-tabs': {
      suggested_key: {
        default: 'Ctrl+Shift+S',
        mac: 'Command+Shift+S',
      },
      description: 'Group tabs automatically',
    },
    'search-tabs': {
      suggested_key: {
        default: 'Ctrl+Shift+P',
        mac: 'Command+Shift+P',
      },
      description: 'Search through open tabs',
    },
  },
  web_accessible_resources: [
    {
      resources: ['search.html'],
      matches: ['<all_urls>'],
    },
  ],
});

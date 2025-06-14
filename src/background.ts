import { TabGrouper } from './utils/tabGrouper';
import { ExtensionSettings, GroupingMethod } from './types';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.sync.set({
      settings: {
        apiKey: '',
        groupingMethod: 'hostname' as GroupingMethod,
        isEnabled: true,
      } as ExtensionSettings,
    });

    // Create context menu
    chrome.contextMenus.create({
      id: 'group-tabs',
      title: 'Group Tabs',
      contexts: ['page'],
    });

    console.log('Tab Group Collie installed');
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, _) => {
  if (info.menuItemId === 'group-tabs') {
    await groupTabs();
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'group-tabs') {
    await groupTabs();
  }
});

// Handle messages from popup/options
chrome.runtime.onMessage.addListener(async (request, _, sendResponse) => {
  if (request.type === 'GROUP_TABS') {
    try {
      await groupTabs();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error grouping tabs:', error);
      sendResponse({ success: false, error: error });
    }
  }
});

async function groupTabs() {
  try {
    // Get settings
    const result = await chrome.storage.sync.get('settings');
    const settings: ExtensionSettings = result.settings || {
      apiKey: '',
      groupingMethod: 'hostname',
      isEnabled: true,
    };

    if (!settings.isEnabled) {
      console.log('Tab grouping is disabled');
      return;
    }

    // Get all tabs
    const tabs = await TabGrouper.getAllTabs();

    // Group tabs based on method
    let suggestions;
    switch (settings.groupingMethod) {
      case 'hostname':
        suggestions = TabGrouper.groupByHostname(tabs);
        break;
      case 'title':
        suggestions = TabGrouper.groupByTitle(tabs);
        break;
      case 'thematic':
        suggestions = await TabGrouper.groupThematically(tabs, settings.apiKey);
        break;
      default:
        suggestions = TabGrouper.groupByHostname(tabs);
    }

    // Create tab groups
    if (suggestions.length > 0) {
      await TabGrouper.createTabGroups(suggestions);
      console.log(`Created ${suggestions.length} tab groups`);
    } else {
      console.log('No grouping suggestions found');
    }
  } catch (error) {
    console.error('Error grouping tabs:', error);
  }
}

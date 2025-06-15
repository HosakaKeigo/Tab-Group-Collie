import { TabGrouper } from './utils/tabGrouper';
import { TabSearcher } from './utils/tabSearcher';
import { ExtensionSettings } from './types';
import { DEFAULT_PROMPT } from './utils/defaultPrompt';
import { DEFAULTS, EXTENSION_CONFIG, MESSAGE_TYPES } from './constants';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.sync.set({
      settings: {
        apiKey: '',
        groupingMethod: DEFAULTS.GROUPING_METHOD,
        isEnabled: DEFAULTS.IS_ENABLED,
        customPrompt: DEFAULT_PROMPT,
      } as ExtensionSettings,
    });

    // Create context menu
    chrome.contextMenus.create({
      id: 'group-tabs',
      title: 'Group Tabs',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: 'search-tabs',
      title: 'Search Tabs',
      contexts: ['page'],
    });

    console.log('Tab Group Collie installed');
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, _) => {
  if (info.menuItemId === 'group-tabs') {
    await groupTabs();
  } else if (info.menuItemId === 'search-tabs') {
    console.log('Search tabs context menu clicked');
    await searchTabs();
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  if (command === 'group-tabs') {
    await groupTabs();
  } else if (command === 'search-tabs') {
    console.log('Starting tab search...');
    await searchTabs();
  }
});

// Handle messages from popup/options
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === MESSAGE_TYPES.GROUP_TABS) {
    groupTabs()
      .then(() => {
        console.log('✅ Background: Tab grouping completed successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Background: Tab grouping failed:', error);
        sendResponse({ success: false, error: String(error) });
      });

    // 非同期レスポンスを示すためにtrueを返す
    return true;
  } else if (request.type === MESSAGE_TYPES.SEARCH_QUERY && request.query) {
    handleSearchQuery(request.query)
      .then(() => {
        console.log('✅ Background: Tab search completed successfully');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Background: Tab search failed:', error);
        sendResponse({ success: false, error: String(error) });
      });

    return true;
  }
});

async function groupTabs() {
  try {
    // Get settings
    const result = await chrome.storage.sync.get('settings');
    const settings: ExtensionSettings = result.settings || {
      apiKey: '',
      groupingMethod: DEFAULTS.GROUPING_METHOD,
      isEnabled: DEFAULTS.IS_ENABLED,
      customPrompt: DEFAULT_PROMPT,
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
      case 'thematic':
        suggestions = await TabGrouper.groupThematically(tabs, settings.apiKey, settings.customPrompt);
        break;
      default:
        throw new Error(`Unknown grouping method: ${settings.groupingMethod}`);
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

async function searchTabs() {
  try {
    console.log('Creating search window...');
    // Create a new window to get search input
    const searchWindow = await chrome.windows.create({
      url: chrome.runtime.getURL('search.html'),
      type: 'popup',
      width: EXTENSION_CONFIG.SEARCH_WINDOW.WIDTH,
      height: EXTENSION_CONFIG.SEARCH_WINDOW.HEIGHT,
      focused: true
    });
    console.log('Search window created:', searchWindow);
  } catch (error) {
    console.error('Error opening search window:', error);
  }
}

async function handleSearchQuery(query: string) {
  try {
    // Get settings
    const result = await chrome.storage.sync.get('settings');
    const settings: ExtensionSettings = result.settings || {
      apiKey: '',
      groupingMethod: DEFAULTS.GROUPING_METHOD,
      isEnabled: DEFAULTS.IS_ENABLED,
      customPrompt: DEFAULT_PROMPT,
    };

    // Get all tabs
    const tabs = await TabGrouper.getAllTabs();

    // Check if API key is available
    if (!settings.apiKey) {
      console.error('API key is required for tab search. Please configure your API key in the extension options.');
      // Show notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: EXTENSION_CONFIG.NOTIFICATION.ICON,
        title: 'Tab Search Error',
        message: 'API key is required for tab search. Please configure your Google API key in the extension options.'
      });
      return;
    }

    // Search tabs with AI
    const searchResults = await TabSearcher.searchTabs(tabs, query, settings.apiKey);

    if (searchResults.results.length > 0) {
      // Switch to the most relevant tab
      const bestMatch = searchResults.results[0];
      await chrome.tabs.update(bestMatch.tab.id, { active: true });
      await chrome.windows.update(bestMatch.tab.windowId!, { focused: true });

      // Optionally show all results in console
      console.log('Search results:', searchResults.results.map(r => ({
        title: r.tab.title,
        score: r.relevanceScore,
        reason: r.reason
      })));
    } else {
      console.log('No matching tabs found for query:', query);
    }
  } catch (error) {
    console.error('Error searching tabs:', error);
  }
}

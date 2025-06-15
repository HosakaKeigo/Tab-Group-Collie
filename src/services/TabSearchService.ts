import { TabGrouper } from '../utils/tabGrouper';
import { TabSearcher } from '../utils/tabSearcher';
import { SettingsService } from './SettingsService';
import { MessageHandler } from './MessageHandler';
import { EXTENSION_CONFIG } from '../constants';

export class TabSearchService {
  // Main method to search tabs
  static async searchTabs(): Promise<void> {
    try {
      // Create a search window to get user input
      await chrome.windows.create({
        url: chrome.runtime.getURL('search.html'),
        type: 'popup',
        width: EXTENSION_CONFIG.SEARCH_WINDOW.WIDTH,
        height: EXTENSION_CONFIG.SEARCH_WINDOW.HEIGHT,
        focused: true
      });
    } catch (error) {
      console.error('Error opening search window:', error);
      throw error;
    }
  }

  // Handle search query from search window
  static async handleSearchQuery(query: string): Promise<void> {
    try {
      // Load settings
      const settings = await SettingsService.loadSettings();

      // Get all tabs
      const tabs = await TabGrouper.getAllTabs();

      // Validate API key
      if (!(await MessageHandler.validateApiKeyWithError(settings.apiKey, 'search'))) {
        return;
      }

      // Search tabs with AI
      const searchResults = await TabSearcher.searchTabs(tabs, query, settings.apiKey);

      if (searchResults.results.length > 0) {
        // Switch to the most relevant tab
        const bestMatch = searchResults.results[0];
        await TabSearchService.switchToTab(bestMatch.tab);

        // Log search results
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
      throw error;
    }
  }

  // Switch to a specific tab
  private static async switchToTab(tab: any): Promise<void> {
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  }

  // Setup context menu for tab search
  static setupContextMenu(): void {
    chrome.contextMenus.create({
      id: 'search-tabs',
      title: 'Search Tabs',
      contexts: ['page'],
    });
  }

  // Handle context menu clicks
  static handleContextMenuClick(menuItemId: string): boolean {
    if (menuItemId === 'search-tabs') {
      console.log('Search tabs context menu clicked');
      TabSearchService.searchTabs().catch(error => {
        console.error('Context menu search tabs failed:', error);
      });
      return true;
    }
    return false;
  }

  // Setup keyboard shortcut handler
  static setupKeyboardShortcuts(): void {
    chrome.commands.onCommand.addListener(async (command) => {
      console.log('Command received:', command);
      if (command === 'search-tabs') {
        console.log('Starting tab search...');
        await TabSearchService.searchTabs();
      }
    });
  }
}
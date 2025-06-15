import { TabGrouper } from '../utils/tabGrouper';
import { SettingsService } from './SettingsService';
import { MessageHandler } from './MessageHandler';
import type { ExtensionSettings } from '../types';

export class TabGroupService {
  // Main method to group tabs based on current settings
  static async groupTabs(): Promise<void> {
    try {
      // Load settings
      const settings = await SettingsService.loadSettings();

      // Check if extension is enabled
      if (!settings.isEnabled) {
        console.log('Tab grouping is disabled');
        return;
      }

      // Get all tabs
      const tabs = await TabGrouper.getAllTabs();

      // Group tabs based on method
      const suggestions = await this.getGroupSuggestions(settings, tabs);

      // Create tab groups
      if (suggestions.length > 0) {
        await TabGrouper.createTabGroups(suggestions);
        console.log(`Created ${suggestions.length} tab groups`);
      } else {
        console.log('No grouping suggestions found');
      }
    } catch (error) {
      console.error('Error grouping tabs:', error);
      throw error;
    }
  }

  // Get grouping suggestions based on settings and tabs
  private static async getGroupSuggestions(settings: ExtensionSettings, tabs: any[]) {
    switch (settings.groupingMethod) {
      case 'hostname':
        return TabGrouper.groupByHostname(tabs);
      
      case 'thematic':
        // Check if API key is available for thematic grouping
        if (!(await MessageHandler.validateApiKeyWithError(settings.apiKey, 'grouping'))) {
          throw new Error('API key validation failed');
        }
        return await TabGrouper.groupThematically(tabs, settings.apiKey, settings.customPrompt);
      
      default:
        throw new Error(`Unknown grouping method: ${settings.groupingMethod}`);
    }
  }

  // Setup context menu for tab grouping
  static setupContextMenu(): void {
    chrome.contextMenus.create({
      id: 'group-tabs',
      title: 'Group Tabs',
      contexts: ['page'],
    });
  }

  // Handle context menu clicks
  static handleContextMenuClick(menuItemId: string): boolean {
    if (menuItemId === 'group-tabs') {
      TabGroupService.groupTabs().catch(error => {
        console.error('Context menu group tabs failed:', error);
      });
      return true;
    }
    return false;
  }

  // Setup keyboard shortcut handler
  static setupKeyboardShortcuts(): void {
    chrome.commands.onCommand.addListener(async (command) => {
      console.log('Command received:', command);
      if (command === 'group-tabs') {
        await TabGroupService.groupTabs();
      }
    });
  }
}
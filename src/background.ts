import { 
  SettingsService, 
  MessageHandler, 
  TabGroupService, 
  TabSearchService 
} from './services';

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize default settings
    await SettingsService.initializeDefaultSettings();

    // Setup context menus
    TabGroupService.setupContextMenu();
    TabSearchService.setupContextMenu();

    console.log('Tab Group Collie installed');
  }
});

// Setup context menu click handlers
chrome.contextMenus.onClicked.addListener(async (info, _) => {
  const handled = TabGroupService.handleContextMenuClick(info.menuItemId as string) ||
                  TabSearchService.handleContextMenuClick(info.menuItemId as string);
  
  if (!handled) {
    console.warn('Unhandled context menu item:', info.menuItemId);
  }
});

// Setup keyboard shortcuts
TabGroupService.setupKeyboardShortcuts();
TabSearchService.setupKeyboardShortcuts();

// Setup message handlers
MessageHandler.setupMessageListeners(
  TabGroupService.groupTabs,
  TabSearchService.handleSearchQuery
);
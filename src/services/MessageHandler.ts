import { MESSAGE_TYPES } from '../constants';

export type MessageContext = 'grouping' | 'search';

export class MessageHandler {
  // Send API key error message to options page
  static async sendApiKeyError(context: MessageContext): Promise<void> {
    // Open settings page
    chrome.runtime.openOptionsPage();

    // Send error message with a slight delay to ensure options page is ready
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SHOW_API_KEY_ERROR,
        context
      });
    }, 500);
  }

  // Handle API key validation and show error if needed
  static async validateApiKeyWithError(
    apiKey: string,
    context: MessageContext
  ): Promise<boolean> {
    if (!apiKey) {
      const contextName = context === 'grouping' ? 'thematic tab grouping' : 'tab search';
      console.error(`API key is required for ${contextName}. Please configure your API key in the extension options.`);

      await this.sendApiKeyError(context);
      return false;
    }
    return true;
  }

  // Setup message listeners for the extension
  static setupMessageListeners(
    groupTabsHandler: () => Promise<void>,
    searchQueryHandler: (query: string) => Promise<void>
  ): void {
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      if (request.type === MESSAGE_TYPES.GROUP_TABS) {
        groupTabsHandler()
          .then(() => {
            console.log('✅ Background: Tab grouping completed successfully');
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('❌ Background: Tab grouping failed:', error);
            sendResponse({ success: false, error: String(error) });
          });

        return true; // Indicates async response
      } else if (request.type === MESSAGE_TYPES.SEARCH_QUERY && request.query) {
        searchQueryHandler(request.query)
          .then(() => {
            console.log('✅ Background: Tab search completed successfully');
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('❌ Background: Tab search failed:', error);
            sendResponse({ success: false, error: String(error) });
          });

        return true; // Indicates async response
      }
    });
  }
}
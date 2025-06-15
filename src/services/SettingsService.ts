import { ExtensionSettings } from '../types';
import { DEFAULT_PROMPT } from '../utils/defaultPrompt';
import { DEFAULTS } from '../constants';

export class SettingsService {
  // Get default settings configuration
  static getDefaultSettings(): ExtensionSettings {
    return {
      apiKey: '',
      groupingMethod: DEFAULTS.GROUPING_METHOD,
      isEnabled: DEFAULTS.IS_ENABLED,
      customPrompt: DEFAULT_PROMPT,
    };
  }

  // Load settings from Chrome storage with fallback to defaults
  static async loadSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.sync.get('settings');
    return result.settings || SettingsService.getDefaultSettings();
  }

  // Save settings to Chrome storage
  static async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.sync.set({ settings });
  }

  // Initialize default settings (used during extension install)
  static async initializeDefaultSettings(): Promise<void> {
    await SettingsService.saveSettings(SettingsService.getDefaultSettings());
  }

  // Validate API key and return validation result
  static validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
    if (!apiKey || apiKey.trim() === '') {
      return {
        isValid: false,
        error: 'API key is required'
      };
    }
    
    // Add more validation if needed (format, length, etc.)
    return { isValid: true };
  }

  // Check if extension is enabled
  static async isEnabled(): Promise<boolean> {
    const settings = await this.loadSettings();
    return settings.isEnabled;
  }
}
export interface ExtensionSettings {
  apiKey: string;
  groupingMethod: GroupingMethod;
  isEnabled: boolean;
  customPrompt: string;
}

export type GroupingMethod = 'hostname' | 'thematic';

export interface TabInfo {
  id: number;
  title: string;
  url: string;
  hostname: string;
  favicon?: string;
}

export interface GroupSuggestion {
  tabs: TabInfo[];
  groupName: string;
  color: chrome.tabGroups.ColorEnum;
  reason: string;
}

export interface GroupingContext {
  method: GroupingMethod;
  tabs: TabInfo[];
  apiKey?: string;
  customPrompt?: string;
}

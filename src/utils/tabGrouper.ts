import { TabInfo, GroupSuggestion } from '../types';

export class TabGrouper {
  private static getHostnameFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  static async getAllTabs(): Promise<TabInfo[]> {
    const tabs = await chrome.tabs.query({});
    return tabs.map(tab => ({
      id: tab.id!,
      title: tab.title || '',
      url: tab.url || '',
      hostname: this.getHostnameFromUrl(tab.url || ''),
      favicon: tab.favIconUrl,
    }));
  }

  static groupByHostname(tabs: TabInfo[]): GroupSuggestion[] {
    const groups = new Map<string, TabInfo[]>();

    tabs.forEach(tab => {
      const hostname = tab.hostname;
      if (!groups.has(hostname)) {
        groups.set(hostname, []);
      }
      groups.get(hostname)!.push(tab);
    });

    return Array.from(groups.entries())
      .filter(([_, tabList]) => tabList.length > 1)
      .map(([hostname, tabList]) => ({
        tabs: tabList,
        groupName: hostname,
        color: this.getColorForHostname(hostname),
        reason: `Grouped by hostname: ${hostname}`,
      }));
  }

  static groupByTitle(tabs: TabInfo[]): GroupSuggestion[] {
    const groups = new Map<string, TabInfo[]>();

    tabs.forEach(tab => {
      const titleWords = tab.title.toLowerCase().split(' ').slice(0, 3).join(' ');
      if (!groups.has(titleWords)) {
        groups.set(titleWords, []);
      }
      groups.get(titleWords)!.push(tab);
    });

    return Array.from(groups.entries())
      .filter(([_, tabList]) => tabList.length > 1)
      .map(([titlePrefix, tabList]) => ({
        tabs: tabList,
        groupName: titlePrefix,
        color: this.getColorForTitle(titlePrefix),
        reason: `Grouped by title similarity: "${titlePrefix}"`,
      }));
  }

  static async groupThematically(tabs: TabInfo[], apiKey?: string): Promise<GroupSuggestion[]> {
    if (!apiKey) {
      return this.groupBySimpleThemes(tabs);
    }

    // For demonstration, using simple thematic grouping
    // In production, this would use the API key to make AI-powered grouping decisions
    return this.groupBySimpleThemes(tabs);
  }

  private static groupBySimpleThemes(tabs: TabInfo[]): GroupSuggestion[] {
    const themes = {
      social: ['twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'reddit.com'],
      development: ['github.com', 'stackoverflow.com', 'gitlab.com', 'codepen.io'],
      ai: ['openai.com', 'claude.ai', 'gemini.google.com', 'chatgpt.com'],
      google: ['google.com', 'gmail.com', 'drive.google.com', 'docs.google.com'],
      media: ['youtube.com', 'vimeo.com', 'twitch.tv', 'netflix.com'],
    };

    const groups: GroupSuggestion[] = [];

    Object.entries(themes).forEach(([theme, hostnames]) => {
      const matchingTabs = tabs.filter(tab =>
        hostnames.some(hostname => tab.hostname.includes(hostname))
      );

      if (matchingTabs.length > 1) {
        groups.push({
          tabs: matchingTabs,
          groupName: theme.charAt(0).toUpperCase() + theme.slice(1),
          color: this.getColorForTheme(theme),
          reason: `Thematically grouped: ${theme}`,
        });
      }
    });

    return groups;
  }

  private static getColorForHostname(hostname: string): chrome.tabGroups.ColorEnum {
    const colors: chrome.tabGroups.ColorEnum[] = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    const hash = hostname.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  private static getColorForTitle(title: string): chrome.tabGroups.ColorEnum {
    const colors: chrome.tabGroups.ColorEnum[] = ['green', 'blue', 'purple', 'cyan'];
    const hash = title.length;
    return colors[hash % colors.length];
  }

  private static getColorForTheme(theme: string): chrome.tabGroups.ColorEnum {
    const themeColors: Record<string, chrome.tabGroups.ColorEnum> = {
      social: 'blue',
      development: 'green',
      ai: 'purple',
      google: 'red',
      media: 'orange',
    };
    return themeColors[theme] || 'grey';
  }

  static async createTabGroups(suggestions: GroupSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      const tabIds = suggestion.tabs.map(tab => tab.id);
      const groupId = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(groupId, {
        title: suggestion.groupName,
        color: suggestion.color,
      });
    }
  }
}

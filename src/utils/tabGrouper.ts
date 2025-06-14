import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { TabInfo, GroupSuggestion } from '../types';
import { generateObject } from "ai";
import * as v from 'valibot';
import { valibotSchema } from '@ai-sdk/valibot';

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

    // AIを使用したテーマ別グループ化
    return await this.groupByAi(tabs, apiKey);
  }

  private static async groupByAi(tabs: TabInfo[], apiKey: string): Promise<GroupSuggestion[]> {
    try {
      const { object: tabGroupObject } = await generateObject({
        model: createGoogleGenerativeAI({
          apiKey
        })("gemini-2.0-flash"),
        schema: valibotSchema(v.object({
          groups: v.array(v.object({
            tabIndices: v.array(v.number()),
            groupName: v.string(),
            color: v.string(),
            description: v.string()
          }))
        })),
        prompt: `Group the following tabs thematically based on their titles and hostnames. 
        Return a JSON object with this exact structure:
        {
          "groups": [
            {
              "tabIndices": [0, 1, 3],
              "groupName": "Social Media",
              "color": "blue",
            }
          ]
        }

        Rules:
        - tabIndices: array of indices (0-based) of tabs that belong to this group
        - groupName: descriptive name for the group
        - color: must be one of 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey'
        - Only create groups with 2 or more tabs

        Consider these themes:
        - Social media sites (Twitter, Facebook, Instagram, LinkedIn, Reddit)
        - Development tools and documentation (GitHub, Stack Overflow, MDN)
        - AI/ML platforms (OpenAI, Claude, Gemini, ChatGPT)
        - Google services (Gmail, Drive, Docs, YouTube)
        - Media and entertainment (YouTube, Netflix, Twitch)
        - E-commerce and shopping (Amazon, eBay, shopping sites)
        - News and information sites
        - Work and productivity tools

        ----

        Tabs:\n${tabs.map((tab, index) => `${index}: ${tab.title} (${tab.hostname})`).join('\n')}`,
      });


      // GroupSuggestion[]形式に変換
      return tabGroupObject.groups.map(group => ({
        tabs: group.tabIndices.map(index => tabs[index]).filter(Boolean),
        groupName: group.groupName,
        color: group.color as chrome.tabGroups.ColorEnum,
        reason: `AI grouped: ${group.groupName} (${group.tabIndices.length} tabs)`,
      })).filter(group => group.tabs.length > 1); // 2つ以上のタブがあるグループのみ
    } catch (error) {
      console.error('AI grouping failed:', error);
      // フォールバックとしてシンプルなテーマ別グループ化を使用
      return this.groupBySimpleThemes(tabs);
    }
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
          reason: `Thematically grouped: ${theme} `,
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

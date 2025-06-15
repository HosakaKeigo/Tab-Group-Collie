import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { TabInfo, GroupSuggestion } from '../types';
import { generateObject } from "ai";
import * as v from 'valibot';
import { valibotSchema } from '@ai-sdk/valibot';
import { DEFAULT_PROMPT } from './defaultPrompt';
import { AI_MODELS } from '../constants';

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
      windowId: tab.windowId,
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

  static async groupThematically(tabs: TabInfo[], apiKey?: string, customPrompt?: string): Promise<GroupSuggestion[]> {
    if (!apiKey) {
      throw new Error('API key is required for thematic grouping');
    }

    // AIを使用したテーマ別グループ化
    return await this.groupByAi(tabs, apiKey, customPrompt);
  }

  private static async groupByAi(tabs: TabInfo[], apiKey: string, customPrompt?: string): Promise<GroupSuggestion[]> {
    try {
      const promptTemplate = customPrompt || DEFAULT_PROMPT;
      const tabsString = tabs.map((tab, index) => `${index}: ${tab.title} (${tab.hostname})`).join('\n');
      const prompt = promptTemplate.replace('{tabs}', tabsString);

      const { object: tabGroupObject } = await generateObject({
        model: createGoogleGenerativeAI({
          apiKey
        })(AI_MODELS.GEMINI),
        schema: valibotSchema(v.object({
          groups: v.array(v.object({
            tabIndices: v.array(v.number()),
            groupName: v.string(),
            color: v.string(),
            description: v.string()
          }))
        })),
        prompt,
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
      throw new Error(`AI grouping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private static getColorForHostname(hostname: string): chrome.tabGroups.ColorEnum {
    const colors: chrome.tabGroups.ColorEnum[] = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    const hash = hostname.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  static async createTabGroups(suggestions: GroupSuggestion[]): Promise<void> {
    let successCount = 0;
    let errorCount = 0;

    for (const suggestion of suggestions) {
      try {
        // タブIDの有効性をチェック
        const tabIds = suggestion.tabs
          .map(tab => tab.id)
          .filter(id => id && id > 0);

        if (tabIds.length < 2) {
          console.warn(`Skipping group "${suggestion.groupName}": insufficient valid tabs (${tabIds.length})`);
          continue;
        }

        console.log(`Creating group "${suggestion.groupName}" with ${tabIds.length} tabs:`, tabIds);

        // タブグループを作成
        const groupId = await chrome.tabs.group({ tabIds });

        // グループのタイトルと色を設定
        await chrome.tabGroups.update(groupId, {
          title: suggestion.groupName,
          color: suggestion.color,
        });

        successCount++;
        console.log(`✅ Successfully created group: "${suggestion.groupName}" (ID: ${groupId})`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to create group "${suggestion.groupName}":`, {
          error: error,
          tabIds: suggestion.tabs.map(tab => tab.id),
          tabTitles: suggestion.tabs.map(tab => tab.title),
        });

        // 権限エラーの場合は詳細を表示
        if (error instanceof Error && error.message?.includes('permission')) {
          console.error('Permission error: Make sure the extension has "tabs" and "tabGroups" permissions');
        }
      }
    }

    console.log(`Tab grouping completed: ${successCount} successful, ${errorCount} failed`);

    if (errorCount > 0 && successCount === 0) {
      throw new Error(`Failed to create any tab groups (${errorCount} errors)`);
    }
  }
}

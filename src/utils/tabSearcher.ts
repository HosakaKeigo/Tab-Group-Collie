import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import * as v from 'valibot';
import { valibotSchema } from '@ai-sdk/valibot';
import type { TabInfo } from '../types';

const searchResultSchema = v.object({
  results: v.array(v.object({
    tabIndex: v.number(),
    relevanceScore: v.number(),
    reason: v.string()
  }))
});

export class TabSearcher {
  static async searchTabs(
    tabs: TabInfo[],
    searchQuery: string,
    apiKey: string
  ): Promise<{
    results: Array<{
      tab: TabInfo;
      relevanceScore: number;
      reason: string;
    }>;
  }> {
    const tabsData = tabs.map((tab, index) => ({
      index,
      title: tab.title,
      hostname: tab.hostname
    }));

    const searchPrompt = `You are a tab search assistant. Given a user's search query and a list of browser tabs, identify the most relevant tabs.

User's search query: "${searchQuery}"

Browser tabs:
${tabsData.map((tab) => `${tab.index}: "${tab.title}" (${tab.hostname})`).join('\n')}

Return the most relevant tabs (up to 5) with relevance scores from 0-100, where 100 is a perfect match.
Consider both exact matches and semantic similarity. Include a brief reason for each match.`;

    try {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey,
      });

      const result = await generateObject({
        model: google('gemini-2.0-flash-lite'),
        schema: valibotSchema(searchResultSchema),
        prompt: searchPrompt,
      });

      console.log('AI search result:', result);

      return {
        results: result.object.results
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .map(item => ({
            tab: tabs[item.tabIndex],
            relevanceScore: item.relevanceScore,
            reason: item.reason
          }))
      };
    } catch (error) {
      console.error('Error searching tabs with AI:', error);
      return { results: [] };
    }
  }

  static async searchTabsWithoutAI(
    tabs: TabInfo[],
    searchQuery: string
  ): Promise<{
    results: Array<{
      tab: TabInfo;
      relevanceScore: number;
      reason: string;
    }>;
  }> {
    const query = searchQuery.toLowerCase();
    const results: Array<{
      tab: TabInfo;
      relevanceScore: number;
      reason: string;
    }> = [];

    tabs.forEach((tab) => {
      const titleMatch = tab.title.toLowerCase().includes(query);
      const hostnameMatch = tab.hostname.toLowerCase().includes(query);
      const urlMatch = tab.url.toLowerCase().includes(query);

      let score = 0;
      let reason = '';

      if (titleMatch) {
        score += 50;
        reason = 'Title contains search term';
      }
      if (hostnameMatch) {
        score += 30;
        reason = reason ? `${reason}, hostname match` : 'Hostname contains search term';
      }
      if (urlMatch && !hostnameMatch) {
        score += 20;
        reason = reason ? `${reason}, URL match` : 'URL contains search term';
      }

      if (score > 0) {
        results.push({ tab, relevanceScore: score, reason });
      }
    });

    return {
      results: results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
    };
  }
}
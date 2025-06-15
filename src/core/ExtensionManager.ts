import { ExtensionSettings, TabInfo, GroupSuggestion } from '../types';
import { DEFAULT_PROMPT } from '../utils/defaultPrompt';
import { DEFAULTS, MESSAGE_TYPES, AI_MODELS, SEARCH_CONFIG } from '../constants';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import * as v from 'valibot';
import { valibotSchema } from '@ai-sdk/valibot';

/**
 * ExtensionManager - Chrome拡張全体を統括するシングルトンクラス
 * 
 * 機能:
 * - 設定のキャッシュと管理
 * - サービスインスタンスの管理
 * - Chrome APIイベントの統一ハンドリング
 * - ライフサイクル管理
 */
export class ExtensionManager {
  private static instance: ExtensionManager | null = null;
  private settings: ExtensionSettings | null = null;
  private settingsLoadPromise: Promise<ExtensionSettings> | null = null;
  private isInitialized = false;

  private constructor() {
    // プライベートコンストラクタでSingletonパターンを実装
  }

  /**
   * ExtensionManagerのシングルトンインスタンスを取得
   */
  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * 拡張機能の初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🐕 Initializing Tab Group Collie...');

    // 設定を読み込み
    await this.loadSettings();

    // イベントリスナーを設定
    this.setupEventListeners();

    this.isInitialized = true;
    console.log('✅ Tab Group Collie initialized successfully');
  }

  /**
   * 設定の読み込み（キャッシュ付き）
   */
  async getSettings(): Promise<ExtensionSettings> {
    if (this.settings) {
      return this.settings;
    }

    // 既に読み込み中の場合は、そのPromiseを返す
    if (this.settingsLoadPromise) {
      return this.settingsLoadPromise;
    }

    this.settingsLoadPromise = this.loadSettings();
    return this.settingsLoadPromise;
  }

  /**
   * 設定の更新
   */
  async updateSettings(newSettings: Partial<ExtensionSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };

    await chrome.storage.sync.set({ settings: updatedSettings });
    this.settings = updatedSettings;

    console.log('⚙️ Settings updated:', newSettings);
  }

  /**
   * 設定のリロード（キャッシュをクリア）
   */
  async reloadSettings(): Promise<ExtensionSettings> {
    this.settings = null;
    this.settingsLoadPromise = null;
    return this.getSettings();
  }

  /**
   * デフォルト設定の取得
   */
  getDefaultSettings(): ExtensionSettings {
    return {
      apiKey: '',
      groupingMethod: DEFAULTS.GROUPING_METHOD,
      isEnabled: DEFAULTS.IS_ENABLED,
      customPrompt: DEFAULT_PROMPT,
    };
  }

  /**
   * 拡張機能が有効かチェック
   */
  async isEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.isEnabled;
  }

  /**
   * APIキーの検証
   */
  validateApiKey(apiKey?: string): { isValid: boolean; error?: string } {
    if (!apiKey || apiKey.trim() === '') {
      return {
        isValid: false,
        error: 'API key is required'
      };
    }
    return { isValid: true };
  }

  /**
   * APIキーエラーの表示
   */
  async showApiKeyError(context: 'grouping' | 'search'): Promise<void> {
    const contextMessage = context === 'grouping'
      ? 'API key is required for thematic tab grouping!'
      : 'API key is required for tab search!';

    console.error(contextMessage);

    // 設定ページを開く
    chrome.runtime.openOptionsPage();

    // エラーメッセージを送信
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.SHOW_API_KEY_ERROR,
        context
      });
    }, 500);
  }

  /**
   * タブのグループ化
   */
  async groupTabs(): Promise<void> {
    const settings = await this.getSettings();

    if (!settings.isEnabled) {
      console.log('Tab grouping is disabled');
      return;
    }

    console.log('🔄 Starting tab grouping...');

    try {
      // TabGrouper の機能を直接ここに統合
      await this.performTabGrouping(settings);
      console.log('✅ Tab grouping completed successfully');
    } catch (error) {
      console.error('❌ Tab grouping failed:', error);
      throw error;
    }
  }

  /**
   * タブの検索
   */
  async searchTabs(): Promise<void> {
    try {
      console.log('🔍 Opening tab search window...');

      await chrome.windows.create({
        url: chrome.runtime.getURL('search.html'),
        type: 'popup',
        width: 500,
        height: 200,
        focused: true
      });
    } catch (error) {
      console.error('❌ Error opening search window:', error);
      throw error;
    }
  }

  /**
   * 検索クエリの処理
   */
  async handleSearchQuery(query: string): Promise<void> {
    const settings = await this.getSettings();

    // APIキーの検証
    const validation = this.validateApiKey(settings.apiKey);
    if (!validation.isValid) {
      await this.showApiKeyError('search');
      return;
    }

    console.log('🔍 Searching tabs for:', query);

    try {
      // TabSearcher の機能を直接ここに統合
      await this.performTabSearch(query, settings);
      console.log('✅ Tab search completed successfully');
    } catch (error) {
      console.error('❌ Tab search failed:', error);
      throw error;
    }
  }

  /**
   * 拡張機能のインストール時処理
   */
  async handleInstall(): Promise<void> {
    console.log('🎉 Installing Tab Group Collie...');

    // デフォルト設定を保存
    await chrome.storage.sync.set({ settings: this.getDefaultSettings() });

    // コンテキストメニューを作成
    this.createContextMenus();

    console.log('✅ Tab Group Collie installed successfully');
  }

  /**
   * 設定の実際の読み込み処理
   */
  private async loadSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get('settings');
      this.settings = result.settings || this.getDefaultSettings();
      this.settingsLoadPromise = null;
      return this.settings!;
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      this.settings = this.getDefaultSettings();
      this.settingsLoadPromise = null;
      return this.settings;
    }
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    // ストレージ変更の監視
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.settings) {
        console.log('⚙️ Settings changed, updating cache');
        this.settings = changes.settings.newValue;
      }
    });

    // メッセージハンドリング
    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true; // 非同期レスポンスを示す
    });

    // コンテキストメニューのクリック
    chrome.contextMenus.onClicked.addListener((info) => {
      this.handleContextMenuClick(info.menuItemId as string);
    });

    // キーボードショートカット
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });
  }

  /**
   * メッセージの処理
   */
  private async handleMessage(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (request.type === MESSAGE_TYPES.GROUP_TABS) {
        await this.groupTabs();
        sendResponse({ success: true });
      } else if (request.type === MESSAGE_TYPES.SEARCH_QUERY && request.query) {
        await this.handleSearchQuery(request.query);
        sendResponse({ success: true });
      }
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  }

  /**
   * コンテキストメニューのクリック処理
   */
  private handleContextMenuClick(menuItemId: string): void {
    switch (menuItemId) {
      case 'group-tabs':
        this.groupTabs().catch(error => console.error(error));
        break;
      case 'search-tabs':
        this.searchTabs().catch(error => console.error(error));
        break;
    }
  }

  /**
   * コマンドの処理
   */
  private handleCommand(command: string): void {
    switch (command) {
      case 'group-tabs':
        this.groupTabs().catch(error => console.error(error));
        break;
      case 'search-tabs':
        this.searchTabs().catch(error => console.error(error));
        break;
    }
  }

  /**
   * コンテキストメニューの作成
   */
  private createContextMenus(): void {
    chrome.contextMenus.create({
      id: 'group-tabs',
      title: 'Group Tabs',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: 'search-tabs',
      title: 'Search Tabs',
      contexts: ['page'],
    });
  }

  /**
   * 実際のタブグループ化処理
   */
  private async performTabGrouping(settings: ExtensionSettings): Promise<void> {
    // 全てのタブを取得
    const tabs = await this.getAllTabs();

    // グループ化方法に応じて処理
    let suggestions: GroupSuggestion[];
    switch (settings.groupingMethod) {
      case 'hostname':
        suggestions = this.groupByHostname(tabs);
        break;
      case 'thematic':
        // APIキーの検証
        const validation = this.validateApiKey(settings.apiKey);
        if (!validation.isValid) {
          await this.showApiKeyError('grouping');
          throw new Error('API key validation failed');
        }
        suggestions = await this.groupByAi(tabs, settings.apiKey, settings.customPrompt);
        break;
      default:
        throw new Error(`Unknown grouping method: ${settings.groupingMethod}`);
    }

    // タブグループを作成
    if (suggestions.length > 0) {
      await this.createTabGroups(suggestions);
      console.log(`Created ${suggestions.length} tab groups`);
    } else {
      console.log('No grouping suggestions found');
    }
  }

  /**
   * 全てのタブを取得
   */
  private async getAllTabs(): Promise<TabInfo[]> {
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

  /**
   * URLからホスト名を取得
   */
  private getHostnameFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * ホスト名でタブをグループ化
   */
  private groupByHostname(tabs: TabInfo[]): GroupSuggestion[] {
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

  /**
   * AIを使ってテーマ別にタブをグループ化
   */
  private async groupByAi(tabs: TabInfo[], apiKey: string, customPrompt?: string): Promise<GroupSuggestion[]> {
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

  /**
   * ホスト名から色を決定
   */
  private getColorForHostname(hostname: string): chrome.tabGroups.ColorEnum {
    const colors: chrome.tabGroups.ColorEnum[] = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    const hash = hostname.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * タブグループを作成
   */
  private async createTabGroups(suggestions: GroupSuggestion[]): Promise<void> {
    let successCount = 0;
    let errorCount = 0;

    for (const suggestion of suggestions) {
      try {
        // タブIDの有効性をチェックし、通常のウィンドウのタブのみを取得
        const validTabs = [];
        for (const tab of suggestion.tabs) {
          if (tab.id && tab.id > 0 && tab.windowId) {
            try {
              const window = await chrome.windows.get(tab.windowId);
              if (window.type === 'normal') {
                validTabs.push(tab.id);
              }
            } catch (e) {
              console.warn(`Could not get window info for tab ${tab.id}`);
            }
          }
        }
        const tabIds = validTabs;

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

  /**
   * 実際のタブ検索処理
   */
  private async performTabSearch(query: string, settings: ExtensionSettings): Promise<void> {
    // 全てのタブを取得
    const tabs = await this.getAllTabs();

    // AIを使って検索
    const searchResults = await this.searchTabsWithAI(tabs, query, settings.apiKey);

    if (searchResults.length > 0) {
      // 最も関連性の高いタブに切り替える
      const bestMatch = searchResults[0];
      await this.switchToTab(bestMatch.tab);

      // 検索結果をログに出力
      console.log('Search results:', searchResults.map(r => ({
        title: r.tab.title,
        score: r.relevanceScore,
        reason: r.reason
      })));
    } else {
      console.log('No matching tabs found for query:', query);
    }
  }

  /**
   * AIを使ってタブを検索
   */
  private async searchTabsWithAI(
    tabs: TabInfo[],
    searchQuery: string,
    apiKey: string
  ): Promise<Array<{
    tab: TabInfo;
    relevanceScore: number;
    reason: string;
  }>> {
    const tabsData = tabs.map((tab, index) => ({
      index,
      title: tab.title,
      hostname: tab.hostname
    }));

    const searchPrompt = `You are a tab search assistant. Given a user's search query and a list of browser tabs, identify the most relevant tabs.

User's search query: "${searchQuery}"

Browser tabs:
${tabsData.map((tab) => `${tab.index}: "${tab.title}" (${tab.hostname})`).join('\n')}

Return the most relevant tabs (up to ${DEFAULTS.MAX_SEARCH_RESULTS}) with relevance scores from ${SEARCH_CONFIG.MIN_RELEVANCE_SCORE}-${SEARCH_CONFIG.MAX_RELEVANCE_SCORE}, where ${SEARCH_CONFIG.MAX_RELEVANCE_SCORE} is a perfect match.
Consider both exact matches and semantic similarity. Include a brief reason for each match.`;

    try {
      const searchResultSchema = v.object({
        results: v.array(v.object({
          tabIndex: v.number(),
          relevanceScore: v.number(),
          reason: v.string()
        }))
      });

      const google = createGoogleGenerativeAI({
        apiKey: apiKey,
      });

      const result = await generateObject({
        model: google(AI_MODELS.GEMINI),
        schema: valibotSchema(searchResultSchema),
        prompt: searchPrompt,
      });

      console.log('AI search result:', result);

      return result.object.results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(item => ({
          tab: tabs[item.tabIndex],
          relevanceScore: item.relevanceScore,
          reason: item.reason
        }));
    } catch (error) {
      console.error('Error searching tabs with AI:', error);
      return [];
    }
  }

  /**
   * 指定されたタブに切り替える
   */
  private async switchToTab(tab: TabInfo): Promise<void> {
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  }
}

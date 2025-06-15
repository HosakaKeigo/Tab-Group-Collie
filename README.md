# Tab Group Collie 🐕

A modern Chrome extension built with **TypeScript**, **Vite**, and **React** that intelligently groups browser tabs using AI and hostname-based algorithms.

## ✨ Features

- 🤖 **AI-powered thematic grouping** - Groups tabs by content similarity using Google Gemini
- 🌐 **Hostname-based grouping** - Organizes tabs by domain
- 🔍 **Intelligent tab search** - AI-powered tab discovery and navigation

## 🏗️ Architecture Overview

### Project Structure

```
Tab-Group-Collie/
├── src/
│   ├── core/                         # 🎯 Core Architecture
│   │   ├── ExtensionManager.ts       # Central singleton manager
│   │   └── index.ts                  # Core exports
│   ├── popup/                        # 🎨 React UI Components
│   │   ├── main.tsx                  # Popup entry point
│   │   └── Popup.tsx                 # Main popup interface
│   ├── options/                      # ⚙️ Settings Interface
│   │   ├── main.tsx                  # Options entry point
│   │   └── Options.tsx               # Settings configuration
│   ├── search/                       # 🔍 Tab Search UI
│   │   └── main.tsx                  # Search window interface
│   ├── utils/                        # 🛠️ Utilities
│   │   ├── useChromeStorage.ts       # React storage hook
│   │   └── defaultPrompt.ts          # AI prompt template
│   ├── types/                        # 📝 TypeScript Definitions
│   │   └── index.ts                  # Type definitions
│   ├── constants/                    # 📊 Configuration
│   │   └── index.ts                  # App constants
│   └── background.ts                 # 🔄 Service Worker (16 lines!)
├── icons/                            # 🎨 Extension Icons
├── dist/                            # 📦 Built Extension
├── manifest.config.ts               # 📄 Dynamic Manifest
└── vite.config.ts                  # ⚡ Build Configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Chrome/Edge browser
- Google Gemini API key (for AI features)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Tab-Group-Collie

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → Select `dist/` folder
4. Pin the extension to toolbar

## 🏛️ Technical Architecture

### ExtensionManager - Central Controller

The `ExtensionManager` is a singleton that manages the entire extension lifecycle:

```typescript
export class ExtensionManager {
  private static instance: ExtensionManager | null = null;
  private settings: ExtensionSettings | null = null; // Cached settings
  
  // Singleton access
  static getInstance(): ExtensionManager
  
  // Core functionality
  async groupTabs(): Promise<void>           // AI + hostname grouping
  async searchTabs(): Promise<void>          // Open search window
  async handleSearchQuery(query: string)    // AI-powered tab search
  
  // Settings management (with caching)
  async getSettings(): Promise<ExtensionSettings>     // Cached access
  async updateSettings(settings: Partial<ExtensionSettings>)
  
  // Lifecycle management
  async initialize(): Promise<void>          // Setup event listeners
  async handleInstall(): Promise<void>       // First-time setup
}
```

### AI Integration

#### Tab Grouping with Gemini
```typescript
private async groupByAi(tabs: TabInfo[], apiKey: string): Promise<GroupSuggestion[]> {
  const response = await generateObject({
    model: createGoogleGenerativeAI({ apiKey })(AI_MODELS.GEMINI),
    schema: valibotSchema(groupingSchema),
    prompt: `Group these tabs thematically: ${tabsString}`
  });
  return response.object.groups;
}
```

#### Smart Tab Search
```typescript
private async searchTabsWithAI(tabs, query, apiKey): Promise<SearchResult[]> {
  const prompt = `Find tabs matching "${query}" from: ${tabsList}`;
  const results = await generateObject({ model, schema, prompt });
  return results.sorted((a, b) => b.relevanceScore - a.relevanceScore);
}
```

## 🎯 Core Features

### 1. Tab Grouping Methods

#### Hostname Grouping
```typescript
// Groups by domain: github.com, google.com, etc.
private groupByHostname(tabs: TabInfo[]): GroupSuggestion[] {
  const groups = new Map<string, TabInfo[]>();
  tabs.forEach(tab => {
    const hostname = new URL(tab.url).hostname;
    // Grouping logic...
  });
}
```

#### AI Thematic Grouping
```typescript
// AI categorizes: "Social Media", "Development", "Research", etc.
const suggestions = await this.groupByAi(tabs, apiKey, customPrompt);
```

### 2. Intelligent Tab Search

- **Semantic Search**: Understands context and intent
- **Relevance Scoring**: Ranks results 0-100
- **Auto-Navigation**: Switches to best match automatically

### 3. Settings Management

```typescript
interface ExtensionSettings {
  apiKey: string;                    // Google Gemini API key
  groupingMethod: 'hostname' | 'thematic';
  isEnabled: boolean;                // Extension on/off
  customPrompt: string;              // AI prompt customization
}
```

## 📡 Chrome APIs & Permissions

### Required Permissions
```json
{
  "permissions": [
    "tabs",         // Read tab information
    "tabGroups",    // Create and manage groups
    "storage",      // Settings persistence
    "contextMenus", // Right-click integration
    "activeTab"     // Current tab access
  ],
  "host_permissions": ["https://*/*", "http://*/*"]
}
```

### Key API Usage

```typescript
// Tab Management
const tabs = await chrome.tabs.query({});
const groupId = await chrome.tabs.group({ tabIds });
await chrome.tabGroups.update(groupId, { title, color });

// Settings Storage
await chrome.storage.sync.set({ settings });
const result = await chrome.storage.sync.get('settings');

// Message Passing
chrome.runtime.sendMessage({ type: 'GROUP_TABS' });
```

## 🎨 User Interface

### Popup Interface
- 🔘 **Enable/Disable Toggle**: Quick on/off control
- 📊 **Method Display**: Shows current grouping method
- 🚀 **Group Tabs Button**: Manual grouping trigger
- ⚙️ **Settings Access**: Opens configuration page

### Options Page
- 🔄 **Method Selection**: Hostname vs AI grouping
- 🔑 **API Key Input**: Secure Gemini key storage
- 📝 **Custom Prompts**: AI instruction customization
- 📖 **Usage Guide**: Keyboard shortcuts and tips

### Search Interface
- 🔍 **Query Input**: Natural language search
- ⚡ **Instant Results**: Real-time AI processing
- 🎯 **Auto-Switch**: Jumps to best match

## 🚀 Performance Optimizations

### Before vs After ExtensionManager

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Settings Reads** | 3-5 per operation | 1 per session | 🔥 80% reduction |
| **Background Script** | 214 lines | 16 lines | ⚡ 92% reduction |
| **Static Methods** | 27 methods | 0 methods | ✅ 100% elimination |
| **Code Duplication** | High | None | 🎯 Complete cleanup |

### Caching Strategy
```typescript
// Settings cached after first load
async getSettings(): Promise<ExtensionSettings> {
  if (this.settings) return this.settings;      // Cache hit
  this.settings = await this.loadSettings();    // Cache miss
  return this.settings;
}
```

## 🎯 Usage

### Keyboard Shortcuts
- `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`): Group tabs
- `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`): Search tabs

### Context Menu
- Right-click any page → **Group Tabs**
- Right-click any page → **Search Tabs**

### API Key Setup
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open extension → **Settings**
3. Paste API key → Auto-saved
4. Select **Thematic** grouping method

## 🛠️ Extending the Extension

### Adding New Grouping Methods

1. **Update Types**
```typescript
type GroupingMethod = 'hostname' | 'thematic' | 'your-method';
```

2. **Implement Logic**
```typescript
// In ExtensionManager
private async performTabGrouping(settings: ExtensionSettings) {
  switch (settings.groupingMethod) {
    case 'your-method':
      suggestions = await this.yourCustomGrouping(tabs);
      break;
  }
}
```

3. **Add UI Option**
```typescript
// In Options.tsx
<option value="your-method">Your Method</option>
```

### Custom AI Prompts

The extension supports custom AI prompts for specialized grouping:

```typescript
const customPrompt = `
Group tabs for a ${userRole}:
- Focus on ${primaryCriteria}
- Consider ${secondaryCriteria}
- Tabs: {tabs}
`;
```

### Development Guidelines
- ✅ Use ExtensionManager for new features
- ✅ Implement proper error handling
- ✅ Add TypeScript types for all APIs
- ✅ Test across Chrome/Edge browsers
- ✅ Update documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

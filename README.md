# Tab Group Collie - Developer Documentation

A Chrome extension built with TypeScript, Vite, and React that automatically groups browser tabs based on configurable criteria.

## 🏗️ Project Structure

```
Tab-Group-Collie/
├── src/
│   ├── background.ts              # Service worker for background operations
│   ├── popup/
│   │   ├── main.tsx              # Popup entry point
│   │   └── Popup.tsx             # Main popup component
│   ├── options/
│   │   ├── main.tsx              # Options page entry point
│   │   └── Options.tsx           # Settings page component
│   ├── utils/
│   │   ├── useChromeStorage.ts   # React hook for Chrome storage
│   │   └── tabGrouper.ts         # Core tab grouping logic
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── icons/                        # Extension icons (SVG format)
├── popup.html                    # Popup HTML template
├── options.html                  # Options page HTML template
├── manifest.config.ts            # Dynamic manifest configuration
├── vite.config.ts               # Vite build configuration
└── dist/                        # Built extension (generated)
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Chrome browser

### Installation
```bash
git clone <repository-url>
cd Tab-Group-Collie
npm install
```

### Development
```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build
```

### Testing in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked extension"
4. Select the `dist/` folder

## 🏛️ Architecture

### Manifest V3 Components

**Background Service Worker** (`src/background.ts`)
- Handles extension lifecycle events
- Manages context menus and keyboard shortcuts
- Coordinates tab grouping operations
- Ephemeral - automatically terminated when inactive

**Popup UI** (`src/popup/`)
- React-based interface for manual tab grouping
- Toggle extension on/off
- Access to settings page
- Status feedback for grouping operations

**Options Page** (`src/options/`)
- Settings configuration interface
- API key management
- Grouping method selection
- Usage instructions

### Core Logic

**TabGrouper Class** (`src/utils/tabGrouper.ts`)
```typescript
class TabGrouper {
  // Get all open tabs
  static async getAllTabs(): Promise<TabInfo[]>
  
  // Grouping strategies
  static groupByHostname(tabs: TabInfo[]): GroupSuggestion[]
  static groupByTitle(tabs: TabInfo[]): GroupSuggestion[]
  static async groupThematically(tabs: TabInfo[], apiKey?: string): Promise<GroupSuggestion[]>
  
  // Execute grouping
  static async createTabGroups(suggestions: GroupSuggestion[]): Promise<void>
}
```

**Storage Hook** (`src/utils/useChromeStorage.ts`)
```typescript
function useChromeStorage<T>(
  key: string,
  initialValue: T,
  storageArea: 'local' | 'sync' = 'sync'
): [T, (value: T) => void, boolean]
```

## 🔧 Build System

### Vite Configuration
- **CRXJS Plugin**: Handles Chrome extension-specific build requirements
- **Multi-entry**: Supports popup, options, and background script
- **HMR Support**: Real-time updates during development
- **Asset Handling**: Proper relative paths for chrome-extension:// protocol

### Key Build Features
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  base: './',  // Relative paths for extension
  build: {
    sourcemap: true,  // Debug support
    rollupOptions: {
      output: {
        // Predictable filenames (no hashing)
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'assets/js/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
```

## 📡 Chrome APIs Used

### Permissions Required
```json
{
  "permissions": [
    "tabs",        // Access tab information
    "tabGroups",   // Create and manage tab groups
    "storage",     // Persist settings
    "contextMenus", // Right-click menu
    "activeTab"    // Current tab access
  ],
  "host_permissions": [
    "https://*/*", // Web page access
    "http://*/*"
  ]
}
```

### Key API Usage

**Tab Management**
```typescript
// Get all tabs
const tabs = await chrome.tabs.query({});

// Create tab group
const groupId = await chrome.tabs.group({ tabIds });
await chrome.tabGroups.update(groupId, { title, color });
```

**Storage**
```typescript
// Save settings
await chrome.storage.sync.set({ settings });

// Load settings
const result = await chrome.storage.sync.get('settings');
```

**Message Passing**
```typescript
// Background → Popup
chrome.runtime.sendMessage({ type: 'GROUP_TABS' });

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle message
});
```

## 🎯 Grouping Algorithms

### 1. Hostname Grouping
Groups tabs by domain name. Uses URL parsing to extract hostname and groups tabs with identical domains.

```typescript
static groupByHostname(tabs: TabInfo[]): GroupSuggestion[] {
  const groups = new Map<string, TabInfo[]>();
  tabs.forEach(tab => {
    const hostname = new URL(tab.url).hostname;
    // Group logic...
  });
}
```

### 2. Title Grouping
Groups tabs by title similarity. Takes first 3 words of page title as grouping key.

### 3. Thematic Grouping
Uses predefined patterns to group related sites:
- **Social**: Twitter, Facebook, Instagram, etc.
- **Development**: GitHub, Stack Overflow, etc.
- **AI**: ChatGPT, Claude, Gemini, etc.
- **Google**: Gmail, Drive, Docs, etc.
- **Media**: YouTube, Netflix, etc.

## 🎨 UI Components

### Popup Component Features
- Extension enable/disable toggle
- Current grouping method display
- Manual grouping trigger
- Settings page access
- Operation status feedback

### Options Component Features
- Grouping method selection (radio buttons)
- API key input (for future AI integration)
- Usage instructions
- Auto-save functionality

## 🔄 Development Workflow

### Hot Module Replacement (HMR)
The CRXJS plugin provides HMR for all extension components:
- **Popup/Options**: Instant React updates
- **Background Script**: Auto-reload on changes
- **Content Scripts**: Dynamic injection updates

### Debugging

**Background Script**
- `chrome://extensions/` → Click "service worker" link
- Use `chrome://serviceworker-internals/` for less intrusive logging

**Popup/Options**
- Right-click extension icon → "Inspect popup"
- Standard DevTools for React debugging

**Storage Inspection**
- DevTools → Application → Storage → Extension Storage

## 🚀 Extension Distribution

### Development Build
```bash
npm run dev
# Load dist/ folder as unpacked extension
```

### Production Build
```bash
npm run build
# Creates optimized dist/ folder
# Zip dist/ folder for Chrome Web Store
```

### Manifest V3 Considerations
- Service worker lifecycle management
- Promise-based APIs (no callbacks)
- Enhanced security model
- Declarative permissions

## 🧩 Extensibility

### Adding New Grouping Methods
1. Add method to `GroupingMethod` type
2. Implement logic in `TabGrouper` class
3. Add UI option in `Options.tsx`
4. Update background script switch statement

### API Integration
The extension is structured to support external APIs for enhanced grouping:
- API key storage already implemented
- Async grouping method support
- Error handling for API failures

## 📝 Type Definitions

```typescript
interface ExtensionSettings {
  apiKey: string;
  groupingMethod: GroupingMethod;
  isEnabled: boolean;
}

interface TabInfo {
  id: number;
  title: string;
  url: string;
  hostname: string;
  favicon?: string;
}

interface GroupSuggestion {
  tabs: TabInfo[];
  groupName: string;
  color: chrome.tabGroups.ColorEnum;
  reason: string;
}
```

## 🛡️ Security Considerations

- API keys stored in `chrome.storage.sync` (not encrypted)
- Host permissions limited to HTTP/HTTPS
- No eval() or unsafe JavaScript execution
- Content Security Policy compliant

## 📚 Dependencies

### Runtime
- React 18+ (UI framework)
- React DOM (DOM rendering)

### Development
- TypeScript (type safety)
- Vite (build tool)
- @crxjs/vite-plugin (extension build support)
- @types/chrome (Chrome API types)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with TypeScript types
4. Test in Chrome
5. Submit pull request

### Code Style
- Use TypeScript strict mode
- Follow React functional component patterns
- Implement proper error handling
- Add JSDoc comments for public APIs